<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Modules\Campaigns\Http\Controllers\CampaignController;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\ApiMessagingService;
use App\Services\MetaApi;
use App\Services\WalletService;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeveloperController extends Controller
{
    public function __construct(
        protected ApiMessagingService $apiMessaging,
        protected WalletService $walletService,
    ) {}

    private function resolveOrg(Request $request): Organization
    {
        $org = TenantContext::get();
        if (! $org) {
            $orgId = $request->user()?->current_organization_id
                ?? $request->user()?->organizations()->first()?->id;
            $org = Organization::findOrFail($orgId);
            TenantContext::set($org);
        }

        return $org;
    }

    public function index(Request $request)
    {
        $org = $this->resolveOrg($request);

        // Ensure at least one active API key exists so user can test immediately
        $existingKeys = ApiKey::where('organization_id', $org->id)
            ->orderByDesc('created_at')
            ->get();

        if ($existingKeys->isEmpty()) {
            $newKey = ApiKey::generateFor($org, $request->user(), 'Primary Production Key');
            $existingKeys = collect([$newKey]);
        }

        $apiKeys = $existingKeys->map(fn (ApiKey $k) => [
            'id' => $k->id,
            'name' => $k->name,
            'key_prefix' => $k->key_prefix,
            'secret_key' => $k->revealKey(),
            'is_active' => (bool) $k->is_active,
            'last_used_at' => $k->last_used_at?->diffForHumans(),
            'created_at' => $k->created_at?->format('d M Y, h:i A'),
        ])->values()->all();

        $channels = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->orderByDesc('is_default')
            ->get(['id', 'name', 'phone_number', 'phone_number_id', 'is_default']);

        $defaultChannel = $channels->first();
        $templates = $defaultChannel
            ? collect(app(CampaignController::class)->getMetaTemplates($defaultChannel))
                ->map(fn ($t) => [
                    'name' => $t['name'],
                    'language' => $t['language'],
                    'category' => $t['category'],
                    'body' => $t['body'],
                ])
                ->values()
                ->all()
            : [];

        return Inertia::render('developers/index', [
            'channels' => $channels,
            'templates' => $templates,
            'apiKeys' => $apiKeys,
            'wallet' => $this->walletService->getBalances($org),
            'verifyToken' => MetaApi::setting('verify_token') ?: 'Configured in Admin Settings',
            'appUrl' => url('/'),
        ]);
    }

    public function storeKey(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $org = $this->resolveOrg($request);
        $key = ApiKey::generateFor($org, $request->user(), trim($data['name']));

        return response()->json([
            'success' => true,
            'key' => [
                'id' => $key->id,
                'name' => $key->name,
                'key_prefix' => $key->key_prefix,
                'secret_key' => $key->revealKey(),
                'is_active' => true,
                'last_used_at' => null,
                'created_at' => $key->created_at?->format('d M Y, h:i A'),
            ],
        ]);
    }

    public function revokeKey(Request $request, string $id): JsonResponse
    {
        $org = $this->resolveOrg($request);
        $key = ApiKey::where('organization_id', $org->id)->findOrFail($id);
        $key->delete();

        return response()->json(['success' => true]);
    }

    public function sendTest(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => 'required|string|max:30',
            'channel_id' => 'nullable|uuid',
            'type' => 'required|string|in:text,template',
            'message' => 'nullable|string|max:4096',
            'template_name' => 'nullable|string|max:512',
            'template_language' => 'nullable|string|max:30',
            'parameters' => 'nullable|array',
        ]);

        $org = $this->resolveOrg($request);

        $result = $this->apiMessaging->send($org, [
            'to' => $data['phone'],
            'channel_id' => $data['channel_id'] ?? null,
            'type' => $data['type'],
            'message' => $data['message'] ?? null,
            'template_name' => $data['template_name'] ?? null,
            'template_language' => $data['template_language'] ?? 'en_US',
            'parameters' => $data['parameters'] ?? [],
        ]);

        return response()->json($result, $result['status'] ?? 200);
    }
}
