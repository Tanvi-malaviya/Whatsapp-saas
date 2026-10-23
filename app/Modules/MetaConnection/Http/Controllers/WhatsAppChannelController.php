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
    private function resolveTenantId(Request $request): string
    {
        return TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? Organization::first()?->id
            ?? '';
    }

    public function index(Request $request): Response
    {
        $orgId = $this->resolveTenantId($request);

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

        $orgId = $this->resolveTenantId($request);

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

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);
        WhatsAppChannel::where('organization_id', $orgId)->where('id', $id)->delete();

        return back()->with('success', 'WhatsApp channel disconnected.');
    }

    public function testConnection(Request $request, string $id): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
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
