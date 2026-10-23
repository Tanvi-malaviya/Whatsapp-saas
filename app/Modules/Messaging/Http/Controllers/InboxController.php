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

        return Inertia::render('inbox/index', [
            'initialThreads' => $realThreads,
            'channels' => $channels,
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
                $resp = Http::withToken($channel->access_token)
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
                if ($resp->successful()) {
                    $wamid = $resp->json('messages.0.id');
                    if ($wamid) {
                        $msg->update(['wamid' => $wamid, 'status' => 'sent']);
                    }
                } else {
                    $msg->update(['status' => 'failed']);
                }
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
                'status' => $msg->status ?? 'sent',
            ],
        ]);
    }

    public function updateContact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'conversation_id' => 'required|string',
            'contact_name' => 'required|string|max:100',
            'status' => 'nullable|string|in:open,resolved,bot_handled',
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

        $conversation->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Contact details updated successfully',
            'contact_name' => $conversation->contact_name,
            'status' => $conversation->status,
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
                    $payload = [
                        'messaging_product' => 'whatsapp',
                        'to' => $digitsPhone,
                        'type' => 'template',
                        'template' => [
                            'name' => $templateName,
                            'language' => ['code' => 'en_US'],
                            'components' => [
                                [
                                    'type' => 'body',
                                    'parameters' => [
                                        ['type' => 'text', 'text' => $name],
                                        ['type' => 'text', 'text' => $channel->name],
                                        ['type' => 'text', 'text' => 'Rs. 100'],
                                        ['type' => 'text', 'text' => $channel->phone_number],
                                    ],
                                ],
                                [
                                    'type' => 'button',
                                    'sub_type' => 'url',
                                    'index' => '0',
                                    'parameters' => [
                                        ['type' => 'text', 'text' => 'test-123'],
                                    ],
                                ],
                            ],
                        ],
                    ];
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

        $savedContent = $type === 'template' ? "[Template: {$templateName}]" : ($messageText ?: 'Hello!');

        Message::create([
            'conversation_id' => $conversation->id,
            'organization_id' => $org->id,
            'direction' => 'outbound',
            'sender_type' => 'agent',
            'sender_id' => (string) ($request->user()?->id ?? 'agent'),
            'type' => $type,
            'content' => $savedContent,
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
}
