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
            ?? $request->user()?->organizations()->first()?->id
            ?? Organization::first()?->id;

        return Organization::find($orgId) ?? Organization::first();
    }

    protected function getRealThreads($org): array
    {
        $conversations = Conversation::where('organization_id', $org->id)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at', 'asc')])
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
                'time' => $c->last_message_at ? $c->last_message_at->timezone('Asia/Kolkata')->diffForHumans() : 'Just now',
                'unread' => 0,
                'windowRemaining' => $windowMinutes > 0 ? floor($windowMinutes / 60) . 'h ' . ($windowMinutes % 60) . 'm' : 'Closed',
                'stage' => $c->pipeline_stage ?: 'New',
                'label' => $c->label ?: 'Prospect',
                'status' => $c->status,
                'messages' => $c->messages->map(fn ($m) => [
                    'id' => (string) $m->id,
                    'sender' => $m->direction === 'inbound' ? 'contact' : ($m->sender_type === 'bot' ? 'bot' : 'agent'),
                    'text' => $m->content,
                    'time' => $m->created_at ? $m->created_at->timezone('Asia/Kolkata')->format('h:i A') : '',
                    'status' => $m->status ?? 'sent',
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
        $validated = $request->validate([
            'conversation_id' => 'required|string',
            'type' => 'nullable|string|in:text,template,image,document',
            'template_name' => 'nullable|string',
            'template_language' => 'nullable|string',
            'message' => 'nullable|string',
            'attachment' => 'nullable|file|max:51200', // Up to 50MB
            'attachment_name' => 'nullable|string',
            'attachment_type' => 'nullable|string',
        ]);

        $org = $this->resolveOrg($request);
        $conversation = Conversation::where('organization_id', $org->id)
            ->where('id', $validated['conversation_id'])
            ->first();

        if (! $conversation) {
            return response()->json(['success' => false, 'message' => 'Conversation not found'], 404);
        }

        $isTemplate = ($request->input('type') === 'template') || $request->filled('template_name');
        $hasAttachment = $request->hasFile('attachment');
        $uploadedFile = $hasAttachment ? $request->file('attachment') : null;
        $messageText = trim($request->input('message') ?? '');
        $attachmentName = $request->input('attachment_name') ?: ($uploadedFile ? $uploadedFile->getClientOriginalName() : null);

        // Store attachment locally if uploaded
        $storedPath = null;
        if ($uploadedFile) {
            $storedPath = $uploadedFile->store('attachments', 'public');
        }

        // Channel resolution
        $channel = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->orderBy('is_default', 'desc')
            ->first();

        // Determine message type and database content
        $msgType = 'text';
        $finalContent = $messageText;
        $templatePayload = null;

        if ($isTemplate) {
            $msgType = 'template';
            $templateName = $request->input('template_name', 'dukanhisab_app_launch');
            $campaignCtrl = app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class);
            $allTemplates = $channel ? $campaignCtrl->getMetaTemplates($channel) : [];
            $matchedTemplate = collect($allTemplates)->firstWhere('name', $templateName);

            if (! $matchedTemplate && ! empty($allTemplates)) {
                $matchedTemplate = $allTemplates[0];
                $templateName = $matchedTemplate['name'];
            }

            $templateLanguage = $matchedTemplate['language'] ?? $request->input('template_language', 'gu');
            $matchedHeaderFormat = $matchedTemplate['headerFormat'] ?? $matchedTemplate['header_format'] ?? null;
            $templateBodyTemplate = $matchedTemplate['body'] ?? '';
            $matchedHeaderUrl = $matchedTemplate['headerUrl'] ?? null;
            $contactName = $conversation->contact_name ?: 'Valued Customer';
            $orgName = $org->name ?? 'DukanHisab Store';

            $tplData = $this->buildTemplateComponentsAndContent(
                $templateName,
                $contactName,
                $orgName,
                $matchedHeaderFormat,
                $matchedHeaderUrl,
                $templateBodyTemplate
            );

            $cleanPhone = preg_replace('/\D/', '', $conversation->contact_phone);
            $templatePayload = [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $cleanPhone,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => ['code' => $templateLanguage],
                ],
            ];

            if (! empty($tplData['components'])) {
                $templatePayload['template']['components'] = $tplData['components'];
            }

            $finalContent = $tplData['finalContent'];
        } elseif ($hasAttachment && $attachmentName) {
            $ext = strtolower(pathinfo($attachmentName, PATHINFO_EXTENSION));
            $isImage = in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif']);
            $msgType = $isImage ? 'image' : 'document';
            $finalContent = $messageText ? "[{$attachmentName}] {$messageText}" : "📎 {$attachmentName}";
        }

        // Store outbound agent message in database
        $msg = Message::create([
            'conversation_id' => $conversation->id,
            'organization_id' => $org->id,
            'direction' => 'outbound',
            'sender_type' => 'agent',
            'sender_id' => (string) ($request->user()?->id ?? 'agent'),
            'type' => $msgType,
            'content' => $finalContent,
            'status' => 'sent',
            'meta_cost_paise' => 0,
        ]);

        $conversation->update(['last_message_at' => now()]);

        // Attempt live dispatch to Meta Cloud API if channel connected
        if ($channel && ! empty($channel->access_token) && ! empty($channel->phone_number_id)) {
            $cleanPhone = preg_replace('/\D/', '', $conversation->contact_phone);
            try {
                if ($isTemplate && $templatePayload) {
                    $resp = Http::withToken($channel->access_token)
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $templatePayload);
                } elseif ($hasAttachment && $uploadedFile) {
                    $mime = $uploadedFile->getMimeType() ?: 'application/octet-stream';
                    $ext = strtolower(pathinfo($attachmentName, PATHINFO_EXTENSION));
                    $isImage = in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif']);
                    $mediaType = $isImage ? 'image' : 'document';

                    // 1. Upload to Meta Media API
                    $mediaResp = Http::withToken($channel->access_token)
                        ->attach('file', file_get_contents($uploadedFile->getRealPath()), $attachmentName, ['Content-Type' => $mime])
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/media", [
                            'messaging_product' => 'whatsapp',
                            'type' => $mime,
                        ]);

                    $mediaId = $mediaResp->successful() ? $mediaResp->json('id') : null;

                    if ($mediaId) {
                        // 2. Dispatch real WhatsApp media message (document or image) to recipient phone
                        $mediaPayload = ['id' => $mediaId];
                        if (! empty($messageText)) {
                            $mediaPayload['caption'] = $messageText;
                        }
                        if ($mediaType === 'document') {
                            $mediaPayload['filename'] = $attachmentName;
                        }

                        $resp = Http::withToken($channel->access_token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                                'messaging_product' => 'whatsapp',
                                'recipient_type' => 'individual',
                                'to' => $cleanPhone,
                                'type' => $mediaType,
                                $mediaType => $mediaPayload,
                            ]);
                    } else {
                        // Fallback to text message if media upload was rejected
                        $resp = Http::withToken($channel->access_token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                                'messaging_product' => 'whatsapp',
                                'recipient_type' => 'individual',
                                'to' => $cleanPhone,
                                'type' => 'text',
                                'text' => [
                                    'preview_url' => false,
                                    'body' => $finalContent,
                                ],
                            ]);
                    }
                } else {
                    // Standard text message
                    $resp = Http::withToken($channel->access_token)
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                            'messaging_product' => 'whatsapp',
                            'recipient_type' => 'individual',
                            'to' => $cleanPhone,
                            'type' => 'text',
                            'text' => [
                                'preview_url' => false,
                                'body' => $finalContent,
                            ],
                        ]);
                }

                if (isset($resp) && $resp->successful()) {
                    $wamid = $resp->json('messages.0.id');
                    if ($wamid) {
                        $msg->update(['wamid' => $wamid, 'status' => 'sent']);
                    }
                } else {
                    $errBody = isset($resp) ? $resp->body() : 'No response from Meta';
                    \Illuminate\Support\Facades\Log::error("Meta API error in reply(): {$errBody}");
                    $msg->update(['status' => 'failed']);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("Meta API exception in reply(): " . $e->getMessage());
                $msg->update(['status' => 'failed']);
            }
        }

        $freshMsg = $msg->fresh();

        return response()->json([
            'success' => true,
            'message' => [
                'id' => (string) $freshMsg->id,
                'sender' => 'agent',
                'text' => $freshMsg->content,
                'time' => now('Asia/Kolkata')->format('h:i A'),
                'status' => $freshMsg->status ?? 'sent',
            ],
        ]);
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

        if (! $conversation) {
            return response()->json(['success' => false, 'message' => 'Conversation not found'], 404);
        }

        $updateData = [
            'contact_name' => trim($validated['contact_name']),
        ];

        if (! empty($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }

        if (! empty($validated['pipeline_stage'])) {
            $updateData['pipeline_stage'] = $validated['pipeline_stage'];
        }

        if (! empty($validated['label'])) {
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
        $validated = $request->validate([
            'phone' => 'required|string',
            'name' => 'nullable|string',
            'message' => 'nullable|string',
            'type' => 'nullable|string|in:text,template',
            'template_name' => 'nullable|string',
        ]);

        $cleanPhone = (new \App\Shared\PhoneNumber($validated['phone']))->getE164();
        $name = $validated['name'] ?: $cleanPhone;
        $type = $validated['type'] ?? 'template';
        $messageText = $validated['message'] ?? '';
        $templateName = $validated['template_name'] ?? 'due_reminder_en';

        $org = $this->resolveOrg($request);
        TenantContext::set($org);

        $channel = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->orderBy('is_default', 'desc')
            ->first();

        $phoneId = $channel ? $channel->phone_number_id : '1324567864076715';
        $metaDelivered = false;
        $metaError = null;

        if ($channel && ! empty($channel->access_token) && ! empty($channel->phone_number_id)) {
            $digitsPhone = preg_replace('/\D/', '', $cleanPhone);
            try {
                if ($type === 'template') {
                    $campaignCtrl = app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class);
                    $allTemplates = $campaignCtrl->getMetaTemplates($channel);
                    $matchedTemplate = collect($allTemplates)->firstWhere('name', $templateName);
                    
                    if (!$matchedTemplate && !empty($allTemplates)) {
                        $matchedTemplate = $allTemplates[0];
                        $templateName = $matchedTemplate['name'];
                    }

                    $templateLanguage = $matchedTemplate['language'] ?? 'en_US';
                    $matchedHeaderFormat = $matchedTemplate['headerFormat'] ?? $matchedTemplate['header_format'] ?? null;
                    $templateBodyTemplate = $matchedTemplate['body'] ?? '';
                    $matchedHeaderUrl = $matchedTemplate['headerUrl'] ?? null;
                    $orgName = $org->name ?? 'DukanHisab Store';

                    $tplData = $this->buildTemplateComponentsAndContent(
                        $templateName,
                        $name ?: 'Customer',
                        $orgName,
                        $matchedHeaderFormat,
                        $matchedHeaderUrl,
                        $templateBodyTemplate
                    );

                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $digitsPhone,
                        'type' => 'template',
                        'template' => [
                            'name' => $templateName,
                            'language' => ['code' => $templateLanguage],
                        ],
                    ];

                    if (! empty($tplData['components'])) {
                        $payload['template']['components'] = $tplData['components'];
                    }

                    $savedContent = $tplData['finalContent'];
                } else {
                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $digitsPhone,
                        'type' => 'text',
                        'text' => [
                            'preview_url' => false,
                            'body' => $messageText ?: 'Hello from Sathwara WhatsApp SaaS!',
                        ],
                    ];
                    $savedContent = $messageText ?: 'Hello!';
                }

                $resp = Http::withToken($channel->access_token)
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $payload);

                if ($resp->successful()) {
                    $metaDelivered = true;
                } else {
                    $metaError = $resp->json('error.message') ?? 'Meta API error';
                }
            } catch (\Throwable $e) {
                $metaError = $e->getMessage();
            }
        }

        // Create or find conversation
        $conversation = Conversation::firstOrCreate(
            [
                'organization_id' => $org->id,
                'contact_phone' => $cleanPhone,
            ],
            [
                'contact_name' => $name,
                'channel_phone_number_id' => $phoneId,
                'status' => 'open',
                'window_expires_at' => now()->addHours(24),
                'last_message_at' => now(),
            ]
        );

        $conversation->update([
            'contact_name' => $name,
            'last_message_at' => now(),
            'window_expires_at' => now()->addHours(24),
        ]);

        Message::create([
            'conversation_id' => $conversation->id,
            'organization_id' => $org->id,
            'direction' => 'outbound',
            'sender_type' => 'agent',
            'sender_id' => (string) ($request->user()?->id ?? 'agent'),
            'type' => $type,
            'content' => $savedContent ?? ($messageText ?: 'Hello!'),
            'status' => $metaDelivered ? 'sent' : ($metaError ? 'failed' : 'sent'),
            'meta_cost_paise' => 0,
        ]);

        return response()->json([
            'success' => true,
            'conversation_id' => (string) $conversation->id,
            'message' => $metaDelivered 
                ? "Message dispatched to {$cleanPhone} and chat opened!" 
                : "Chat thread created for {$cleanPhone}." . ($metaError ? " (Meta notice: {$metaError})" : ''),
            'meta_delivered' => $metaDelivered,
            'meta_error' => $metaError,
        ]);
    }

    public function simulateInbound(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'name' => 'nullable|string',
            'message' => 'required|string',
        ]);

        $cleanPhone = (new \App\Shared\PhoneNumber($validated['phone']))->getE164();
        $name = $validated['name'] ?? 'WhatsApp User';
        $text = $validated['message'];

        $org = $this->resolveOrg($request);
        TenantContext::set($org);

        $channel = WhatsAppChannel::where('organization_id', $org->id)->first();
        $phoneId = $channel ? $channel->phone_number_id : '1324567864076715';

        // Find or create active conversation thread in current org
        $conversation = Conversation::firstOrCreate(
            [
                'organization_id' => $org->id,
                'contact_phone' => $cleanPhone,
            ],
            [
                'contact_name' => $name,
                'channel_phone_number_id' => $phoneId,
                'status' => 'open',
            ]
        );

        $conversation->update([
            'contact_name' => $name,
            'window_expires_at' => now()->addHours(24),
            'last_message_at' => now(),
        ]);

        // Store inbound message
        Message::create([
            'conversation_id' => $conversation->id,
            'organization_id' => $org->id,
            'direction' => 'inbound',
            'sender_type' => 'contact',
            'sender_id' => $cleanPhone,
            'wamid' => 'wamid.' . uniqid(),
            'type' => 'text',
            'content' => $text,
            'status' => 'received',
            'meta_cost_paise' => 0,
        ]);

        // Auto-reply bot if matching
        $botRule = \App\Modules\Bot\Models\BotRule::where('organization_id', $org->id)
            ->where('is_enabled', true)
            ->first();

        if ($botRule && !empty($botRule->reply_text)) {
            Message::create([
                'conversation_id' => $conversation->id,
                'organization_id' => $org->id,
                'direction' => 'outbound',
                'sender_type' => 'bot',
                'type' => 'text',
                'content' => $botRule->reply_text,
                'status' => 'sent',
                'meta_cost_paise' => 0,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => "Simulated inbound WhatsApp message from {$name} ({$cleanPhone}) processed successfully!",
        ]);
    }

    public function history(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        $conversations = Conversation::where('organization_id', $org->id)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at', 'asc')])
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
                'transcript' => $msgs->map(fn ($m) => [
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
            ->with(['messages' => fn ($q) => $q->latest()->take(1)])
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

        if (! $conversation) {
            return response()->json(['success' => false, 'message' => 'Conversation not found'], 404);
        }

        $conversation->update(['pipeline_stage' => $validated['stage']]);

        return response()->json(['success' => true, 'message' => 'Stage updated successfully']);
    }

    protected function buildTemplateComponentsAndContent(
        string $templateName,
        string $contactName,
        string $orgName,
        ?string $matchedHeaderFormat,
        ?string $matchedHeaderUrl,
        string $templateBodyTemplate
    ): array {
        $components = [];
        $mediaHeaderUrl = null;

        // 1. Add Header component if template requires MEDIA format (VIDEO, IMAGE, DOCUMENT)
        if ($matchedHeaderFormat === 'VIDEO' || str_contains($templateName, 'launch') || str_contains($templateName, 'video')) {
            $mediaHeaderUrl = $matchedHeaderUrl ?: 'https://scontent.whatsapp.net/v/t61.29466-34/861420731_1135805725493070_8195379101910817431_n.mp4?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=LITLgyYzWeEQ7kNvwHswKjK&_nc_oc=Ado6rCu2_7HB01pE1X69FVXpB5pcIrgkalj2PtPnJIsl0WWGQlEIi7a7rOCPlmp_upNRcdeWjGxDJHqJJKJd58wt&_nc_zt=28&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=kDO078dsVyKTE9ewNT-Bcw&_nc_tpa=Q5bMBQL9vkinWT5IO5byDk_pcZOs1A8aVN_j9yEXgDc6ghJsKRjVKFBKUPwxCmbfiYbM9wMEB2DqXN99fA&oh=01_Q5Aa5wFTcGC0MZXLOwFyAlfJ1gUK2BGgUxKzkVfxyohM-21vKg&oe=6B0B9F7C';
            $components[] = [
                'type' => 'header',
                'parameters' => [
                    [
                        'type' => 'video',
                        'video' => [
                            'link' => $mediaHeaderUrl,
                        ],
                    ],
                ],
            ];
        } elseif ($matchedHeaderFormat === 'IMAGE') {
            $mediaHeaderUrl = $matchedHeaderUrl ?: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=800';
            $components[] = [
                'type' => 'header',
                'parameters' => [
                    [
                        'type' => 'image',
                        'image' => [
                            'link' => $mediaHeaderUrl,
                        ],
                    ],
                ],
            ];
        } elseif ($matchedHeaderFormat === 'DOCUMENT' || str_contains($templateName, 'invoice') || str_contains($templateName, 'purchase')) {
            $mediaHeaderUrl = $matchedHeaderUrl ?: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
            $components[] = [
                'type' => 'header',
                'parameters' => [
                    [
                        'type' => 'document',
                        'document' => [
                            'link' => $mediaHeaderUrl,
                            'filename' => 'Document_' . date('Ymd') . '.pdf',
                        ],
                    ],
                ],
            ];
        }

        // 2. Add Body component parameters ONLY if template contains variable placeholders {{1}}, {{2}}...
        preg_match_all('/\{\{(\d+)\}\}/', $templateBodyTemplate, $matches);
        $variableIndices = array_unique($matches[1] ?? []);
        sort($variableIndices);

        $renderedText = $templateBodyTemplate;

        if (! empty($variableIndices)) {
            $bodyParams = [];
            foreach ($variableIndices as $idx) {
                $val = match ((int) $idx) {
                    1 => $contactName ?: 'Customer',
                    2 => $orgName ?: 'DukanHisab Store',
                    3 => '₹500.00',
                    4 => date('d/m/Y'),
                    5 => '₹0.00',
                    6 => 'INV-' . date('Ymd') . '-01',
                    default => 'Detail',
                };
                $bodyParams[] = ['type' => 'text', 'text' => (string) $val];
                $renderedText = str_replace('{{' . $idx . '}}', (string) $val, $renderedText);
            }

            $components[] = [
                'type' => 'body',
                'parameters' => $bodyParams,
            ];
        }

        // 3. Dynamic URL Button parameters (for templates like due_reminder)
        if (str_contains($templateName, 'due_reminder')) {
            $components[] = [
                'type' => 'button',
                'sub_type' => 'url',
                'index' => '0',
                'parameters' => [
                    ['type' => 'text', 'text' => 'pay'],
                ],
            ];
        }

        $mediaPrefix = $mediaHeaderUrl ? "[Media: {$mediaHeaderUrl}]\n" : '';
        $finalContent = ! empty($renderedText)
            ? "[Broadcast Campaign: {$templateName} Template: {$templateName}]\n" . $mediaPrefix . $renderedText
            : "[Broadcast Campaign: {$templateName} Template: {$templateName}]\n" . $mediaPrefix . "Template dispatched to {$contactName}.";

        return [
            'components' => $components,
            'mediaHeaderUrl' => $mediaHeaderUrl,
            'finalContent' => $finalContent,
        ];
    }
}
