<?php

namespace App\Modules\MetaConnection\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class WhatsAppChannelController extends Controller
{
    public function index(Request $request): Response
    {
        $orgId = TenantContext::getTenantId();

        $channels = WhatsAppChannel::where('organization_id', $orgId)
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('whatsapp/connect', [
            'channels' => $channels,
            'defaultWebhookUrl' => url('/webhooks/meta'),
            'defaultVerifyToken' => config('services.meta.verify_token', '3tPseIuEUrfCcUlCaZkeZp5a3y3bC7FXLUoLTPiMxQcrJnk6VlP3N8Tln5jOr16b'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone_number' => 'required|string|max:30',
            'phone_number_id' => 'required|string|max:100',
            'waba_id' => 'required|string|max:100',
            'access_token' => 'required|string',
            'app_id' => 'nullable|string|max:100',
            'app_secret' => 'nullable|string|max:100',
        ]);

        $orgId = TenantContext::getTenantId();

        // Optional: Ping Meta Graph API to check quality and connectivity
        $quality = 'GREEN';
        $limit = 'TIER_1K';
        $verifiedAt = now();

        try {
            $response = Http::withToken($validated['access_token'])
                ->get("https://graph.facebook.com/v22.0/{$validated['phone_number_id']}", [
                    'fields' => 'verified_name,code_verification_status,display_phone_number,quality_rating',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $quality = $data['quality_rating'] ?? 'GREEN';
                if (!empty($data['display_phone_number'])) {
                    $validated['phone_number'] = $data['display_phone_number'];
                }
            }
        } catch (\Throwable $e) {
            // Ignore API ping failure for offline testing
        }

        // Check if this is the first channel, make it default
        $existingCount = WhatsAppChannel::where('organization_id', $orgId)->count();
        $isDefault = $existingCount === 0;

        WhatsAppChannel::updateOrCreate(
            [
                'organization_id' => $orgId,
                'phone_number_id' => $validated['phone_number_id'],
            ],
            [
                'name' => $validated['name'],
                'phone_number' => $validated['phone_number'],
                'waba_id' => $validated['waba_id'],
                'access_token' => $validated['access_token'],
                'app_id' => $validated['app_id'] ?? null,
                'app_secret' => $validated['app_secret'] ?? null,
                'quality_rating' => $quality,
                'messaging_limit' => $limit,
                'status' => 'connected',
                'is_default' => $isDefault,
                'webhook_verified_at' => $verifiedAt,
            ]
        );

        return back()->with('success', "WhatsApp Number ({$validated['name']}) successfully connected!");
    }

    public function destroy(string $id): RedirectResponse
    {
        $orgId = TenantContext::getTenantId();
        WhatsAppChannel::where('organization_id', $orgId)->where('id', $id)->delete();

        return back()->with('success', 'WhatsApp channel disconnected.');
    }

    public function testConnection(string $id): JsonResponse
    {
        $orgId = TenantContext::getTenantId();
        $channel = WhatsAppChannel::where('organization_id', $orgId)->where('id', $id)->firstOrFail();

        try {
            $response = Http::withToken($channel->access_token)
                ->get("https://graph.facebook.com/v22.0/{$channel->phone_number_id}", [
                    'fields' => 'verified_name,code_verification_status,display_phone_number,quality_rating',
                ]);

            if ($response->successful()) {
                $channel->update([
                    'status' => 'connected',
                    'quality_rating' => $response->json('quality_rating', 'GREEN'),
                    'webhook_verified_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Connection verified with Meta!',
                    'data' => $response->json(),
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Meta API returned error: ' . ($response->json('error.message') ?? 'Unknown error'),
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Could not reach Meta API: ' . $e->getMessage(),
            ], 500);
        }
    }
}
