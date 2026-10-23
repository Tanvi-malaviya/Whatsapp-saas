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

    public function index(Request $request): Response
    {
        $org = $this->resolveOrg($request);

        $conversations = Conversation::where('organization_id', $org->id)
            ->with(['messages' => fn ($q) => $q->orderBy('created_at', 'asc')])
            ->orderBy('last_message_at', 'desc')
            ->get();

        $channels = WhatsAppChannel::where('organization_id', $org->id)->get();

        $realThreads = $conversations->map(function ($c) use ($channels) {
            $lastMsg = $c->messages->last();
            $windowMinutes = $c->window_expires_at ? max(0, (int) now()->diffInMinutes($c->window_expires_at, false)) : 0;
            $channelObj = $channels->firstWhere('phone_number_id', $c->channel_phone_number_id) ?? $channels->first();

            return [
                'id' => (string) $c->id,
                'contactName' => $c->contact_name ?: $c->contact_phone,
                'phone' => $c->contact_phone,
                'channel' => $channelObj ? $channelObj->name : 'DukanHisab',
                'lastMessage' => $lastMsg ? $lastMsg->content : 'No messages',
                'time' => $c->last_message_at ? $c->last_message_at->diffForHumans() : 'Just now',
                'unread' => 0,
                'windowRemaining' => $windowMinutes > 0 ? floor($windowMinutes / 60) . 'h ' . ($windowMinutes % 60) . 'm' : 'Closed',
                'stage' => 'New',
                'label' => 'Prospect',
                'status' => $c->status,
                'messages' => $c->messages->map(fn ($m) => [
                    'id' => (string) $m->id,
                    'sender' => $m->direction === 'inbound' ? 'contact' : ($m->sender_type === 'bot' ? 'bot' : 'agent'),
                    'text' => $m->content,
                    'time' => $m->created_at ? $m->created_at->format('h:i A') : '',
                ])->values()->all(),
            ];
        })->values()->all();

        return Inertia::render('inbox/index', [
            'initialThreads' => $realThreads,
            'channels' => $channels,
        ]);
    }

    public function reply(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'required|string',
            'message' => 'required|string',
        ]);

        $org = $this->resolveOrg($request);
        $conversation = Conversation::where('organization_id', $org->id)
            ->where('id', $validated['conversation_id'])
            ->first();

        if (! $conversation) {
            return response()->json(['success' => false, 'message' => 'Conversation not found'], 404);
        }

        // Store outbound agent message in database
        $msg = Message::create([
            'conversation_id' => $conversation->id,
            'organization_id' => $org->id,
            'direction' => 'outbound',
            'sender_type' => 'agent',
            'sender_id' => (string) ($request->user()?->id ?? 'agent'),
            'type' => 'text',
            'content' => $validated['message'],
            'status' => 'sent',
            'meta_cost_paise' => 0,
        ]);

        $conversation->update(['last_message_at' => now()]);

        // Attempt live dispatch to Meta Cloud API if channel connected
        $channel = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->orderBy('is_default', 'desc')
            ->first();

        if ($channel && ! empty($channel->access_token) && ! empty($channel->phone_number_id)) {
            $cleanPhone = preg_replace('/\D/', '', $conversation->contact_phone);
            try {
                Http::withToken($channel->access_token)
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $cleanPhone,
                        'type' => 'text',
                        'text' => [
                            'preview_url' => false,
                            'body' => $validated['message'],
                        ],
                    ]);
            } catch (\Throwable $e) {
                // Log and continue
            }
        }

        return response()->json([
            'success' => true,
            'message' => [
                'id' => (string) $msg->id,
                'sender' => 'agent',
                'text' => $msg->content,
                'time' => now()->format('h:i A'),
            ],
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
}
