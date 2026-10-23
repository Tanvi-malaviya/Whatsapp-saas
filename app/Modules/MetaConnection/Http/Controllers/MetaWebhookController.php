<?php

namespace App\Modules\MetaConnection\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Bot\Models\BotRule;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\Messaging\Models\WebhookInbox;
use App\Shared\PhoneNumber;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaWebhookController extends Controller
{
    /**
     * Respond to Meta Webhook Verification Handshake (GET /webhooks/meta)
     */
    public function verify(Request $request): Response
    {
        $mode = $request->input('hub_mode');
        $token = $request->input('hub_verify_token');
        $challenge = $request->input('hub_challenge');

        $expectedToken = config('services.meta.verify_token', env('META_VERIFY_TOKEN', 'sathwara_secret_token_123'));

        if ($mode === 'subscribe' && $token === $expectedToken) {
            Log::info('Meta Webhook Handshake successfully verified.');
            return response($challenge, 200);
        }

        Log::warning('Meta Webhook verification failed. Invalid token received.');
        return response('Forbidden', 403);
    }

    /**
     * Ingest incoming WhatsApp message webhooks from Meta (POST /webhooks/meta)
     */
    public function receive(Request $request): Response
    {
        $payload = $request->all();

        // 1. Log raw webhook payload in webhook_inbox
        $inboxRecord = WebhookInbox::create([
            'provider' => 'meta',
            'payload' => $payload,
            'status' => 'pending',
        ]);

        try {
            $this->processPayload($payload, $inboxRecord);
            $inboxRecord->update(['status' => 'processed']);
        } catch (\Throwable $e) {
            Log::error('Error processing Meta Webhook: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            $inboxRecord->update([
                'status' => 'failed',
                'error' => $e->getMessage(),
            ]);
        }

        // Always return HTTP 200 quickly so Meta does not resend the webhook
        return response('EVENT_RECEIVED', 200);
    }

    private function processPayload(array $payload, WebhookInbox $inboxRecord): void
    {
        $entry = $payload['entry'][0] ?? null;
        $change = $entry['changes'][0]['value'] ?? null;

        if (! $change) {
            return;
        }

        $messages = $change['messages'] ?? [];
        if (empty($messages)) {
            return;
        }

        // Get sender profile
        $contactProfile = $change['contacts'][0] ?? null;
        $contactName = $contactProfile['profile']['name'] ?? 'WhatsApp Customer';
        $phoneNumberId = $change['metadata']['phone_number_id'] ?? null;

        // Associate with correct organization matching channel or active tenant
        $channel = null;
        if ($phoneNumberId) {
            $channel = WhatsAppChannel::where('phone_number_id', $phoneNumberId)->first();
        }

        $org = ($channel ? Organization::find($channel->organization_id) : null)
            ?? TenantContext::get()
            ?? Organization::first();

        if (! $org) {
            return;
        }

        TenantContext::set($org);

        foreach ($messages as $msg) {
            $wamid = $msg['id'] ?? null;
            $fromNumber = $msg['from'] ?? null;
            $msgType = $msg['type'] ?? 'text';
            $textBody = $msg['text']['body'] ?? ($msg['button']['text'] ?? '');

            if (! $fromNumber || empty($textBody)) {
                continue;
            }

            // Deduplication: if message with this wamid already exists, skip
            if ($wamid && Message::where('wamid', $wamid)->exists()) {
                continue;
            }

            $normalizedPhone = (new PhoneNumber($fromNumber))->getE164();

            // Find or create active conversation thread
            $conversation = Conversation::firstOrCreate(
                [
                    'organization_id' => $org->id,
                    'contact_phone' => $normalizedPhone,
                ],
                [
                    'contact_name' => $contactName,
                    'channel_phone_number_id' => $phoneNumberId,
                    'status' => 'open',
                ]
            );

            // Extend 24h customer service window
            $conversation->extendWindow();

            // Store inbound message
            Message::create([
                'conversation_id' => $conversation->id,
                'organization_id' => $org->id,
                'direction' => 'inbound',
                'sender_type' => 'contact',
                'sender_id' => $normalizedPhone,
                'wamid' => $wamid,
                'type' => $msgType,
                'content' => $textBody,
                'status' => 'received',
                'meta_cost_paise' => 0,
            ]);

            // Match Bot Rules for auto-reply
            $replyText = $this->matchBotReply($org, $textBody);

            if ($replyText) {
                // Store outbound bot reply
                Message::create([
                    'conversation_id' => $conversation->id,
                    'organization_id' => $org->id,
                    'direction' => 'outbound',
                    'sender_type' => 'bot',
                    'type' => 'text',
                    'content' => $replyText,
                    'status' => 'sent',
                    'meta_cost_paise' => 0, // Free within 24h customer service window
                ]);

                // If Meta WhatsApp Token is configured, dispatch reply via Meta Graph API
                $this->dispatchMetaReply($phoneNumberId, $fromNumber, $replyText);
            }
        }

        TenantContext::clear();
    }

    private function matchBotReply(Organization $org, string $inboundText): ?string
    {
        $rules = BotRule::where('organization_id', $org->id)
            ->where('is_enabled', true)
            ->orderBy('priority', 'asc')
            ->get();

        foreach ($rules as $rule) {
            if ($rule->matches($inboundText)) {
                return $rule->reply_text;
            }
        }

        return null;
    }

    private function dispatchMetaReply(?string $phoneNumberId, string $toPhone, string $message): void
    {
        $token = env('META_WHATSAPP_TOKEN');
        $phoneId = $phoneNumberId ?? env('META_PHONE_NUMBER_ID');

        if (! $token || ! $phoneId) {
            return;
        }

        try {
            Http::withToken($token)
                ->post("https://graph.facebook.com/v21.0/{$phoneId}/messages", [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $toPhone,
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $message,
                    ],
                ]);
        } catch (\Throwable $e) {
            Log::warning('Failed sending WhatsApp reply via Meta API: ' . $e->getMessage());
        }
    }
}
