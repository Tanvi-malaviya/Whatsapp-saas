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

    public function getMetaTemplates(?WhatsAppChannel $channel): array
    {
        if (! $channel || $channel->status !== 'connected' || empty($channel->access_token) || empty($channel->waba_id)) {
            return [];
        }

        $cacheKey = "meta_templates_{$channel->waba_id}";

        $templates = Cache::remember($cacheKey, 300, function () use ($channel) {
            try {
                $resp = Http::withToken($channel->access_token)
                    ->timeout(12)
                    ->get("https://graph.facebook.com/v22.0/{$channel->waba_id}/message_templates?limit=100");

                if ($resp->successful() && ! empty($resp->json('data'))) {
                    $rawTemplates = $resp->json('data');
                    $formatted = [];

                    foreach ($rawTemplates as $tpl) {
                        $bodyText = '';
                        $headerText = null;
                        $headerFormat = null;
                        $headerUrl = null;
                        $buttons = [];
                        $exampleParams = [];

                        if (! empty($tpl['components'])) {
                            foreach ($tpl['components'] as $comp) {
                                if ($comp['type'] === 'BODY') {
                                    $bodyText = $comp['text'] ?? '';
                                    if (! empty($comp['example']['body_text'][0])) {
                                        $exampleParams = $comp['example']['body_text'][0];
                                    }
                                } elseif ($comp['type'] === 'HEADER') {
                                    $headerText = $comp['text'] ?? null;
                                    $headerFormat = $comp['format'] ?? null;
                                    $headerUrl = $comp['example']['header_handle'][0] ?? $comp['example']['header_url'][0] ?? null;
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
                            'headerFormat' => $headerFormat,
                            'headerUrl' => $channel->metadata['template_media_urls'][$tpl['name']] ?? $headerUrl,
                            'headerMediaId' => $channel->metadata['template_media_ids'][$tpl['name']] ?? null,
                            'body' => $bodyText,
                            'buttons' => $buttons,
                            'exampleParams' => $exampleParams,
                        ];
                    }

                    return $formatted;
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error("getMetaTemplates error for WABA {$channel->waba_id}: " . $e->getMessage());
            }

            return [];
        });

        $hidden = $channel->metadata['hidden_templates'] ?? [];
        if (! empty($hidden) && is_array($hidden)) {
            $templates = array_values(array_filter($templates, fn ($t) => ! in_array($t['name'], $hidden)));
        }

        return $templates;
    }

    public function index(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        TenantContext::set($org);

        $channel = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->first();

        $templates = $this->getMetaTemplates($channel);

        // Fetch existing CRM contacts for this workspace so the user can easily select recipients
        $contactsQuery = Conversation::where('organization_id', $org->id);

        if ($request->filled('filter_type')) {
            $fType = $request->query('filter_type');
            $fVal = $request->query('filter_value');
            if ($fType === 'opt_in') {
                $contactsQuery->where('is_opted_in', true);
            } elseif ($fType === 'opt_out') {
                $contactsQuery->where('is_opted_in', false);
            } elseif ($fType === 'stage' && $fVal) {
                $contactsQuery->where('pipeline_stage', $fVal);
            } elseif ($fType === 'city' && $fVal) {
                $contactsQuery->where('city', $fVal);
            } elseif ($fType === 'active_7d') {
                $contactsQuery->where('last_message_at', '>=', now()->subDays(7));
            } elseif ($fType === 'inactive_30d') {
                $contactsQuery->where('last_message_at', '<', now()->subDays(30));
            }
        } elseif ($request->filled('segment_id')) {
            $segId = $request->query('segment_id');
            if ($segId === 'sys_opt_in') {
                $contactsQuery->where('is_opted_in', true);
            } elseif ($segId === 'sys_opt_out') {
                $contactsQuery->where('is_opted_in', false);
            } elseif ($segId === 'sys_won') {
                $contactsQuery->where('pipeline_stage', 'Won');
            } elseif ($segId === 'sys_new_leads') {
                $contactsQuery->where('pipeline_stage', 'New');
            } elseif ($segId === 'sys_interested') {
                $contactsQuery->whereIn('pipeline_stage', ['Interested', 'Contacted']);
            } elseif ($segId === 'sys_active_7d') {
                $contactsQuery->where('last_message_at', '>=', now()->subDays(7));
            } else {
                $segment = \App\Modules\Crm\Models\ContactSegment::where('organization_id', $org->id)
                    ->where('id', $segId)
                    ->first();
                if ($segment) {
                    $contactsQuery = $segment->getMatchingQuery();
                }
            }
        }

        $contacts = $contactsQuery
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

        $activeSegmentName = $request->query('segment_name');
        if (!$activeSegmentName && $request->filled('segment_id') && isset($segment)) {
            $activeSegmentName = $segment->name;
        }

        return Inertia::render('campaigns/index', [
            'templates' => $templates,
            'contacts' => $contacts,
            'recentCampaigns' => $recentCampaigns,
            'activeSegmentName' => $activeSegmentName,
            'autoOpenBroadcast' => $request->boolean('open_broadcast', false),
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
            'header_url' => 'nullable|string',
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

        $allTemplates = $this->getMetaTemplates($channel);
        $matchedTemplate = collect($allTemplates)->first(function ($t) use ($templateName, $templateLanguage) {
            return $t['name'] === $templateName && ($t['language'] ?? '') === $templateLanguage;
        }) ?? collect($allTemplates)->firstWhere('name', $templateName);
        $templateBodyTemplate = $matchedTemplate['body'] ?? '';
        $matchedHeaderFormat = $matchedTemplate['headerFormat'] ?? null;
        $matchedHeaderUrl = $validated['header_url'] ?? ($matchedTemplate['headerUrl'] ?? null);

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

            $metaPayload = [
                'messaging_product' => 'whatsapp',
                'to' => $cleanDigits,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => ['code' => $templateLanguage],
                ],
            ];

            $components = [];
            $mediaHeaderUrl = null;

            $headerMediaId = $matchedTemplate['headerMediaId'] ?? ($channel->metadata['template_media_ids'][$templateName] ?? null);
            $mediaHeaderUrl = $matchedHeaderUrl ?: ($channel->metadata['template_media_urls'][$templateName] ?? null);

            $headerFormatUpper = strtoupper((string) ($matchedHeaderFormat ?? ''));

            // 1. Add Header component ONLY if template requires MEDIA format in Meta (VIDEO, IMAGE, DOCUMENT)
            if ($headerFormatUpper === 'VIDEO') {
                if ($headerMediaId) {
                    $components[] = [
                        'type' => 'header',
                        'parameters' => [
                            [
                                'type' => 'video',
                                'video' => [
                                    'id' => $headerMediaId,
                                ],
                            ],
                        ],
                    ];
                } else {
                    $mediaHeaderUrl = $mediaHeaderUrl ?: 'https://scontent.whatsapp.net/v/t61.29466-34/861420731_1135805725493070_8195379101910817431_n.mp4?ccb=1-7&_nc_sid=8b1bef&_nc_ohc=LITLgyYzWeEQ7kNvwHswKjK&_nc_oc=Ado6rCu2_7HB01pE1X69FVXpB5pcIrgkalj2PtPnJIsl0WWGQlEIi7a7rOCPlmp_upNRcdeWjGxDJHqJJKJd58wt&_nc_zt=28&_nc_ht=scontent.whatsapp.net&edm=AH51TzQEAAAA&_nc_gid=kDO078dsVyKTE9ewNT-Bcw&_nc_tpa=Q5bMBQL9vkinWT5IO5byDk_pcZOs1A8aVN_j9yEXgDc6ghJsKRjVKFBKUPwxCmbfiYbM9wMEB2DqXN99fA&oh=01_Q5Aa5wFTcGC0MZXLOwFyAlfJ1gUK2BGgUxKzkVfxyohM-21vKg&oe=6B0B9F7C';
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
                }
            } elseif ($headerFormatUpper === 'IMAGE') {
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
            } elseif ($headerFormatUpper === 'DOCUMENT') {
                $mediaHeaderUrl = $matchedHeaderUrl ?: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
                $components[] = [
                    'type' => 'header',
                    'parameters' => [
                        [
                            'type' => 'document',
                            'document' => [
                                'link' => $mediaHeaderUrl,
                                'filename' => 'Invoice_' . date('Ymd') . '.pdf',
                            ],
                        ],
                    ],
                ];
            }

            // 2. Add Body component parameters ONLY if template actually requires body variables {{1}}, {{2}}...
            preg_match_all('/\{\{(\d+)\}\}/', $templateBodyTemplate, $varMatches);
            $requiredVarIndices = array_unique($varMatches[1] ?? []);
            sort($requiredVarIndices);

            $renderedContent = $templateBodyTemplate;

            if (! empty($requiredVarIndices)) {
                $bodyParams = [];
                foreach ($requiredVarIndices as $varIdx) {
                    $intIdx = (int) $varIdx;
                    $userVal = $params[$intIdx - 1] ?? null;
                    if (is_array($userVal)) {
                        $userVal = $userVal['text'] ?? null;
                    }
                    $val = (string) ($userVal ?? '');

                    if (empty($val) || $val === '{{name}}' || $val === 'Customer') {
                        $val = match ($intIdx) {
                            1 => $contactName ?: 'Valued Customer',
                            2 => $org->name ?? 'DukanHisab Store',
                            3 => '₹500.00',
                            4 => date('d/m/Y'),
                            5 => '₹0.00',
                            6 => 'INV-' . date('Ymd') . '-01',
                            default => 'Info',
                        };
                    }

                    $bodyParams[] = ['type' => 'text', 'text' => (string) $val];
                    $renderedContent = str_replace('{{' . $varIdx . '}}', (string) $val, $renderedContent);
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

            if (! empty($components)) {
                $metaPayload['template']['components'] = $components;
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
                        $errorMsg = $apiResp->json('error.message') ?? 'Meta API error';
                        $errors[] = $errorMsg;
                        \Illuminate\Support\Facades\Log::error("Meta WhatsApp Broadcast Error ({$templateName}): " . $errorMsg, [
                            'payload' => $metaPayload,
                            'response' => $apiResp->json(),
                        ]);
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

            // Prepare rendered text for live inbox matching what was sent to customer's WhatsApp
            $mediaPrefix = $mediaHeaderUrl ? "[Media: {$mediaHeaderUrl}]\n" : '';

            if (! empty($renderedContent)) {
                $savedMessageContent = "[Broadcast Campaign: {$campaignName} Template: {$templateName}]\n" . $mediaPrefix . $renderedContent;
            } else {
                $savedMessageContent = "[Broadcast Campaign: {$campaignName} Template: {$templateName}]\n" . $mediaPrefix;
            }

            // Save outbound broadcast message in database
            Message::create([
                'conversation_id' => $conv->id,
                'organization_id' => $org->id,
                'direction' => 'outbound',
                'sender_type' => 'agent',
                'sender_id' => (string) ($request->user()?->id ?? 'agent'),
                'type' => 'template',
                'content' => $savedMessageContent,
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
