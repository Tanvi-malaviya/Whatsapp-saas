<?php

namespace App\Modules\Campaigns\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\PhoneNumber;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    private function resolveOrg(Request $request): Organization
    {
        $orgId = TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? Organization::first()?->id;

        return Organization::find($orgId) ?? Organization::first();
    }

    private function getMetaTemplates(?WhatsAppChannel $channel): array
    {
        if (! $channel || empty($channel->access_token) || empty($channel->waba_id)) {
            return $this->getFallbackTemplates();
        }

        $cacheKey = "meta_templates_{$channel->waba_id}";

        return Cache::remember($cacheKey, 300, function () use ($channel) {
            try {
                $resp = Http::withToken($channel->access_token)
                    ->timeout(10)
                    ->get("https://graph.facebook.com/v22.0/{$channel->waba_id}/message_templates");

                if ($resp->successful() && ! empty($resp->json('data'))) {
                    $rawTemplates = $resp->json('data');
                    $formatted = [];

                    foreach ($rawTemplates as $tpl) {
                        $bodyText = '';
                        $headerText = null;
                        $buttons = [];
                        $exampleParams = [];

                        if (! empty($tpl['components'])) {
                            foreach ($tpl['components'] as $comp) {
                                if ($comp['type'] === 'BODY') {
                                    $bodyText = $comp['text'] ?? '';
                                    if (! empty($comp['example']['body_text'][0])) {
                                        $exampleParams = $comp['example']['body_text'][0];
                                    }
                                } elseif ($comp['type'] === 'HEADER' && ! empty($comp['text'])) {
                                    $headerText = $comp['text'];
                                } elseif ($comp['type'] === 'BUTTONS' && ! empty($comp['buttons'])) {
                                    foreach ($comp['buttons'] as $b) {
                                        $buttons[] = $b['text'] ?? 'Action';
                                    }
                                }
                            }
                        }

                        // Determine cost estimate based on category
                        $category = strtoupper($tpl['category'] ?? 'UTILITY');
                        $cost = $category === 'MARKETING' ? '₹0.78 / msg' : '₹0.11 / msg';

                        $formatted[] = [
                            'id' => (string) ($tpl['id'] ?? $tpl['name']),
                            'name' => $tpl['name'],
                            'category' => $category,
                            'status' => strtoupper($tpl['status'] ?? 'APPROVED'),
                            'language' => $tpl['language'] ?? 'en_US',
                            'costEstimate' => $cost,
                            'header' => $headerText,
                            'body' => $bodyText,
                            'buttons' => $buttons,
                            'exampleParams' => $exampleParams,
                        ];
                    }

                    return $formatted;
                }
            } catch (\Throwable $e) {
                // Log and return fallback
            }

            return $this->getFallbackTemplates();
        });
    }

    private function getFallbackTemplates(): array
    {
        return [
            [
                'id' => '1',
                'name' => 'due_reminder_en',
                'category' => 'UTILITY',
                'status' => 'APPROVED',
                'language' => 'en_US',
                'costEstimate' => '₹0.11 / msg',
                'header' => null,
                'body' => 'Dear *{{1}}*, This is a gentle payment reminder from *{{2}}* that your pending balance is *{{3}}*. Kindly clear the payment at the earliest. For any queries, please contact *{{4}}*. Thank you!',
                'buttons' => ['Pay Now'],
                'exampleParams' => ['Customer Name', 'Your Business', '₹1,500', '+91 9876543210'],
            ],
            [
                'id' => '2',
                'name' => 'sale_invoice_en',
                'category' => 'UTILITY',
                'status' => 'APPROVED',
                'language' => 'en_US',
                'costEstimate' => '₹0.11 / msg',
                'header' => null,
                'body' => 'Hello *{{1}}*, Your invoice *{{2}}* from *{{3}}* for *{{4}}* is ready. Current pending balance: *{{5}}*. Thank you for shopping with us! For any queries, contact: *{{6}}*.',
                'buttons' => [],
                'exampleParams' => ['Customer Name', 'INV-1001', 'Your Business', '₹3,200', '₹0', '+91 9876543210'],
            ],
            [
                'id' => '3',
                'name' => 'payment_received_en',
                'category' => 'UTILITY',
                'status' => 'APPROVED',
                'language' => 'en_US',
                'costEstimate' => '₹0.11 / msg',
                'header' => null,
                'body' => 'Dear *{{1}}*, We have received payment of *{{2}}* on *{{3}}* for *{{4}}*. Remaining balance: *{{5}}*. Thank you!',
                'buttons' => [],
                'exampleParams' => ['Customer Name', '₹2,500', 'Today', 'Your Business', '₹0'],
            ],
            [
                'id' => '4',
                'name' => 'due_reminder_gu',
                'category' => 'UTILITY',
                'status' => 'APPROVED',
                'language' => 'gu',
                'costEstimate' => '₹0.11 / msg',
                'header' => null,
                'body' => 'નમસ્તે *{{1}}*, *{{2}}* તરફથી વિનંતી કે આપણી પાસે *{{3}}* ની રકમ બાકી છે. કૃપા કરીને વહેલી તકે ચુકવણી કરવા નમ્ર વિનંતી. કોઈપણ પ્રશ્ન માટે સંપર્ક કરો: *{{4}}*. આભાર!',
                'buttons' => [],
                'exampleParams' => ['ગ્રાહકનું નામ', 'કંપનીનું નામ', '₹1,500', '+91 9876543210'],
            ],
        ];
    }

    public function index(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        TenantContext::set($org);

        $channel = WhatsAppChannel::where('organization_id', $org->id)->first()
            ?? WhatsAppChannel::where('status', 'connected')->first();

        $templates = $this->getMetaTemplates($channel);

        // Fetch existing CRM contacts for this workspace so the user can easily select recipients
        $contacts = Conversation::where('organization_id', $org->id)
            ->select('id', 'contact_name', 'contact_phone', 'label')
            ->orderBy('contact_name')
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->contact_name ?: $c->contact_phone,
                'phone' => $c->contact_phone,
                'label' => $c->label ?: 'Contact',
            ])
            ->values()
            ->all();

        // Fetch recent broadcast campaigns
        $recentCampaigns = BroadcastCampaign::where('organization_id', $org->id)
            ->orderByDesc('created_at')
            ->take(15)
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'templateName' => $c->template_name,
                'templateLanguage' => $c->template_language,
                'recipientsCount' => $c->recipients_count,
                'successCount' => $c->success_count,
                'failedCount' => $c->failed_count,
                'status' => $c->status,
                'date' => $c->created_at ? $c->created_at->timezone('Asia/Kolkata')->format('M d, Y h:i A') : 'Just now',
            ])
            ->values()
            ->all();

        return Inertia::render('campaigns/index', [
            'templates' => $templates,
            'contacts' => $contacts,
            'recentCampaigns' => $recentCampaigns,
            'channel' => $channel ? [
                'id' => $channel->id,
                'name' => $channel->name,
                'phoneNumber' => $channel->phone_number,
                'status' => $channel->status,
            ] : null,
        ]);
    }

    public function broadcast(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_name' => 'required|string',
            'template_language' => 'required|string',
            'campaign_name' => 'nullable|string|max:150',
            'recipients' => 'required|array|min:1',
            'recipients.*.phone' => 'required|string',
            'recipients.*.name' => 'nullable|string',
            'parameters' => 'nullable|array',
        ]);

        $org = $this->resolveOrg($request);
        TenantContext::set($org);

        $channel = WhatsAppChannel::where('organization_id', $org->id)->first()
            ?? WhatsAppChannel::where('status', 'connected')->first();

        if (! $channel) {
            return response()->json([
                'success' => false,
                'message' => 'No active WhatsApp channel found. Please connect your WhatsApp channel first.',
            ], 422);
        }

        $templateName = $validated['template_name'];
        $templateLanguage = $validated['template_language'];
        $campaignName = $validated['campaign_name'] ?: ucwords(str_replace('_', ' ', $templateName)) . ' Broadcast';
        $params = $validated['parameters'] ?? [];
        $recipients = $validated['recipients'];

        $successCount = 0;
        $failedCount = 0;
        $errors = [];

        foreach ($recipients as $recipient) {
            $rawPhone = $recipient['phone'] ?? '';
            $contactName = $recipient['name'] ?? null;

            if (empty($rawPhone)) {
                $failedCount++;
                continue;
            }

            try {
                $e164Phone = (new PhoneNumber($rawPhone))->getE164();
                $cleanDigits = preg_replace('/\D/', '', $e164Phone);
            } catch (\Throwable $e) {
                $cleanDigits = preg_replace('/\D/', '', $rawPhone);
                $e164Phone = '+' . $cleanDigits;
            }

            // Prepare customized parameter list (replacing contact name variable dynamically if present)
            $contactSpecificParams = [];
            foreach ($params as $idx => $paramVal) {
                $val = (string) $paramVal;
                // If parameter is "{{name}}" or empty on 1st param, replace with contact name
                if ($idx === 0 && ($val === '{{name}}' || $val === 'Customer' || empty($val))) {
                    $val = $contactName ?: 'Valued Customer';
                }
                $contactSpecificParams[] = ['type' => 'text', 'text' => $val];
            }

            $metaPayload = [
                'messaging_product' => 'whatsapp',
                'to' => $cleanDigits,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => ['code' => $templateLanguage],
                ],
            ];

            if (! empty($contactSpecificParams)) {
                $metaPayload['template']['components'] = [
                    [
                        'type' => 'body',
                        'parameters' => $contactSpecificParams,
                    ],
                ];

                // Some pre-approved templates like due_reminder_en require a url button parameter
                if (str_contains($templateName, 'due_reminder')) {
                    $metaPayload['template']['components'][] = [
                        'type' => 'button',
                        'sub_type' => 'url',
                        'index' => '0',
                        'parameters' => [
                            ['type' => 'text', 'text' => 'pay'],
                        ],
                    ];
                }
            }

            $isDelivered = false;

            if (! empty($channel->access_token) && ! empty($channel->phone_number_id)) {
                try {
                    $apiResp = Http::withToken($channel->access_token)
                        ->timeout(12)
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $metaPayload);

                    if ($apiResp->successful()) {
                        $isDelivered = true;
                        $successCount++;
                    } else {
                        $failedCount++;
                        $errors[] = $apiResp->json('error.message') ?? 'Meta API error';
                    }
                } catch (\Throwable $e) {
                    $failedCount++;
                    $errors[] = $e->getMessage();
                }
            } else {
                // Channel credentials missing
                $failedCount++;
            }

            // Create or update conversation thread so this broadcast appears in Live Inbox
            $conv = Conversation::firstOrCreate(
                [
                    'organization_id' => $org->id,
                    'contact_phone' => $e164Phone,
                ],
                [
                    'contact_name' => $contactName ?: $e164Phone,
                    'channel_phone_number_id' => $channel->phone_number_id,
                    'status' => 'open',
                    'pipeline_stage' => 'New',
                    'label' => 'Prospect',
                ]
            );

            $conv->update([
                'last_message_at' => now(),
                'window_expires_at' => now()->addHours(24),
            ]);

            // Save outbound broadcast message in database
            Message::create([
                'conversation_id' => $conv->id,
                'organization_id' => $org->id,
                'direction' => 'outbound',
                'sender_type' => 'agent',
                'sender_id' => (string) ($request->user()?->id ?? 'agent'),
                'type' => 'template',
                'content' => "[Broadcast Campaign: {$campaignName}] Template: {$templateName}",
                'status' => $isDelivered ? 'sent' : 'failed',
                'meta_cost_paise' => 0,
            ]);
        }

        // Store campaign in history
        $campaign = BroadcastCampaign::create([
            'organization_id' => $org->id,
            'name' => $campaignName,
            'template_name' => $templateName,
            'template_language' => $templateLanguage,
            'recipients_count' => count($recipients),
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'status' => $failedCount === 0 ? 'completed' : ($successCount > 0 ? 'partial' : 'failed'),
            'parameters' => $params,
        ]);

        return response()->json([
            'success' => $successCount > 0,
            'message' => $successCount > 0
                ? "Broadcast launched successfully! {$successCount} sent" . ($failedCount > 0 ? ", {$failedCount} failed." : '.')
                : "Broadcast failed to send. " . implode(', ', array_unique($errors)),
            'campaign_id' => $campaign->id,
            'success_count' => $successCount,
            'failed_count' => $failedCount,
        ]);
    }
}
