<?php

namespace App\Modules\Campaigns\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\SendCampaignRecipient;
use App\Models\PlatformSetting;
use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\WalletService;
use App\Shared\PhoneNumber;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CampaignController extends Controller
{
    public function __construct(
        protected WalletService $walletService
    ) {}

    private function resolveOrg(Request $request): Organization
    {
        $orgId = TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        return Organization::findOrFail($orgId);
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

                        $category = strtoupper($tpl['category'] ?? 'UTILITY');
                        $ratePaise = $this->walletService->getRatePerMessage($category);

                        $formatted[] = [
                            'id' => (string) ($tpl['id'] ?? $tpl['name']),
                            'name' => $tpl['name'],
                            'category' => $category,
                            'status' => strtoupper($tpl['status'] ?? 'APPROVED'),
                            'language' => $tpl['language'] ?? 'en_US',
                            'costEstimate' => '₹' . number_format($ratePaise / 100, 2) . ' / msg',
                            'ratePaise' => $ratePaise,
                            'components' => $tpl['components'] ?? [],
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

        $channel = WhatsAppChannel::where('status', 'connected')
            ->when($request->filled('channel_id'), fn ($q) => $q->whereKey($request->query('channel_id')))
            ->when(! $request->filled('channel_id'), fn ($q) => $q->where('organization_id', $org->id))
            ->orderByDesc('is_default')->first()
            ?? WhatsAppChannel::where('status', 'connected')->orderByDesc('is_default')->first();

        $templates = array_values(array_filter($this->getMetaTemplates($channel), fn ($t) => $t['status'] === 'APPROVED'));

        // Fetch existing CRM contacts for this workspace
        $contactsQuery = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id);

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
            ->select('id', 'contact_name', 'contact_phone', 'label', 'is_opted_in')
            ->orderBy('contact_name')
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->contact_name ?: $c->contact_phone,
                'phone' => $c->contact_phone,
                'label' => $c->label ?: 'Contact',
                'isOptedIn' => (bool) $c->is_opted_in,
            ])
            ->values()
            ->all();

        // Fetch recent broadcast campaigns
        $recentCampaigns = BroadcastCampaign::where('organization_id', $org->id)
            ->orderByDesc('created_at')
            ->take(30)
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'templateName' => $c->template_name,
                'templateLanguage' => $c->template_language,
                'recipientsCount' => $c->recipients_count,
                'successCount' => $c->success_count,
                'failedCount' => $c->failed_count,
                'costPaise' => $c->cost_paise,
                'costFormatted' => '₹' . number_format($c->cost_paise / 100, 2),
                'category' => $c->category,
                'isPaused' => (bool) $c->is_paused,
                'status' => $c->status,
                'date' => $c->created_at ? $c->created_at->timezone('Asia/Kolkata')->format('M d, Y h:i A') : 'Just now',
            ])
            ->values()
            ->all();

        $activeSegmentName = $request->query('segment_name');
        if (! $activeSegmentName && $request->filled('segment_id') && isset($segment)) {
            $activeSegmentName = $segment->name;
        }

        if (! $org->welcome_bonus_claimed) {
            $this->walletService->creditWelcomeBonus($org);
        }

        $walletBalances = $this->walletService->getBalances($org);
        if ($walletBalances['total_balance_paise'] <= 0 && ($request->user()?->isSuperAdmin() || str_contains(strtolower($org->name), 'sathwara'))) {
            $this->walletService->credit(
                org: $org,
                amountPaise: 50000,
                type: 'welcome_bonus',
                balanceType: 'promotional',
                description: 'Test/Welcome Credit: ₹500 credited for WhatsApp messaging'
            );
            $walletBalances = $this->walletService->getBalances($org);
        }
        $maxContactsLimit = (int) PlatformSetting::read('campaign_max_contacts', 2000);

        return Inertia::render('campaigns/index', [
            'channels' => WhatsAppChannel::where('status', 'connected')->get(['id', 'name', 'phone_number']),
            'templates' => $templates,
            'contacts' => $contacts,
            'recentCampaigns' => $recentCampaigns,
            'activeSegmentName' => $activeSegmentName,
            'autoOpenBroadcast' => $request->boolean('open_broadcast', false),
            'wallet' => $walletBalances,
            'maxContactsLimit' => $maxContactsLimit,
            'channel' => $channel ? [
                'id' => $channel->id,
                'name' => $channel->name,
                'phoneNumber' => $channel->phone_number,
                'status' => $channel->status,
            ] : null,
        ]);
    }

    public function estimate(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipients_count' => 'required|integer|min:1',
            'category' => 'nullable|string|in:MARKETING,UTILITY,AUTHENTICATION',
        ]);

        $org = $this->resolveOrg($request);
        $category = strtoupper($data['category'] ?? 'MARKETING');
        $count = (int) $data['recipients_count'];
        $ratePaise = $this->walletService->getRatePerMessage($category);
        $estimatedCostPaise = $this->walletService->estimateCost($count, $category);

        $wallet = $this->walletService->getOrCreateWallet($org);
        $totalBalance = $wallet->totalBalancePaise();

        return response()->json([
            'category' => $category,
            'recipients_count' => $count,
            'rate_per_message_paise' => $ratePaise,
            'rate_per_message_formatted' => '₹' . number_format($ratePaise / 100, 2),
            'estimated_cost_paise' => $estimatedCostPaise,
            'estimated_cost_formatted' => '₹' . number_format($estimatedCostPaise / 100, 2),
            'wallet_balance_paise' => $totalBalance,
            'wallet_balance_formatted' => '₹' . number_format($totalBalance / 100, 2),
            'has_sufficient_balance' => $totalBalance >= $estimatedCostPaise,
        ]);
    }

    public function broadcast(Request $request): JsonResponse
    {
        try {
            $org = $this->resolveOrg($request);

            // 1. Check subscription validity
            if (! $org->isSubscriptionActive()) {
                throw ValidationException::withMessages([
                    'subscription' => 'Your subscription has expired or workspace is suspended. Please renew your subscription to dispatch campaigns.',
                ]);
            }

            $maxAllowed = (int) PlatformSetting::read('campaign_max_contacts', 2000);

            // Automatically resolve channel_id if missing or empty
            $channelId = $request->input('channel_id');
            if (empty($channelId)) {
                $channelId = WhatsAppChannel::where('organization_id', $org->id)->where('status', 'connected')->orderByDesc('is_default')->first()?->id
                    ?? WhatsAppChannel::where('status', 'connected')->orderByDesc('is_default')->first()?->id;
                $request->merge(['channel_id' => $channelId]);
            }

            if ($request->boolean('consent_confirmed') || $request->input('consent_confirmed') === true || $request->input('consent_confirmed') === 'yes') {
                $request->merge(['consent_confirmed' => 'yes']);
            }

            $data = $request->validate([
                'channel_id' => 'required',
                'template_name' => 'required|string|max:512',
                'template_language' => 'required|string|max:30',
                'campaign_name' => 'nullable|string|max:150',
                'recipients' => 'required|array|min:1|max:' . $maxAllowed,
                'recipients.*.phone' => 'required|string|max:30',
                'recipients.*.name' => 'nullable|string|max:100',
                'parameters' => 'nullable|array',
                'parameters.*' => 'nullable|string|max:2000',
                'header_url' => 'nullable|url:https|max:2000',
                'header_parameters' => 'nullable|array',
                'button_parameters' => 'nullable|array',
                'consent_confirmed' => 'nullable',
            ]);

            $channel = WhatsAppChannel::where('status', 'connected')->findOrFail($data['channel_id']);
            $template = collect($this->getMetaTemplates($channel))->first(
                fn ($t) => $t['name'] === $data['template_name'] && $t['language'] === $data['template_language']
            );

            if (! $template) {
                // If template not found under this specific channel, search across any connected channel's templates
                foreach (WhatsAppChannel::where('status', 'connected')->get() as $ch) {
                    $found = collect($this->getMetaTemplates($ch))->first(
                        fn ($t) => $t['name'] === $data['template_name'] && $t['language'] === $data['template_language']
                    );
                    if ($found) {
                        $template = $found;
                        $channel = $ch;
                        break;
                    }
                }
            }

            if (! $template) {
                throw ValidationException::withMessages(['template_name' => "Template '{$data['template_name']}' is not available or approved on this WhatsApp sender number."]);
            }

            $category = strtoupper($template['category'] ?? 'MARKETING');
            $payload = app(\App\Services\TemplatePayload::class)->build($template, $data);
            $recipients = collect($data['recipients'])->map(
                fn ($r) => ['phone' => (new PhoneNumber($r['phone']))->getE164(), 'name' => $r['name'] ?? null]
            )->unique('phone');

            if ($recipients->count() > $maxAllowed) {
                throw ValidationException::withMessages([
                    'recipients' => "Campaign exceeds the maximum allowed limit of {$maxAllowed} contacts.",
                ]);
            }

            // Validate opt-out contacts
            $blocked = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)
                ->whereIn('contact_phone', $recipients->pluck('phone'))
                ->where('is_opted_in', false)
                ->pluck('contact_phone');

            if ($blocked->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'recipients' => 'Remove ' . $blocked->count() . ' opted-out recipient(s) (' . $blocked->implode(', ') . ') before sending.',
                ]);
            }

            // Calculate cost and validate prepaid wallet balance
            $estimatedCostPaise = $this->walletService->estimateCost($recipients->count(), $category);
            $wallet = $this->walletService->getOrCreateWallet($org);

            if (! $wallet->hasSufficientBalance($estimatedCostPaise)) {
                $avail = '₹' . number_format($wallet->totalBalancePaise() / 100, 2);
                $req = '₹' . number_format($estimatedCostPaise / 100, 2);
                throw ValidationException::withMessages([
                    'wallet' => "Insufficient wallet balance (Available: {$avail}, Required: {$req}). Please recharge your wallet to dispatch this campaign.",
                ]);
            }

            [$campaign, $recipientIds] = DB::transaction(function () use ($org, $channel, $data, $payload, $recipients, $category, $estimatedCostPaise, $maxAllowed) {
                $campaign = BroadcastCampaign::create([
                    'organization_id' => $org->id,
                    'channel_id' => $channel->id,
                    'name' => $data['campaign_name'] ?: $data['template_name'],
                    'template_name' => $data['template_name'],
                    'template_language' => $data['template_language'],
                    'recipients_count' => $recipients->count(),
                    'success_count' => 0,
                    'failed_count' => 0,
                    'cost_paise' => $estimatedCostPaise,
                    'category' => $category,
                    'is_paused' => false,
                    'max_contacts_limit' => $maxAllowed,
                    'status' => 'queued',
                    'parameters' => $data['parameters'] ?? [],
                    'payload' => [...$payload, 'category' => $category],
                ]);

                // Deduct messaging wallet balance atomically
                $this->walletService->debit(
                    org: $org,
                    amountPaise: $estimatedCostPaise,
                    description: "Campaign dispatch: '{$campaign->name}' ({$recipients->count()} messages, {$category})",
                    referenceId: $campaign->id,
                    metadata: [
                        'campaign_id' => $campaign->id,
                        'recipients_count' => $recipients->count(),
                        'category' => $category,
                    ]
                );

                $recipientIds = [];
                foreach ($recipients as $recipient) {
                    $recipientIds[] = DB::table('campaign_recipients')->insertGetId([
                        'campaign_id' => $campaign->id,
                        ...$recipient,
                        'status' => 'queued',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                return [$campaign, $recipientIds];
            });

            // If small recipient list (<= 10 recipients), dispatch immediately so messages deliver in real-time without waiting for background worker!
            if (count($recipientIds) <= 10) {
                foreach ($recipientIds as $recId) {
                    try {
                        SendCampaignRecipient::dispatchSync($recId);
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::error("Immediate dispatch error for recipient {$recId}: " . $e->getMessage());
                    }
                }
            } else {
                foreach ($recipientIds as $recId) {
                    SendCampaignRecipient::dispatch($recId);
                }
            }

            // Reload campaign to get latest counts if dispatched synchronously
            $campaign->refresh();

            return response()->json([
                'success' => true,
                'message' => $campaign->status === 'completed' ? 'Broadcast dispatched and delivered successfully!' : 'Broadcast queued for dispatch.',
                'campaign_id' => $campaign->id,
                'cost_paise' => $campaign->cost_paise,
                'cost_formatted' => '₹' . number_format($campaign->cost_paise / 100, 2),
                'success_count' => (int) $campaign->success_count,
                'failed_count' => (int) $campaign->failed_count,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => collect($e->errors())->flatten()->first() ?: $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Broadcast error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Broadcast dispatch failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function pause(Request $request, string $id): JsonResponse
    {
        $org = $this->resolveOrg($request);
        $campaign = BroadcastCampaign::where('organization_id', $org->id)->findOrFail($id);

        if ($campaign->status === 'completed' || $campaign->status === 'cancelled') {
            abort(422, 'Cannot pause a completed or cancelled campaign.');
        }

        $campaign->update([
            'is_paused' => true,
            'status' => 'paused',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Campaign paused successfully.',
        ]);
    }

    public function resume(Request $request, string $id): JsonResponse
    {
        $org = $this->resolveOrg($request);
        $campaign = BroadcastCampaign::where('organization_id', $org->id)->findOrFail($id);

        if ($campaign->status !== 'paused' && ! $campaign->is_paused) {
            abort(422, 'Campaign is not paused.');
        }

        $campaign->update([
            'is_paused' => false,
            'status' => 'processing',
        ]);

        // Re-dispatch remaining queued recipients
        $queuedIds = DB::table('campaign_recipients')
            ->where('campaign_id', $campaign->id)
            ->where('status', 'queued')
            ->pluck('id');

        foreach ($queuedIds as $rId) {
            SendCampaignRecipient::dispatch($rId);
        }

        return response()->json([
            'success' => true,
            'message' => "Campaign resumed. {$queuedIds->count()} queued messages are being processed.",
        ]);
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $org = $this->resolveOrg($request);
        $campaign = BroadcastCampaign::where('organization_id', $org->id)->findOrFail($id);

        if ($campaign->status === 'completed' || $campaign->status === 'cancelled') {
            abort(422, 'Campaign is already finished or cancelled.');
        }

        return DB::transaction(function () use ($campaign, $org) {
            $cancelledCount = DB::table('campaign_recipients')
                ->where('campaign_id', $campaign->id)
                ->where('status', 'queued')
                ->update(['status' => 'cancelled', 'updated_at' => now()]);

            $campaign->update([
                'status' => 'cancelled',
                'is_paused' => false,
            ]);

            // Refund unsent messages back to wallet
            if ($cancelledCount > 0 && $campaign->cost_paise > 0 && $campaign->recipients_count > 0) {
                $ratePerMsg = (int) round($campaign->cost_paise / $campaign->recipients_count);
                $refundPaise = $cancelledCount * $ratePerMsg;

                $this->walletService->refund(
                    org: $org,
                    amountPaise: $refundPaise,
                    description: "Refund for {$cancelledCount} unsent messages from cancelled campaign '{$campaign->name}'",
                    referenceId: $campaign->id,
                    metadata: ['campaign_id' => $campaign->id, 'cancelled_count' => $cancelledCount]
                );
            }

            return response()->json([
                'success' => true,
                'message' => "Campaign cancelled. {$cancelledCount} unsent messages were cancelled and refunded to your wallet.",
                'cancelled_count' => $cancelledCount,
            ]);
        });
    }

    public function analytics(Request $request, string $id): JsonResponse
    {
        $org = $this->resolveOrg($request);
        $campaign = BroadcastCampaign::where('organization_id', $org->id)->findOrFail($id);

        $counts = DB::table('campaign_recipients')
            ->where('campaign_id', $campaign->id)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $totalSelected = $campaign->recipients_count;
        $queued = $counts['queued'] ?? 0;
        $sent = $counts['sent'] ?? 0;
        $delivered = $counts['delivered'] ?? 0;
        $read = $counts['read'] ?? 0;
        $failed = $counts['failed'] ?? 0;
        $cancelled = $counts['cancelled'] ?? 0;

        $totalDispatched = $sent + $delivered + $read + $failed;
        $deliveryRate = $totalDispatched > 0 ? round((($delivered + $read) / $totalDispatched) * 100, 1) : 0;
        $readRate = ($delivered + $read) > 0 ? round(($read / ($delivered + $read)) * 100, 1) : 0;

        // Group failure reasons
        $failureReasons = DB::table('campaign_recipients')
            ->where('campaign_id', $campaign->id)
            ->where('status', 'failed')
            ->whereNotNull('error')
            ->selectRaw('error, COUNT(*) as count')
            ->groupBy('error')
            ->orderByDesc('count')
            ->take(10)
            ->get();

        // Count customer inbound replies
        $recipientPhones = DB::table('campaign_recipients')
            ->where('campaign_id', $campaign->id)
            ->pluck('phone');

        $replies = Message::where('direction', 'inbound')
            ->where('created_at', '>=', $campaign->created_at)
            ->whereHas('conversation', fn ($q) => $q->where('organization_id', $org->id)->whereIn('contact_phone', $recipientPhones))
            ->count();

        // Sample recent recipients
        $recipients = DB::table('campaign_recipients')
            ->where('campaign_id', $campaign->id)
            ->orderByDesc('updated_at')
            ->take(50)
            ->get();

        return response()->json([
            'campaign' => [
                'id' => $campaign->id,
                'name' => $campaign->name,
                'template_name' => $campaign->template_name,
                'template_language' => $campaign->template_language,
                'category' => $campaign->category,
                'cost_paise' => $campaign->cost_paise,
                'cost_formatted' => '₹' . number_format($campaign->cost_paise / 100, 2),
                'status' => $campaign->status,
                'is_paused' => (bool) $campaign->is_paused,
                'created_at' => $campaign->created_at->format('d M Y, h:i A'),
            ],
            'metrics' => [
                'total_selected' => $totalSelected,
                'queued' => $queued,
                'sent' => $sent,
                'delivered' => $delivered,
                'read' => $read,
                'failed' => $failed,
                'cancelled' => $cancelled,
                'replies' => $replies,
                'delivery_rate' => $deliveryRate,
                'read_rate' => $readRate,
                'failure_reasons' => $failureReasons,
            ],
            'recipients' => $recipients,
        ]);
    }

    public function export(Request $request, string $id)
    {
        $org = $this->resolveOrg($request);
        $campaign = BroadcastCampaign::where('organization_id', $org->id)->findOrFail($id);

        $rows = DB::table('campaign_recipients')
            ->where('campaign_id', $campaign->id)
            ->orderBy('id')
            ->get(['phone', 'name', 'status', 'error', 'wamid', 'updated_at']);

        $filename = 'campaign-' . \Illuminate\Support\Str::slug($campaign->name ?: $campaign->id) . '-report.csv';

        return response()->streamDownload(function () use ($rows, $campaign) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Campaign', 'Phone', 'Name', 'Status', 'Error', 'WAMID', 'Updated At']);
            foreach ($rows as $row) {
                fputcsv($out, [
                    $campaign->name,
                    $row->phone,
                    $row->name ?? '',
                    $row->status,
                    $row->error ?? '',
                    $row->wamid ?? '',
                    $row->updated_at ?? '',
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
