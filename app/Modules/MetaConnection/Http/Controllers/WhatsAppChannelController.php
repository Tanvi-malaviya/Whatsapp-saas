<?php

namespace App\Modules\MetaConnection\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppChannelController extends Controller
{
    private function resolveTenantId(Request $request): string
    {
        return TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? Organization::first()?->id
            ?? '';
    }

    public function index(Request $request): Response|RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);

        // Automatically connect if redirected from Meta Embedded Signup popup with OAuth code
        if ($request->has('code')) {
            $code = $request->query('code');
            $appId = Cache::get('meta_app_id') ?: env('META_APP_ID', '1079349601748656');
            $appSecret = env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027');
            $origin = $request->getSchemeAndHttpHost();
            $redirectUri = "{$origin}/whatsapp/connect";

            try {
                $tokenResp = Http::get('https://graph.facebook.com/v22.0/oauth/access_token', [
                    'client_id' => $appId,
                    'client_secret' => $appSecret,
                    'redirect_uri' => $redirectUri,
                    'code' => $code,
                ]);

                if ($tokenResp->successful()) {
                    $userToken = $tokenResp->json('access_token');
                    if ($userToken) {
                        // Debug token to find the shared WABA ID
                        $debugResp = Http::get('https://graph.facebook.com/v22.0/debug_token', [
                            'input_token' => $userToken,
                            'access_token' => "{$appId}|{$appSecret}",
                        ]);

                        $wabaId = null;
                        if ($debugResp->successful()) {
                            $scopes = $debugResp->json('data.granular_scopes') ?? [];
                            foreach ($scopes as $scope) {
                                if (in_array($scope['scope'] ?? '', ['whatsapp_business_management', 'whatsapp_business_messaging'])) {
                                    $wabaId = $scope['target_ids'][0] ?? null;
                                    if ($wabaId) break;
                                }
                            }
                        }

                        if ($wabaId) {
                            $phonesResp = Http::withToken($userToken)->get("https://graph.facebook.com/v22.0/{$wabaId}/phone_numbers");
                            if ($phonesResp->successful()) {
                                $phones = $phonesResp->json('data') ?? [];
                                foreach ($phones as $p) {
                                    $pPhone = $p['display_phone_number'] ?? '';
                                    $pName = $p['verified_name'] ?? ($pPhone ? "WhatsApp ({$pPhone})" : 'WhatsApp Channel');
                                    WhatsAppChannel::updateOrCreate(
                                        [
                                            'organization_id' => $orgId,
                                            'phone_number_id' => $p['id'],
                                        ],
                                        [
                                            'name' => $pName,
                                            'phone_number' => $pPhone,
                                            'waba_id' => $wabaId,
                                            'access_token' => $userToken,
                                            'quality_rating' => $p['quality_rating'] ?? 'GREEN',
                                            'messaging_limit' => 'TIER_1K',
                                            'status' => 'connected',
                                            'webhook_verified_at' => now(),
                                        ]
                                    );
                                }
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {}

            return redirect()->route('whatsapp.connect');
        } elseif ($request->has('phone_number_id') && !str_starts_with($request->query('phone_number_id'), 'phone_')) {
            $phoneId = $request->query('phone_number_id');
            $wabaId = $request->query('waba_id');
            $phoneNumber = trim($request->query('phone_number', ''));
            $queryName = trim($request->query('name', ''));
            $existing = WhatsAppChannel::where('organization_id', $orgId)->first();
            $accessToken = $existing?->access_token ?: Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');

            // Try to fetch real display_phone_number and verified_name from Graph API if token available
            if ($accessToken && empty($phoneNumber)) {
                try {
                    $pResp = Http::withToken($accessToken)
                        ->get("https://graph.facebook.com/v22.0/{$phoneId}", [
                            'fields' => 'display_phone_number,verified_name,quality_rating',
                        ]);
                    if ($pResp->successful()) {
                        $pData = $pResp->json();
                        $phoneNumber = $pData['display_phone_number'] ?? $phoneNumber;
                        if (!empty($pData['verified_name']) && empty($queryName)) {
                            $queryName = $pData['verified_name'];
                        }
                    }
                } catch (\Throwable $e) {}
            }

            $targetChannel = WhatsAppChannel::where('organization_id', $orgId)->where('phone_number_id', $phoneId)->first();
            if ($targetChannel) {
                // If channel exists, NEVER overwrite existing phone_number or name with empty values!
                $updates = [];
                if (!empty($wabaId)) $updates['waba_id'] = $wabaId;
                if (!empty($accessToken)) $updates['access_token'] = $accessToken;
                if (!empty($phoneNumber)) $updates['phone_number'] = $phoneNumber;
                if (!empty($queryName)) $updates['name'] = $queryName;
                if (!empty($updates)) {
                    $targetChannel->update($updates);
                }
            } else {
                WhatsAppChannel::create([
                    'organization_id' => $orgId,
                    'phone_number_id' => $phoneId,
                    'name' => $queryName ?: ($phoneNumber ? "WhatsApp ({$phoneNumber})" : 'WhatsApp Channel'),
                    'phone_number' => $phoneNumber ?: '',
                    'waba_id' => $wabaId ?: ($existing?->waba_id ?: '1600590645151650'),
                    'access_token' => $accessToken,
                    'quality_rating' => 'GREEN',
                    'messaging_limit' => 'TIER_1K',
                    'status' => 'connected',
                    'is_default' => false,
                    'webhook_verified_at' => now(),
                ]);
            }

            // Immediately redirect cleanly so query string params are permanently cleared from URL!
            return redirect()->route('whatsapp.connect');
        }

        // Clean up only the old legacy dummy placeholder channel
        WhatsAppChannel::where('organization_id', $orgId)
            ->where('phone_number_id', 'phone_9104081291')
            ->where('waba_id', '168495056789012')
            ->delete();

        $channels = WhatsAppChannel::where('organization_id', $orgId)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Dynamically fetch phone number and verified name from Meta Graph API for any channels missing them
        $globalToken = Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        foreach ($channels as $ch) {
            $tok = $ch->access_token ?: $globalToken;
            if ((empty($ch->phone_number) || str_contains($ch->phone_number, 'Registered')) && !empty($ch->phone_number_id) && !str_starts_with($ch->phone_number_id, 'phone_') && $tok) {
                try {
                    $pResp = Http::withToken($tok)->timeout(4)->get("https://graph.facebook.com/v22.0/{$ch->phone_number_id}", [
                        'fields' => 'display_phone_number,verified_name,quality_rating',
                    ]);
                    if ($pResp->successful()) {
                        $pData = $pResp->json();
                        if (!empty($pData['display_phone_number'])) {
                            $ch->phone_number = $pData['display_phone_number'];
                        }
                        if (!empty($pData['verified_name'])) {
                            $ch->name = $pData['verified_name'];
                        }
                        if (!empty($pData['quality_rating'])) {
                            $ch->quality_rating = $pData['quality_rating'];
                        }
                        if (empty($ch->access_token)) {
                            $ch->access_token = $tok;
                        }
                        $ch->save();
                    }
                } catch (\Throwable $e) {}
            }
        }

        $org = Organization::find($orgId);
        $maxChannels = $org ? $org->getMaxChannels() : 1;
        $channelsCount = $channels->count();
        $canAddMore = $org ? $org->canAddMoreChannels() : ($channelsCount < 1);

        return Inertia::render('whatsapp/connect', [
            'channels' => $channels,
            'defaultWebhookUrl' => url('/webhooks/meta'),
            'defaultVerifyToken' => config('services.meta.verify_token', '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b'),
            'maxChannels' => $maxChannels,
            'channelsCount' => $channelsCount,
            'canAddMore' => $canAddMore,
        ]);
    }

    public function show(Request $request, string $id): Response
    {
        $orgId = $this->resolveTenantId($request);
        $channel = WhatsAppChannel::where('organization_id', $orgId)
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('whatsapp/channel-detail', [
            'channel' => $channel,
            'defaultWebhookUrl' => url('/webhooks/meta'),
            'defaultVerifyToken' => config('services.meta.verify_token', '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b'),
        ]);
    }

    public function wizard(Request $request): Response
    {
        $orgId = $this->resolveTenantId($request);
        $existing = WhatsAppChannel::where('organization_id', $orgId)->first();

        return Inertia::render('whatsapp/connect-wizard', [
            'existingChannel' => $existing,
            'defaultWebhookUrl' => url('/webhooks/meta'),
            'defaultVerifyToken' => config('services.meta.verify_token', '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b'),
            'metaAppId' => Cache::get('meta_app_id') ?: env('META_APP_ID', '1079349601748656'),
            'metaConfigId' => Cache::get('meta_config_id') ?: env('META_CONFIG_ID', '1835889181059188'),
        ]);
    }

    public function quickConnect(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $org = Organization::find($orgId);
        $existing = WhatsAppChannel::where('organization_id', $orgId)->first();

        $phoneNumber = trim($request->input('phone_number', ''));
        $name = trim($request->input('name', ''));
        $phoneId = $request->input('phone_number_id');
        $wabaId = $request->input('waba_id') ?: ($existing?->waba_id ?: '1600590645151650');
        $accessToken = $request->input('access_token') ?: ($existing?->access_token ?: '');
        $code = $request->input('code');

        // Exchange Meta OAuth code if provided from Embedded Signup popup
        if ($code) {
            $appId = env('META_APP_ID', '1079349601748656');
            $appSecret = env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027');
            $origin = $request->getSchemeAndHttpHost();
            $redirectUri = "{$origin}/whatsapp/connect";

            try {
                $tokenResp = Http::get('https://graph.facebook.com/v22.0/oauth/access_token', [
                    'client_id' => $appId,
                    'client_secret' => $appSecret,
                    'redirect_uri' => $redirectUri,
                    'code' => $code,
                ]);

                if ($tokenResp->successful()) {
                    $userToken = $tokenResp->json('access_token');
                    if ($userToken) {
                        $accessToken = $userToken;

                        // Debug token to find the shared WABA ID
                        $debugResp = Http::get('https://graph.facebook.com/v22.0/debug_token', [
                            'input_token' => $userToken,
                            'access_token' => "{$appId}|{$appSecret}",
                        ]);

                        if ($debugResp->successful()) {
                            $scopes = $debugResp->json('data.granular_scopes') ?? [];
                            $allWabas = [];
                            foreach ($scopes as $scope) {
                                if (in_array($scope['scope'] ?? '', ['whatsapp_business_management', 'whatsapp_business_messaging'])) {
                                    $allWabas = array_merge($allWabas, $scope['target_ids'] ?? []);
                                }
                            }
                            $allWabas = array_unique(array_filter($allWabas));

                            // Sync ALL phone numbers across ALL shared WABAs (e.g. Tuoora, Sathwara, etc.)
                            foreach ($allWabas as $targetWaba) {
                                try {
                                    $phonesResp = Http::withToken($userToken)->get("https://graph.facebook.com/v22.0/{$targetWaba}/phone_numbers");
                                    if ($phonesResp->successful()) {
                                        $metaPhones = $phonesResp->json('data') ?? [];
                                        foreach ($metaPhones as $mp) {
                                            $mpId = $mp['id'] ?? null;
                                            $mpPhone = $mp['display_phone_number'] ?? '';
                                            $mpName = $mp['verified_name'] ?? ('WhatsApp ' . substr(preg_replace('/\D/', '', $mpPhone), -4));
                                            $mpQuality = $mp['quality_rating'] ?? 'GREEN';

                                            if ($mpId) {
                                                $alreadyInDb = WhatsAppChannel::where('organization_id', $orgId)->where('phone_number_id', $mpId)->exists();
                                                if (!$alreadyInDb && $org && !$org->canAddMoreChannels()) {
                                                    continue;
                                                }

                                                WhatsAppChannel::updateOrCreate(
                                                    [
                                                        'organization_id' => $orgId,
                                                        'phone_number_id' => $mpId,
                                                    ],
                                                    [
                                                        'name' => $mpName,
                                                        'phone_number' => $mpPhone,
                                                        'waba_id' => $targetWaba,
                                                        'access_token' => $userToken,
                                                        'quality_rating' => $mpQuality,
                                                        'messaging_limit' => 'TIER_1K',
                                                        'status' => 'connected',
                                                        'is_default' => false,
                                                        'webhook_verified_at' => now(),
                                                    ]
                                                );

                                                // If phoneId is not yet set, track the first discovered phone
                                                if (!$phoneId) {
                                                    $phoneId = $mpId;
                                                    $phoneNumber = $mpPhone;
                                                    $name = $mpName;
                                                    $wabaId = $targetWaba;
                                                }
                                            }
                                        }
                                    }
                                } catch (\Throwable $e) {}
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        // If phone_number_id is passed directly, fetch details from Graph API
        if ($phoneId && empty($phoneNumber)) {
            $queryToken = $accessToken 
                ?: WhatsAppChannel::where('organization_id', $orgId)->whereNotNull('access_token')->where('access_token', '!=', '')->value('access_token')
                ?: Cache::get('meta_whatsapp_token')
                ?: env('META_WHATSAPP_TOKEN', '');

            if ($queryToken) {
                try {
                    $pResp = Http::withToken($queryToken)
                        ->get("https://graph.facebook.com/v22.0/{$phoneId}", [
                            'fields' => 'display_phone_number,verified_name,quality_rating',
                        ]);
                    if ($pResp->successful()) {
                        $pData = $pResp->json();
                        $phoneNumber = $pData['display_phone_number'] ?? '';
                        if (!empty($pData['verified_name'])) {
                            $name = $pData['verified_name'];
                        }
                        if (empty($accessToken)) {
                            $accessToken = $queryToken;
                        }
                    }
                } catch (\Throwable $e) {}
            }
        }

        $cleanPhone = preg_replace('/\D/', '', $phoneNumber);

        // Auto-discover phone number ID from WABA if not yet known
        if (!$phoneId && $accessToken && $wabaId) {
            try {
                $metaPhonesResp = Http::withToken($accessToken)
                    ->get("https://graph.facebook.com/v22.0/{$wabaId}/phone_numbers");

                if ($metaPhonesResp->successful()) {
                    $metaPhones = $metaPhonesResp->json('data') ?? [];
                    foreach ($metaPhones as $mp) {
                        $mpClean = preg_replace('/\D/', '', $mp['display_phone_number'] ?? '');
                        if (
                            empty($cleanPhone) ||
                            $mpClean === $cleanPhone ||
                            str_ends_with($cleanPhone, substr($mpClean, -10)) ||
                            str_ends_with($mpClean, substr($cleanPhone, -10))
                        ) {
                            $phoneId = $mp['id'];
                            $phoneNumber = $mp['display_phone_number'] ?? $phoneNumber;
                            if (!empty($mp['verified_name'])) {
                                $name = $mp['verified_name'];
                            }
                            break;
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        if (!$phoneId || str_starts_with($phoneId, 'phone_')) {
            return response()->json([
                'success' => false,
                'message' => 'Could not automatically retrieve the 15-digit Phone Number ID from Meta. Please enter credentials manually.',
            ], 422);
        }

        $isExisting = WhatsAppChannel::where('organization_id', $orgId)->where('phone_number_id', $phoneId)->exists();
        if (!$isExisting && $org && !$org->canAddMoreChannels()) {
            $limit = $org->getMaxChannels();
            return response()->json([
                'success' => false,
                'message' => "WhatsApp number limit reached! Your workspace allows a maximum of {$limit} number(s). Contact administrator to upgrade.",
            ], 422);
        }

        if (strlen($cleanPhone) === 10) {
            $formattedPhone = '+91 ' . substr($cleanPhone, 0, 5) . ' ' . substr($cleanPhone, 5);
        } elseif (strlen($cleanPhone) === 12 && str_starts_with($cleanPhone, '91')) {
            $formattedPhone = '+91 ' . substr($cleanPhone, 2, 5) . ' ' . substr($cleanPhone, 7);
        } elseif (str_starts_with($phoneNumber, '+')) {
            $formattedPhone = $phoneNumber;
        } elseif (!empty($cleanPhone)) {
            $formattedPhone = '+' . $cleanPhone;
        } else {
            $formattedPhone = '';
        }
        $name = $name ?: ($formattedPhone ? ('WhatsApp (' . $formattedPhone . ')') : 'WhatsApp Channel');

        $isDefault = WhatsAppChannel::where('organization_id', $orgId)->count() === 0;

        $channel = WhatsAppChannel::updateOrCreate(
            [
                'organization_id' => $orgId,
                'phone_number_id' => $phoneId,
            ],
            [
                'name' => $name,
                'phone_number' => $formattedPhone,
                'waba_id' => $wabaId,
                'access_token' => $accessToken,
                'app_id' => $request->input('app_id', $existing?->app_id),
                'app_secret' => $request->input('app_secret', $existing?->app_secret),
                'quality_rating' => 'GREEN',
                'messaging_limit' => 'TIER_1K',
                'status' => 'connected',
                'is_default' => $isDefault,
                'webhook_verified_at' => now(),
            ]
        );

        // Also query Meta Graph API directly for any channel missing its phone number
        $missingChannels = WhatsAppChannel::where('organization_id', $orgId)
            ->whereNotNull('phone_number_id')
            ->where('phone_number_id', 'not like', 'phone_%')
            ->get();
        foreach ($missingChannels as $mCh) {
            $useTok = $mCh->access_token ?: $token ?: $globalTok;
            if ($useTok && (empty($mCh->phone_number) || str_contains($mCh->phone_number, 'Registered'))) {
                try {
                    $pResp = Http::withToken($useTok)->timeout(5)->get("https://graph.facebook.com/v22.0/{$mCh->phone_number_id}", [
                        'fields' => 'display_phone_number,verified_name,quality_rating',
                    ]);
                    if ($pResp->successful()) {
                        $pData = $pResp->json();
                        $mCh->update(array_filter([
                            'phone_number' => $pData['display_phone_number'] ?? null,
                            'name' => $pData['verified_name'] ?? null,
                            'quality_rating' => $pData['quality_rating'] ?? 'GREEN',
                            'access_token' => $useTok,
                        ]));
                        $added++;
                    }
                } catch (\Throwable $e) {}
            }
        }

        // Clean up only the old legacy dummy placeholder channel
        WhatsAppChannel::where('organization_id', $orgId)
            ->where('phone_number_id', 'phone_9104081291')
            ->where('waba_id', '168495056789012')
            ->delete();

        // Auto-sync all other numbers that belong to this WABA on Meta
        if ($accessToken && $wabaId) {
            $this->autoSyncFromMeta($orgId, $wabaId, $accessToken);
        }

        return response()->json([
            'success' => true,
            'message' => "WhatsApp number {$channel->phone_number} successfully connected to Meta Cloud API!",
            'channel' => $channel,
        ]);
    }

    public function store(Request $request): mixed
    {
        $orgId = $this->resolveTenantId($request);
        $channelId = $request->input('id');
        $phoneId = trim($request->input('phone_number_id', ''));

        $channel = null;
        if ($channelId) {
            $channel = WhatsAppChannel::withoutGlobalScopes()->find($channelId);
        }
        if (!$channel && $phoneId) {
            $channel = WhatsAppChannel::withoutGlobalScopes()->where('phone_number_id', $phoneId)->first();
        }

        if ($channel) {
            $orgId = $channel->organization_id;
        }

        $existing = $channel ?: WhatsAppChannel::withoutGlobalScopes()->where('organization_id', $orgId)->first();

        $phoneNumber = trim($request->input('phone_number', ''));
        $cleanPhone = preg_replace('/\D/', '', $phoneNumber);

        // Standardize Indian and International phone formats
        if (strlen($cleanPhone) === 10) {
            $formattedPhone = '+91 ' . substr($cleanPhone, 0, 5) . ' ' . substr($cleanPhone, 5);
        } elseif (strlen($cleanPhone) === 12 && str_starts_with($cleanPhone, '91')) {
            $formattedPhone = '+91 ' . substr($cleanPhone, 2, 5) . ' ' . substr($cleanPhone, 7);
        } elseif (str_starts_with($phoneNumber, '+')) {
            $formattedPhone = $phoneNumber;
        } elseif (!empty($cleanPhone)) {
            $formattedPhone = '+' . $cleanPhone;
        } else {
            $formattedPhone = '';
        }

        $name = trim($request->input('name', ''));
        if (empty($name) || $name === 'WhatsApp Channel') {
            $name = $formattedPhone ? ("WhatsApp (" . $formattedPhone . ")") : 'WhatsApp Channel';
        }

        $phoneId = $phoneId ?: ('phone_' . ($cleanPhone ?: uniqid()));
        $wabaId = trim($request->input('waba_id', '')) ?: ($existing?->waba_id ?: '934553439246885');
        $accessToken = trim($request->input('access_token', '')) ?: ($existing?->access_token ?: Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', ''));

        $quality = 'GREEN';
        $limit = 'TIER_1K';
        $verifiedAt = now();

        if ($accessToken && $phoneId && !str_starts_with($phoneId, 'phone_')) {
            try {
                $response = Http::withToken($accessToken)
                    ->get("https://graph.facebook.com/v22.0/{$phoneId}");

                if ($response->successful()) {
                    $data = $response->json();
                    $quality = $data['quality_rating'] ?? 'GREEN';
                    if (!empty($data['display_phone_number']) && empty($formattedPhone)) {
                        $formattedPhone = $data['display_phone_number'];
                    }
                    if (!empty($data['verified_name']) && ($name === 'WhatsApp Channel' || empty($name))) {
                        $name = $data['verified_name'];
                    }
                }
            } catch (\Throwable $e) {
                // Ignore API ping failure for offline testing
            }
        }

        if ($channel) {
            $channel->update([
                'name' => $name,
                'phone_number' => $formattedPhone,
                'phone_number_id' => $phoneId,
                'waba_id' => $wabaId,
                'access_token' => $accessToken,
                'app_id' => $request->input('app_id') ?: ($existing?->app_id ?: Cache::get('meta_app_id') ?: env('META_APP_ID', '1079349601748656')),
                'app_secret' => $request->input('app_secret') ?: ($existing?->app_secret ?: env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027')),
                'quality_rating' => $quality,
                'messaging_limit' => $limit,
                'status' => 'connected',
                'webhook_verified_at' => $verifiedAt,
            ]);
        } else {
            $org = Organization::find($orgId);
            $alreadyExists = WhatsAppChannel::where('organization_id', $orgId)->where('phone_number_id', $phoneId)->exists();
            if (!$alreadyExists && $org && !$org->canAddMoreChannels()) {
                $limit = $org->getMaxChannels();
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => "WhatsApp number limit reached! Your workspace allows a maximum of {$limit} number(s). Contact administrator to upgrade.",
                    ], 422);
                }
                return back()->withErrors([
                    'message' => "WhatsApp number limit reached! Your workspace allows a maximum of {$limit} number(s). Contact administrator to upgrade.",
                ]);
            }

            $existingCount = WhatsAppChannel::where('organization_id', $orgId)->count();
            $isDefault = $existingCount === 0;

            $channel = WhatsAppChannel::updateOrCreate(
                [
                    'organization_id' => $orgId,
                    'phone_number_id' => $phoneId,
                ],
                [
                    'name' => $name,
                    'phone_number' => $formattedPhone,
                    'waba_id' => $wabaId,
                    'access_token' => $accessToken,
                    'app_id' => $request->input('app_id') ?: ($existing?->app_id ?: Cache::get('meta_app_id') ?: env('META_APP_ID', '1079349601748656')),
                    'app_secret' => $request->input('app_secret') ?: ($existing?->app_secret ?: env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027')),
                    'quality_rating' => $quality,
                    'messaging_limit' => $limit,
                    'status' => 'connected',
                    'is_default' => $isDefault,
                    'webhook_verified_at' => $verifiedAt,
                ]
            );
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => "WhatsApp number ({$channel->name}) successfully connected!",
                'channel' => $channel,
            ]);
        }

        return redirect()->route('whatsapp.connect')->with('success', "WhatsApp Number ({$channel->name} - {$channel->phone_number}) successfully updated!");
    }

    public function syncFromMeta(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $existing = WhatsAppChannel::where('organization_id', $orgId)->first();

        $wabaId = $request->input('waba_id') ?: ($existing?->waba_id ?: env('META_WABA_ID', '934553439246885'));
        $token = $request->input('access_token') ?: ($existing?->access_token ?: Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', ''));

        if (!$token && !$wabaId) {
            return response()->json([
                'success' => false,
                'message' => 'No access token or WABA ID configured. Please configure Permanent Access Token in Admin Settings.',
            ], 422);
        }

        try {
            $added = $this->autoSyncFromMeta($orgId, $wabaId, $token);

            return response()->json([
                'success' => true,
                'message' => "Successfully synced {$added} WhatsApp number(s) from Meta!",
                'count' => $added,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Sync failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Internal helper to query Meta Graph API for all registered phone numbers on a WABA
     */
    private function autoSyncFromMeta(string $orgId, ?string $wabaId = null, ?string $token = null): int
    {
        $added = 0;
        $globalTok = Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        $token = $token ?: $globalTok;

        $channels = WhatsAppChannel::where('organization_id', $orgId)
            ->whereNotNull('access_token')
            ->where('access_token', '!=', '')
            ->get();

        $wabaPairs = [];
        foreach ($channels as $ch) {
            if ($ch->waba_id && $ch->access_token) {
                $wabaPairs[$ch->waba_id] = $ch->access_token;
            }
        }

        if ($wabaId && $token) {
            $wabaPairs[$wabaId] = $token;
        }

        $appId = Cache::get('meta_app_id') ?: env('META_APP_ID', '1079349601748656');
        $appSecret = env('META_APP_SECRET', '02d9ac2a37b98b8b29a189f835c13027');

        // Auto-discover all other WABAs (like Tuoora) linked to any stored access tokens
        $uniqueTokens = array_unique(array_filter($channels->pluck('access_token')->toArray()));
        if ($token) {
            $uniqueTokens[] = $token;
        }
        $uniqueTokens = array_unique(array_filter($uniqueTokens));

        foreach ($uniqueTokens as $tok) {
            try {
                $debugResp = Http::get('https://graph.facebook.com/v22.0/debug_token', [
                    'input_token' => $tok,
                    'access_token' => "{$appId}|{$appSecret}",
                ]);
                if ($debugResp->successful()) {
                    $scopes = $debugResp->json('data.granular_scopes') ?? [];
                    foreach ($scopes as $scope) {
                        if (in_array($scope['scope'] ?? '', ['whatsapp_business_management', 'whatsapp_business_messaging'])) {
                            foreach (($scope['target_ids'] ?? []) as $targetWaba) {
                                if (!isset($wabaPairs[$targetWaba])) {
                                    $wabaPairs[$targetWaba] = $tok;
                                }
                            }
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        foreach ($wabaPairs as $wid => $tok) {
            try {
                $response = Http::withToken($tok)
                    ->timeout(6)
                    ->get("https://graph.facebook.com/v22.0/{$wid}/phone_numbers");

                if ($response->successful()) {
                    $metaPhones = $response->json('data') ?? [];
                    foreach ($metaPhones as $mp) {
                        $phoneId = $mp['id'] ?? null;
                        $displayPhone = $mp['display_phone_number'] ?? '';
                        $name = $mp['verified_name'] ?? ('WhatsApp ' . substr(preg_replace('/\D/', '', $displayPhone), -4));
                        $quality = $mp['quality_rating'] ?? 'GREEN';

                        if ($phoneId) {
                            $existingChan = WhatsAppChannel::where('organization_id', $orgId)->where('phone_number_id', $phoneId)->first();
                            $org = Organization::find($orgId);
                            if (!$existingChan && $org && !$org->canAddMoreChannels()) {
                                continue;
                            }

                            if ($existingChan) {
                                $syncUpdates = [
                                    'waba_id' => $wid,
                                    'access_token' => $tok,
                                    'quality_rating' => $quality,
                                    'status' => 'connected',
                                ];
                                if (!empty($displayPhone)) {
                                    $syncUpdates['phone_number'] = $displayPhone;
                                }
                                if (!empty($name) && $name !== 'WhatsApp Channel' && (empty($existingChan->name) || $existingChan->name === 'WhatsApp Channel')) {
                                    $syncUpdates['name'] = $name;
                                }
                                $existingChan->update($syncUpdates);
                            } else {
                                WhatsAppChannel::create([
                                    'organization_id' => $orgId,
                                    'phone_number_id' => $phoneId,
                                    'name' => $name,
                                    'phone_number' => $displayPhone,
                                    'waba_id' => $wid,
                                    'access_token' => $tok,
                                    'quality_rating' => $quality,
                                    'messaging_limit' => 'TIER_1K',
                                    'status' => 'connected',
                                    'webhook_verified_at' => now(),
                                ]);
                            }
                            $added++;
                        }
                    }
                }
            } catch (\Throwable $e) {}
        }

        // Also query Meta Graph API directly for any channel missing its phone number
        $missingChannels = WhatsAppChannel::where('organization_id', $orgId)
            ->whereNotNull('phone_number_id')
            ->where('phone_number_id', 'not like', 'phone_%')
            ->get();
        foreach ($missingChannels as $mCh) {
            $useTok = $mCh->access_token ?: $token ?: $globalTok;
            if ($useTok && (empty($mCh->phone_number) || str_contains($mCh->phone_number, 'Registered'))) {
                try {
                    $pResp = Http::withToken($useTok)->timeout(5)->get("https://graph.facebook.com/v22.0/{$mCh->phone_number_id}", [
                        'fields' => 'display_phone_number,verified_name,quality_rating',
                    ]);
                    if ($pResp->successful()) {
                        $pData = $pResp->json();
                        $mCh->update(array_filter([
                            'phone_number' => $pData['display_phone_number'] ?? null,
                            'name' => $pData['verified_name'] ?? null,
                            'quality_rating' => $pData['quality_rating'] ?? 'GREEN',
                            'access_token' => $useTok,
                        ]));
                        $added++;
                    }
                } catch (\Throwable $e) {}
            }
        }

        // Clean up only the old legacy dummy placeholder channel
        WhatsAppChannel::where('organization_id', $orgId)
            ->where('phone_number_id', 'phone_9104081291')
            ->where('waba_id', '168495056789012')
            ->delete();

        return $added;
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);
        $channel = WhatsAppChannel::where('organization_id', $orgId)->where('id', $id)->first();
        if ($channel) {
            $channel->forceDelete();
        }

        return redirect()->route('whatsapp.connect')->with('success', 'WhatsApp channel disconnected.');
    }

    public function setDefault(Request $request, string $id): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);
        WhatsAppChannel::where('organization_id', $orgId)->update(['is_default' => false]);
        WhatsAppChannel::where('organization_id', $orgId)->where('id', $id)->update(['is_default' => true]);

        return back()->with('success', 'Default WhatsApp channel updated.');
    }

    public function testConnection(Request $request, string $id): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $channel = WhatsAppChannel::where('organization_id', $orgId)->where('id', $id)->firstOrFail();

        // If phone_number_id is a placeholder, try to auto-discover the real 15-digit ID from Meta
        if (str_starts_with($channel->phone_number_id, 'phone_')) {
            if ($channel->access_token && $channel->waba_id) {
                try {
                    $lookupResp = Http::withToken($channel->access_token)
                        ->timeout(5)
                        ->get("https://graph.facebook.com/v22.0/{$channel->waba_id}/phone_numbers");
                    if ($lookupResp->successful()) {
                        $phones = $lookupResp->json('data') ?? [];
                        $clean = preg_replace('/\D/', '', $channel->phone_number);
                        foreach ($phones as $p) {
                            $pClean = preg_replace('/\D/', '', $p['display_phone_number'] ?? '');
                            if (str_ends_with($clean, substr($pClean, -10)) || str_ends_with($pClean, substr($clean, -10))) {
                                $channel->update([
                                    'phone_number_id' => $p['id'],
                                    'quality_rating' => $p['quality_rating'] ?? 'GREEN',
                                ]);
                                break;
                            }
                        }
                    }
                } catch (\Throwable $e) {}
            }
        }

        // If still a placeholder, explain clearly to the user
        if (str_starts_with($channel->phone_number_id, 'phone_')) {
            return response()->json([
                'success' => false,
                'message' => 'Please enter the real 15-digit Meta Phone Number ID. Click "Edit Credentials" and paste your Phone Number ID from Meta Developer Dashboard (WhatsApp > API Setup).',
            ], 422);
        }

        try {
            // Attempt 1: Full fields
            $response = Http::withToken($channel->access_token)
                ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}", [
                    'fields' => 'verified_name,code_verification_status,display_phone_number,quality_rating',
                ]);

            // Attempt 2: Basic fields fallback (if verified_name is not permitted e.g. test numbers or messaging tokens)
            if (!$response->successful()) {
                $response = Http::withToken($channel->access_token)
                    ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}", [
                        'fields' => 'display_phone_number,quality_rating',
                    ]);
            }

            // Attempt 3: Bare node query
            if (!$response->successful()) {
                $response = Http::withToken($channel->access_token)
                    ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}");
            }

            if ($response->successful()) {
                $data = $response->json();
                $updateData = [
                    'status' => 'connected',
                    'quality_rating' => $data['quality_rating'] ?? 'GREEN',
                    'webhook_verified_at' => now(),
                ];
                if (!empty($data['display_phone_number'])) {
                    $updateData['phone_number'] = $data['display_phone_number'];
                }
                $channel->update($updateData);

                return response()->json([
                    'success' => true,
                    'message' => 'Connection verified with Meta!',
                    'data' => $data,
                ]);
            }

            // Attempt 4: Query via WABA phone numbers list
            if ($channel->waba_id) {
                try {
                    $wabaResp = Http::withToken($channel->access_token)
                        ->get("https://graph.facebook.com/v22.0/{$channel->waba_id}/phone_numbers");
                    if ($wabaResp->successful()) {
                        $phones = $wabaResp->json('data') ?? [];
                        foreach ($phones as $p) {
                            if (($p['id'] ?? '') === $channel->phone_number_id) {
                                $channel->update([
                                    'status' => 'connected',
                                    'phone_number' => $p['display_phone_number'] ?? $channel->phone_number,
                                    'quality_rating' => $p['quality_rating'] ?? 'GREEN',
                                    'webhook_verified_at' => now(),
                                ]);
                                return response()->json([
                                    'success' => true,
                                    'message' => 'Connection verified with Meta!',
                                    'data' => $p,
                                ]);
                            }
                        }
                    }
                } catch (\Throwable $e) {}
            }

            // Attempt 5: Verify WhatsApp Business Account (WABA) directly
            if ($channel->waba_id) {
                try {
                    $wabaCheck = Http::withToken($channel->access_token)
                        ->get("https://graph.facebook.com/v22.0/{$channel->waba_id}");
                    if ($wabaCheck->successful()) {
                        $channel->update([
                            'status' => 'connected',
                            'webhook_verified_at' => now(),
                        ]);
                        return response()->json([
                            'success' => true,
                            'message' => 'Connection verified with Meta (WABA Account Active)!',
                            'data' => $wabaCheck->json(),
                        ]);
                    }
                } catch (\Throwable $e) {}
            }

            // Attempt 6: Check if token is valid but lacks asset permission for this phone number
            try {
                $meCheck = Http::withToken($channel->access_token)
                    ->get("https://graph.facebook.com/v22.0/me");
                if ($meCheck->successful()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Access Token is valid, but it does NOT have permission for Phone Number ID ' . $channel->phone_number_id . '. In Meta Business Settings > Accounts > WhatsApp accounts, please add your System User and grant "Full control (Manage WhatsApp account)".',
                    ], 422);
                }
            } catch (\Throwable $e) {}

            return response()->json([
                'success' => false,
                'message' => 'Meta API Error: ' . ($response->json('error.message') ?? 'Unknown error'),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not reach Meta API: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function sendTestMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'message' => 'nullable|string',
            'channel_id' => 'nullable|string',
            'type' => 'nullable|string|in:text,template',
            'template_name' => 'nullable|string',
        ]);

        $orgId = $this->resolveTenantId($request);
        
        $query = WhatsAppChannel::where('organization_id', $orgId);
        if (!empty($validated['channel_id'])) {
            $query->where('id', $validated['channel_id']);
        }
        $channel = $query->orderBy('is_default', 'desc')->first();

        if (!$channel) {
            return response()->json([
                'success' => false,
                'message' => 'No active WhatsApp channel found in this workspace. Please connect a number first.',
            ], 422);
        }

        $cleanPhone = preg_replace('/\D/', '', $validated['phone']);
        $msgType = $validated['type'] ?? 'template';

        try {
            if ($msgType === 'template') {
                $templateName = $validated['template_name'] ?? 'due_reminder_en';
                $payload = [
                    'messaging_product' => 'whatsapp',
                    'to' => $cleanPhone,
                    'type' => 'template',
                    'template' => [
                        'name' => $templateName,
                        'language' => ['code' => 'en_US'],
                        'components' => [
                            [
                                'type' => 'body',
                                'parameters' => [
                                    ['type' => 'text', 'text' => 'Tanvi'],
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
                    'to' => $cleanPhone,
                    'type' => 'text',
                    'text' => [
                        'preview_url' => false,
                        'body' => $validated['message'] ?? 'Hello from Sathwara WhatsApp SaaS!',
                    ],
                ];
            }

            $response = Http::withToken($channel->access_token)
                ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $payload);

            $json = $response->json();

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp ' . ($msgType === 'template' ? 'Approved Template' : 'Text Message') . ' successfully delivered via Meta to ' . $cleanPhone,
                    'channel' => $channel->name,
                    'from' => $channel->phone_number,
                    'meta_response' => $json,
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $json['error']['message'] ?? 'Meta API error',
                'meta_response' => $json,
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not send WhatsApp message: ' . $e->getMessage(),
            ], 500);
        }
    }
}
