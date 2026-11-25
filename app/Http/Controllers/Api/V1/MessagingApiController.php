<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Modules\Campaigns\Http\Controllers\CampaignController;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\ApiMessagingService;
use App\Services\WalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessagingApiController extends Controller
{
    public function __construct(
        protected ApiMessagingService $apiMessaging,
        protected WalletService $walletService,
    ) {}

    public function me(Request $request): JsonResponse
    {
        $org = $request->attributes->get('api_organization');
        $balances = $this->walletService->getBalances($org);

        return response()->json([
            'success' => true,
            'workspace' => [
                'id' => $org->id,
                'name' => $org->name,
                'status' => $org->status,
                'subscription_plan' => $org->subscription_plan,
                'subscription_expires_at' => $org->subscription_expires_at?->toIso8601String(),
            ],
            'wallet' => $balances,
            'rates_paise' => [
                'marketing' => $this->walletService->getRatePerMessage('MARKETING'),
                'utility' => $this->walletService->getRatePerMessage('UTILITY'),
                'authentication' => $this->walletService->getRatePerMessage('AUTHENTICATION'),
                'service' => $this->walletService->getRatePerMessage('SERVICE'),
            ],
        ]);
    }

    public function channels(Request $request): JsonResponse
    {
        $org = $request->attributes->get('api_organization');
        $channels = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->orderByDesc('is_default')
            ->get(['id', 'name', 'phone_number', 'phone_number_id', 'waba_id', 'quality_rating', 'is_default', 'status']);

        return response()->json([
            'success' => true,
            'channels' => $channels,
        ]);
    }

    public function templates(Request $request): JsonResponse
    {
        $org = $request->attributes->get('api_organization');
        $channelId = $request->query('channel_id');

        $channel = WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->when($channelId, fn ($q) => $q->where('id', $channelId))
            ->orderByDesc('is_default')
            ->first();

        if (! $channel) {
            return response()->json([
                'success' => false,
                'error' => 'no_connected_channel',
                'message' => 'No connected WhatsApp channel found.',
            ], 404);
        }

        $templates = app(CampaignController::class)->getMetaTemplates($channel);

        return response()->json([
            'success' => true,
            'channel_id' => $channel->id,
            'templates' => $templates,
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'to' => 'required|string|max:30',
            'type' => 'nullable|string|in:text,template,image,document',
            'channel_id' => 'nullable|uuid',
            'name' => 'nullable|string|max:100',
            'message' => 'nullable|string|max:4096',
            'text' => 'nullable|array',
            'text.body' => 'nullable|string|max:4096',
            'text.preview_url' => 'nullable|boolean',
            'template' => 'nullable|array',
            'template.name' => 'nullable|string|max:512',
            'template.language' => 'nullable|array',
            'template.language.code' => 'nullable|string|max:30',
            'template.components' => 'nullable|array',
            'template_name' => 'nullable|string|max:512',
            'template_language' => 'nullable|string|max:30',
            'parameters' => 'nullable|array',
            'media_url' => 'nullable|url:https|max:2000',
            'caption' => 'nullable|string|max:1024',
            'filename' => 'nullable|string|max:255',
            'image' => 'nullable|array',
            'document' => 'nullable|array',
        ]);

        $org = $request->attributes->get('api_organization');
        $result = $this->apiMessaging->send($org, $validated);

        return response()->json($result, $result['status'] ?? 200);
    }

    public function status(Request $request, string $id): JsonResponse
    {
        $org = $request->attributes->get('api_organization');

        $message = Message::where('organization_id', $org->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('wamid', $id);
            })
            ->first();

        if (! $message) {
            return response()->json([
                'success' => false,
                'error' => 'not_found',
                'message' => 'Message not found in this workspace.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => [
                'id' => $message->id,
                'wamid' => $message->wamid,
                'direction' => $message->direction,
                'type' => $message->type,
                'status' => $message->status,
                'cost_paise' => $message->meta_cost_paise,
                'error' => $message->metadata['error'] ?? null,
                'created_at' => $message->created_at?->toIso8601String(),
                'updated_at' => $message->updated_at?->toIso8601String(),
            ],
        ]);
    }
}
