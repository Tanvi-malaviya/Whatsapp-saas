<?php

namespace App\Modules\Messaging\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Http\Controllers\MetaWebhookController;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    private function resolveOrg(Request $request): Organization
    {
        $orgId = TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        return Organization::find($orgId);
    }

    private function drainPendingWebhooks($org): void
    {
        $pending = \App\Modules\Messaging\Models\WebhookInbox::where('organization_id', $org->id)
            ->where('status', 'pending')
            ->take(50)
            ->get();
        if ($pending->isNotEmpty()) {
            $webhookController = app(\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class);
            foreach ($pending as $wh) {
                try {
                    $webhookController->process($wh->id);
                } catch (\Throwable $t) {}
            }
        }
    }

    protected function getRealThreads($org): array
    {
        $this->drainPendingWebhooks($org);

        $conversations = Conversation::where('organization_id', $org->id)
            ->with(['messages' => fn($q) => $q->orderBy('created_at', 'asc')])
            ->orderBy('last_message_at', 'desc')
            ->get();

        $channels = WhatsAppChannel::where('organization_id', $org->id)->get();

        return $conversations->map(function ($c) use ($channels) {
            $lastMsg = $c->messages->last();
            $windowMinutes = $c->window_expires_at ? max(0, (int) now()->diffInMinutes($c->window_expires_at, false)) : 0;
            $channelObj = $channels->firstWhere('phone_number_id', $c->channel_phone_number_id) ?? $channels->first();

            return [
                'id' => (string) $c->id,
                'contactName' => $c->contact_name ?: $c->contact_phone,
                'phone' => $c->contact_phone,
                'channel' => $channelObj ? $channelObj->name : 'WhatsApp',
                'lastMessage' => $lastMsg ? $lastMsg->content : 'No messages',
                'lastMessageStatus' => $lastMsg ? $lastMsg->status : null,
                'lastMessageDirection' => $lastMsg ? $lastMsg->direction : null,
                'time' => $c->last_message_at ? $c->last_message_at->timezone('Asia/Kolkata')->diffForHumans() : 'Just now',
                'unread' => $c->unread_count,
                'channelId' => $channelObj?->id,
                'assignedUserId' => $c->assigned_user_id,
                'windowRemaining' => $windowMinutes > 0 ? floor($windowMinutes / 60) . 'h ' . ($windowMinutes % 60) . 'm' : 'Closed',
                'stage' => $c->pipeline_stage ?: 'New',
                'label' => $c->label ?: 'Prospect',
                'status' => $c->status,
                'messages' => $c->messages->map(fn($m) => [
                    'id' => (string) $m->id,
                    'sender' => $m->direction === 'inbound' ? 'contact' : ($m->sender_type === 'bot' ? 'bot' : 'agent'),
                    'text' => $m->content,
                    'time' => $m->created_at ? $m->created_at->timezone('Asia/Kolkata')->format('h:i A') : '',
                    'status' => $m->status ?? 'sent',
                    'failureReason' => $m->metadata['failure_reason'] ?? null,
                    'attachment' => ! empty($m->metadata['media_path']) ? ['name' => $m->metadata['filename'] ?? 'Attachment', 'type' => $m->type === 'image' ? 'image' : 'document', 'url' => '/inbox/messages/'.$m->id.'/attachment'] : null,
                ])->values()->all(),
            ];
        })->values()->all();
    }

    public function index(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        $realThreads = $this->getRealThreads($org);
        $channels = WhatsAppChannel::where('organization_id', $org->id)->get();
        $channel = $channels->where('is_default', true)->first() ?? $channels->first();
        $metaTemplates = $channel ? app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class)->getMetaTemplates($channel) : [];

        return Inertia::render('inbox/index', [
            'initialThreads' => $realThreads,
            'channels' => $channels,
            'metaTemplates' => $metaTemplates,
            'members' => $org->users()->get(['users.id', 'name']),
        ]);
    }

    public function sync(Request $request): JsonResponse
    {
        $org = $this->resolveOrg($request);
        $realThreads = $this->getRealThreads($org);

        return response()->json([
            'success' => true,
            'threads' => $realThreads,
        ]);
    }

    public function reply(Request $request): JsonResponse
    {
        $data = $request->validate([
            'conversation_id' => 'required|uuid', 'type' => 'nullable|in:text,template,image,document',
            'template_name' => 'nullable|string', 'template_language' => 'nullable|string', 'message' => 'nullable|string|max:4096',
            'parameters' => 'nullable|array', 'header_url' => 'nullable|url:https', 'header_parameters' => 'nullable|array', 'button_parameters' => 'nullable|array',
            'attachment' => 'nullable|file|mimes:jpg,jpeg,png,webp,pdf,txt,csv,doc,docx,xls,xlsx,ppt,pptx|max:51200',
        ]);
        $conversation = Conversation::findOrFail($data['conversation_id']);
        $channel = WhatsAppChannel::where('organization_id', $conversation->organization_id)->where('phone_number_id', $conversation->channel_phone_number_id)->where('status', 'connected')->firstOrFail();
        $type = $data['type'] ?? 'text'; $text = trim($data['message'] ?? '');
        $payload = ['to' => preg_replace('/\D/', '', $conversation->contact_phone)]; $metadata = null;
        if ($type === 'template') {
            abort_unless($conversation->is_opted_in, 422, 'This contact has opted out.');
            $template = collect(app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class)->getMetaTemplates($channel))->first(fn ($t) => $t['name'] === ($data['template_name'] ?? '') && $t['language'] === ($data['template_language'] ?? ''));
            abort_unless($template, 422, 'Choose an approved template for this conversation’s number.');
            $built = app(\App\Services\TemplatePayload::class)->build($template, $data);
            $payload += ['type' => 'template', 'template' => $built['template']]; $text = $built['content'];
        } else {
            abort_unless($conversation->isWindowOpen(), 422, 'The customer-service window is closed. Send an approved template.');
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment'); $mime = $file->getMimeType(); $type = str_starts_with($mime, 'image/') ? 'image' : 'document';
                $media = Http::withToken($channel->access_token)->timeout(30)->attach('file', $file->getContent(), basename($file->getClientOriginalName()), ['Content-Type' => $mime])->post(\App\Services\MetaApi::base().'/'.$channel->phone_number_id.'/media', ['messaging_product' => 'whatsapp', 'type' => $mime]);
                abort_unless($media->successful() && $media->json('id'), 422, 'Meta could not upload the attachment.');
                $payload += ['type' => $type, $type => ['id' => $media->json('id'), ...($text ? ['caption' => $text] : []), ...($type === 'document' ? ['filename' => basename($file->getClientOriginalName())] : [])]];
                $path = $file->store('messages/'.$conversation->organization_id, 'local');
                $metadata = ['media_path' => $path, 'mime_type' => $mime, 'filename' => basename($file->getClientOriginalName())];
                $text = $text ?: basename($file->getClientOriginalName());
            } else {
                abort_unless($text !== '', 422, 'Enter a message.');
                $payload += ['type' => 'text', 'text' => ['body' => $text, 'preview_url' => false]];
            }
        }
        $message = Message::create(['organization_id' => $conversation->organization_id, 'conversation_id' => $conversation->id, 'direction' => 'outbound', 'sender_type' => 'agent', 'sender_id' => (string) $request->user()->id, 'type' => $type, 'content' => $text, 'status' => 'queued', 'metadata' => $metadata]);
        try {
            $wamid = app(\App\Services\MetaApi::class)->send($channel, $payload);
            $message->update(['wamid' => $wamid, 'status' => 'sent']);
        } catch (\Throwable $error) {
            $meta = $metadata ?? [];
            $meta['failure_reason'] = $error->getMessage();
            $message->update(['status' => 'failed', 'metadata' => $meta]);
            throw $error;
        }
        $conversation->update(['last_message_at' => now()]);
        return response()->json(['success' => true, 'message' => ['id' => $message->id, 'sender' => 'agent', 'text' => $text, 'time' => now(TenantContext::timezone())->format('h:i A'), 'status' => 'sent', 'attachment' => $metadata ? ['name' => $metadata['filename'], 'type' => $type, 'url' => '/inbox/messages/'.$message->id.'/attachment'] : null]]);
    }

    public function attachment(string $id)
    {
        $message = Message::findOrFail($id); $meta = $message->metadata;
        abort_unless(! empty($meta['media_path']) && \Illuminate\Support\Facades\Storage::disk('local')->exists($meta['media_path']), 404);
        return \Illuminate\Support\Facades\Storage::disk('local')->download($meta['media_path'], $meta['filename'] ?? 'attachment', ['X-Content-Type-Options' => 'nosniff']);
    }

    public function markRead(Request $request, string $id)
    {
        Conversation::findOrFail($id)->update(['unread_count' => 0]); return response()->json(['success' => true]);
    }

    public function assign(Request $request, string $id)
    {
        $data = $request->validate(['assigned_user_id' => 'nullable|integer', 'resume_bot' => 'nullable|boolean']);
        $conversation = Conversation::findOrFail($id);
        $userId = $data['assigned_user_id'] ?? null;
        abort_unless($request->user()->isAdminOf(TenantContext::get()) || $request->user()->isSuperAdmin(), 403);
        abort_if($userId && ! TenantContext::get()->users()->where('users.id', $userId)->exists(), 422, 'Choose a member of this workspace.');
        $conversation->update(['assigned_user_id' => $userId, 'bot_state' => $request->boolean('resume_bot') ? null : ['handoff' => true]]);
        return response()->json(['success' => true]);
    }

    public function updateContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'required|string',
            'contact_name' => 'required|string|max:100',
            'status' => 'nullable|string|in:open,resolved,bot_handled',
            'pipeline_stage' => 'nullable|string|max:50',
            'label' => 'nullable|string|max:50',
        ]);

        $org = $this->resolveOrg($request);
        $conversation = Conversation::where('organization_id', $org->id)
            ->where('id', $validated['conversation_id'])
            ->first();

        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Conversation not found'], 404);
        }

        $updateData = [
            'contact_name' => trim($validated['contact_name']),
        ];

        if (!empty($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }

        if (!empty($validated['pipeline_stage'])) {
            $updateData['pipeline_stage'] = $validated['pipeline_stage'];
        }

        if (!empty($validated['label'])) {
            $updateData['label'] = $validated['label'];
        }

        $conversation->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Contact and pipeline details updated successfully',
            'contact_name' => $conversation->contact_name,
            'status' => $conversation->status,
            'pipeline_stage' => $conversation->pipeline_stage,
            'label' => $conversation->label,
        ]);
    }

    public function startConversation(Request $request): JsonResponse
    {
        $data = $request->validate(['phone' => 'required|string|max:30', 'name' => 'nullable|string|max:100', 'channel_id' => 'required|uuid', 'consent_confirmed' => 'accepted']);
        $org = $this->resolveOrg($request); $channel = WhatsAppChannel::where('status', 'connected')->findOrFail($data['channel_id']);
        $phone = (new \App\Shared\PhoneNumber($data['phone']))->getE164();
        abort_if(\App\Modules\Crm\Models\Contact::where('contact_phone', $phone)->where('is_opted_in', false)->exists(), 422, 'This contact opted out.');
        $conversation = Conversation::firstOrCreate(['organization_id' => $org->id, 'channel_phone_number_id' => $channel->phone_number_id, 'contact_phone' => $phone], ['channel_id' => $channel->id, 'contact_name' => $data['name'] ?? $phone, 'is_opted_in' => true, 'status' => 'open']);
        $request->merge(['conversation_id' => $conversation->id]);
        $this->reply($request);
        return response()->json(['success' => true, 'conversation_id' => $conversation->id, 'message' => 'Message accepted by Meta.', 'meta_delivered' => true]);
    }

    public function simulateInbound(Request $request): JsonResponse
    {
        abort_unless(app()->environment('local', 'testing'), 403, 'Simulation is available in development only.');
        return response()->json(['success' => false, 'message' => 'Use a signed webhook payload to test the complete message flow.'], 422);
    }

    public function history(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        $conversations = Conversation::where('organization_id', $org->id)
            ->with(['messages' => fn($q) => $q->orderBy('created_at', 'asc')])
            ->orderByDesc('updated_at')
            ->get();

        $defaultChannel = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->value('name') ?? 'WhatsApp';

        $sessions = $conversations->map(function ($c) use ($defaultChannel) {
            $msgs = $c->messages;
            $firstMsg = $msgs->first();
            $lastMsg = $msgs->last();
            $duration = '5m';
            if ($firstMsg && $lastMsg && $firstMsg->created_at && $lastMsg->created_at) {
                $mins = max(1, $firstMsg->created_at->diffInMinutes($lastMsg->created_at));
                $duration = $mins >= 60 ? floor($mins / 60) . 'h ' . ($mins % 60) . 'm' : $mins . 'm';
            }

            return [
                'id' => (string) $c->id,
                'contactName' => $c->contact_name ?: $c->contact_phone,
                'phone' => $c->contact_phone,
                'channel' => $defaultChannel,
                'agent' => 'Support Agent',
                'status' => $c->status === 'resolved' ? 'Resolved' : ($c->status === 'bot_handled' ? 'Auto-Closed' : 'Active'),
                'messagesCount' => $msgs->count(),
                'duration' => $duration,
                'closedAt' => $c->updated_at ? $c->updated_at->timezone('Asia/Kolkata')->format('M d, h:i A') : 'Recently',
                'summary' => $lastMsg ? $lastMsg->content : 'No messages recorded',
                'transcript' => $msgs->map(fn($m) => [
                    'sender' => $m->direction === 'inbound' ? 'contact' : ($m->sender_type === 'bot' ? 'bot' : 'agent'),
                    'text' => $m->content,
                    'time' => $m->created_at ? $m->created_at->timezone('Asia/Kolkata')->format('h:i A') : '',
                ])->values()->all(),
            ];
        })->values()->all();

        return Inertia::render('inbox/history', [
            'initialSessions' => $sessions,
        ]);
    }

    public function stages(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        $conversations = Conversation::where('organization_id', $org->id)
            ->with(['messages' => fn($q) => $q->latest()->take(1)])
            ->orderByDesc('updated_at')
            ->get();

        $leads = $conversations->map(function ($c) {
            $lastMsg = $c->messages->first();
            $daysInStage = $c->updated_at ? max(1, (int) $c->updated_at->diffInDays(now())) : 1;

            return [
                'id' => (string) $c->id,
                'contactName' => $c->contact_name ?: $c->contact_phone,
                'phone' => $c->contact_phone,
                'dealValue' => 0,
                'interest' => $c->label ?: 'WhatsApp Prospect',
                'stage' => in_array($c->pipeline_stage, ['New', 'Qualified', 'Proposal', 'Won', 'Lost']) ? $c->pipeline_stage : 'New',
                'daysInStage' => $daysInStage,
                'lastActive' => $c->last_message_at ? $c->last_message_at->timezone('Asia/Kolkata')->diffForHumans() : 'Just now',
                'lastMessage' => $lastMsg ? $lastMsg->content : '',
                'status' => $c->status,
            ];
        })->values()->all();

        return Inertia::render('inbox/stages', [
            'initialLeads' => $leads,
        ]);
    }

    public function updateStage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'required|string',
            'stage' => 'required|string',
        ]);

        $org = $this->resolveOrg($request);
        $conversation = Conversation::where('organization_id', $org->id)
            ->where('id', $validated['conversation_id'])
            ->first();

        if (!$conversation) {
            return response()->json(['success' => false, 'message' => 'Conversation not found'], 404);
        }

        $conversation->update(['pipeline_stage' => $validated['stage']]);

        return response()->json(['success' => true, 'message' => 'Stage updated successfully']);
    }

}
