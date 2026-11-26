<?php

namespace App\Services;

use App\Modules\Campaigns\Http\Controllers\CampaignController;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\PhoneNumber;
use Illuminate\Support\Facades\DB;

class ApiMessagingService
{
    public function __construct(
        protected MetaApi $metaApi,
        protected WalletService $walletService,
    ) {}

    /**
     * Send a WhatsApp message (text, template, image, or document) via Meta Cloud API,
     * debiting the workspace wallet according to message category and recording the message.
     */
    public function send(Organization $org, array $input): array
    {
        $channelQuery = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected');

        $channel = ! empty($input['channel_id'])
            ? (clone $channelQuery)->find($input['channel_id'])
            : (clone $channelQuery)->orderByDesc('is_default')->first();

        if (! $channel) {
            return [
                'success' => false,
                'status' => 422,
                'error' => 'no_connected_channel',
                'message' => 'No connected WhatsApp channel found for this workspace.',
            ];
        }

        $e164 = (new PhoneNumber((string) $input['to']))->getE164();
        $digits = preg_replace('/\D/', '', $e164);
        $type = strtolower((string) ($input['type'] ?? 'text'));

        // Build Meta Cloud API payload & determine billing category
        $category = 'UTILITY';
        $contentPreview = '';
        $payload = [
            'to' => $digits,
            'type' => $type,
        ];

        if ($type === 'template') {
            $templateName = $input['template']['name'] ?? $input['template_name'] ?? '';
            $languageCode = $input['template']['language']['code'] ?? $input['template_language'] ?? 'en_US';

            if (! $templateName) {
                return [
                    'success' => false,
                    'status' => 422,
                    'error' => 'template_required',
                    'message' => 'template.name is required when type is template.',
                ];
            }

            // Look up template category from cached Meta templates
            $metaTemplates = collect(app(CampaignController::class)->getMetaTemplates($channel));
            $matchedTemplate = $metaTemplates->first(
                fn ($t) => $t['name'] === $templateName && ($t['language'] === $languageCode || empty($input['template']['language']['code']))
            );

            $category = strtoupper($matchedTemplate['category'] ?? ($input['category'] ?? 'MARKETING'));
            $resolvedLang = $matchedTemplate['language'] ?? $languageCode;

            $components = $input['template']['components'] ?? [];
            if (empty($components) && ! empty($input['parameters']) && is_array($input['parameters'])) {
                $components[] = [
                    'type' => 'body',
                    'parameters' => array_map(
                        fn ($val) => ['type' => 'text', 'text' => (string) $val],
                        array_values($input['parameters'])
                    ),
                ];
            }

            $templateObj = [
                'name' => $templateName,
                'language' => ['code' => $resolvedLang],
            ];
            if (! empty($components)) {
                $templateObj['components'] = $components;
            }

            $payload['template'] = $templateObj;
            $contentPreview = $matchedTemplate['body'] ?? "Template: {$templateName}";
        } elseif ($type === 'image' || $type === 'document') {
            $mediaUrl = $input[$type]['link'] ?? $input['media_url'] ?? '';
            $caption = $input[$type]['caption'] ?? $input['caption'] ?? '';
            if (! $mediaUrl) {
                return [
                    'success' => false,
                    'status' => 422,
                    'error' => 'media_url_required',
                    'message' => "A public HTTPS link is required for {$type} messages.",
                ];
            }
            $payload[$type] = array_filter([
                'link' => $mediaUrl,
                'caption' => $caption ?: null,
                'filename' => $type === 'document' ? ($input['filename'] ?? basename(parse_url($mediaUrl, PHP_URL_PATH) ?: 'document.pdf')) : null,
            ]);
            $category = 'UTILITY';
            $contentPreview = $caption ?: "[{$type}] {$mediaUrl}";
        } else {
            $body = $input['text']['body'] ?? $input['message'] ?? '';
            if (! trim((string) $body)) {
                return [
                    'success' => false,
                    'status' => 422,
                    'error' => 'message_required',
                    'message' => 'text.body (or message) is required when type is text.',
                ];
            }
            $payload['type'] = 'text';
            $payload['text'] = [
                'preview_url' => (bool) ($input['text']['preview_url'] ?? false),
                'body' => (string) $body,
            ];
            $category = 'SERVICE';
            $contentPreview = (string) $body;
        }

        // Calculate cost from WalletService based on category
        $costPaise = $this->walletService->getRatePerMessage($category);
        if ($costPaise > 0) {
            $wallet = $this->walletService->getOrCreateWallet($org);
            if (! $wallet->hasSufficientBalance($costPaise)) {
                return [
                    'success' => false,
                    'status' => 402,
                    'error' => 'insufficient_balance',
                    'message' => 'Insufficient wallet balance. Required: ₹' . number_format($costPaise / 100, 2) . ', Available: ₹' . number_format($wallet->totalBalancePaise() / 100, 2),
                ];
            }
        }

        // Create conversation & outbound message
        $conversation = Conversation::firstOrCreate(
            [
                'organization_id' => $org->id,
                'channel_phone_number_id' => $channel->phone_number_id,
                'contact_phone' => $e164,
            ],
            [
                'channel_id' => $channel->id,
                'contact_name' => $input['name'] ?? $e164,
                'status' => 'open',
                'is_opted_in' => true,
            ]
        );

        $message = Message::create([
            'organization_id' => $org->id,
            'conversation_id' => $conversation->id,
            'direction' => 'outbound',
            'sender_type' => 'api',
            'type' => $payload['type'],
            'content' => $contentPreview,
            'status' => 'queued',
            'meta_cost_paise' => $costPaise,
            'metadata' => ['via' => 'rest_api', 'category' => $category],
        ]);

        // Debit wallet before dispatch
        if ($costPaise > 0) {
            $this->walletService->debit(
                org: $org,
                amountPaise: $costPaise,
                description: "API message ({$category}) to {$e164}",
                referenceId: $message->id,
                metadata: ['message_id' => $message->id, 'category' => $category, 'via' => 'api']
            );
        }

        try {
            $wamid = $this->metaApi->send($channel, $payload);
            $message->update(['wamid' => $wamid, 'status' => 'sent']);
            $conversation->update(['last_message_at' => now()]);

            return [
                'success' => true,
                'status' => 200,
                'message' => 'Message dispatched via Meta Cloud API.',
                'data' => [
                    'message_id' => $message->id,
                    'wamid' => $wamid,
                    'to' => $e164,
                    'type' => $payload['type'],
                    'category' => $category,
                    'cost_paise' => $costPaise,
                    'cost_formatted' => '₹' . number_format($costPaise / 100, 2),
                    'status' => 'sent',
                    'channel_id' => $channel->id,
                ],
                'request_payload' => $payload,
            ];
        } catch (\Throwable $e) {
            $message->update([
                'status' => 'failed',
                'metadata' => [...($message->metadata ?? []), 'error' => $e->getMessage()],
            ]);

            // Refund wallet debit on immediate Meta failure
            if ($costPaise > 0) {
                $this->walletService->refund(
                    org: $org,
                    amountPaise: $costPaise,
                    description: "Refund for failed API message to {$e164}",
                    referenceId: $message->id
                );
            }

            return [
                'success' => false,
                'status' => 422,
                'error' => 'meta_api_error',
                'message' => $e->getMessage(),
                'data' => [
                    'message_id' => $message->id,
                    'to' => $e164,
                    'status' => 'failed',
                ],
                'request_payload' => $payload,
            ];
        }
    }
}
