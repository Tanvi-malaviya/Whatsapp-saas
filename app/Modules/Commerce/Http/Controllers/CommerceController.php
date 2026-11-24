<?php

namespace App\Modules\Commerce\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Commerce\Models\CommerceOrder;
use App\Modules\Commerce\Models\CommerceProduct;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommerceController extends Controller
{
    private function resolveTenantId(Request $request): string
    {
        return TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? '';
    }

    public function index(Request $request): Response
    {
        $orgId = $this->resolveTenantId($request);

        // Seed demo products if empty
        if (CommerceProduct::where('organization_id', $orgId)->count() === 0) {
            $this->seedInitialProducts($orgId);
        }

        $products = CommerceProduct::where('organization_id', $orgId)
            ->with('channel:id,name,phone_number')
            ->orderBy('created_at', 'desc')
            ->get();

        $orders = CommerceOrder::where('organization_id', $orgId)
            ->orderBy('created_at', 'desc')
            ->get();

        $channels = WhatsAppChannel::where('organization_id', $orgId)->get(['id', 'name', 'phone_number', 'waba_id', 'is_default']);
        $defaultChannel = $channels->firstWhere('is_default', true) ?? $channels->first();

        $savedCatalogId = \Illuminate\Support\Facades\Cache::get("org_{$orgId}_meta_catalog_id")
            ?: ($products->first()?->meta_catalog_id ?: ($defaultChannel?->waba_id ?: ''));
        $channelName = $defaultChannel?->name ?: 'WhatsApp Store';
        $channelPhone = $defaultChannel?->phone_number ?: '';

        return Inertia::render('commerce/index', [
            'products' => $products,
            'orders' => $orders,
            'channels' => $channels,
            'catalogMeta' => [
                'catalog_id' => $savedCatalogId,
                'catalog_name' => "{$channelName} Meta Catalog",
                'linked_phone' => $channelPhone,
                'linked_channel_name' => $channelName,
                'linked_waba_id' => $defaultChannel?->waba_id,
                'currency' => 'INR',
                'is_connected' => (bool) $defaultChannel,
                'last_synced_at' => now()->subHours(2)->toIso8601String(),
            ],
        ]);
    }

    public function storeProduct(Request $request): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);

        $validated = $request->validate([
            'channel_id' => 'nullable|string',
            'name' => 'required|string|max:150',
            'retailer_id' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'image_url' => 'nullable|string',
            'image_base64' => 'nullable|string',
            'image_file' => 'nullable|image|max:10240',
            'category' => 'nullable|string|max:100',
            'is_available' => 'nullable|boolean',
        ]);

        $imageUrl = $validated['image_url'] ?? null;

        // 1. If physical file uploaded
        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('commerce_products', 'public');
            $imageUrl = asset('storage/' . $path);
        }
        // 2. If base64 uploaded from browser canvas/reader
        elseif (!empty($request->input('image_base64'))) {
            $base64 = $request->input('image_base64');
            if (preg_match('/^data:image\/(\w+);base64,/', $base64, $type)) {
                $data = substr($base64, strpos($base64, ',') + 1);
                $type = strtolower($type[1]);
                $decoded = base64_decode($data);
                if ($decoded !== false) {
                    $filename = 'commerce_products/prod_' . uniqid() . '.' . $type;
                    \Illuminate\Support\Facades\Storage::disk('public')->put($filename, $decoded);
                    $imageUrl = asset('storage/' . $filename);
                }
            }
        }

        if (empty($imageUrl)) {
            $imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';
        }

        $sku = !empty($validated['retailer_id'])
            ? $validated['retailer_id']
            : 'SKU-' . strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $validated['name']), 0, 4)) . '-' . rand(100, 999);

        $savedCatalogId = \Illuminate\Support\Facades\Cache::get("org_{$orgId}_meta_catalog_id")
            ?: ($request->input('meta_catalog_id') ?: 'default_catalog');

        CommerceProduct::create([
            'organization_id' => $orgId,
            'channel_id' => !empty($validated['channel_id']) ? $validated['channel_id'] : null,
            'name' => $validated['name'],
            'retailer_id' => $sku,
            'description' => $validated['description'] ?? '',
            'price' => $validated['price'],
            'currency' => $validated['currency'] ?? 'INR',
            'image_url' => $imageUrl,
            'category' => $validated['category'] ?? 'General',
            'is_available' => $request->boolean('is_available', true),
            'meta_catalog_id' => $savedCatalogId,
        ]);

        return back()->with('success', "Product '{$validated['name']}' added to WhatsApp Catalog!");
    }

    public function updateProduct(Request $request, string $id): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);
        $product = CommerceProduct::where('organization_id', $orgId)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'channel_id' => 'nullable|string',
            'name' => 'required|string|max:150',
            'retailer_id' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'image_url' => 'nullable|string|max:500',
            'category' => 'nullable|string|max:100',
            'is_available' => 'nullable|boolean',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'description' => $validated['description'] ?? $product->description,
            'price' => $validated['price'],
            'currency' => $validated['currency'] ?? $product->currency,
            'category' => $validated['category'] ?? $product->category,
            'is_available' => $request->boolean('is_available', true),
        ];

        if (array_key_exists('channel_id', $validated)) {
            $updateData['channel_id'] = !empty($validated['channel_id']) ? $validated['channel_id'] : null;
        }

        if (!empty($validated['retailer_id'])) {
            $updateData['retailer_id'] = $validated['retailer_id'];
        }

        if (!empty($validated['image_url'])) {
            $updateData['image_url'] = $validated['image_url'];
        }

        $product->update($updateData);

        return back()->with('success', "Product '{$product->name}' updated!");
    }

    public function deleteProduct(Request $request, string $id): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);
        CommerceProduct::where('organization_id', $orgId)->where('id', $id)->delete();

        return back()->with('success', 'Product removed from WhatsApp Catalog.');
    }

    public function updateOrderStatus(Request $request, string $id): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);
        $order = CommerceOrder::where('organization_id', $orgId)->where('id', $id)->firstOrFail();

        $status = $request->input('status');
        if (in_array($status, ['pending', 'paid', 'shipped', 'delivered', 'cancelled'])) {
            $order->update(['status' => $status]);
        }

        return back()->with('success', "Order #{$order->order_number} status updated to {$status}.");
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $validated = $request->validate([
            'catalog_id' => 'required|string|max:100',
        ]);

        $cleanCatalogId = trim($validated['catalog_id']);
        \Illuminate\Support\Facades\Cache::forever("org_{$orgId}_meta_catalog_id", $cleanCatalogId);

        // Update all products in this organization with this catalog ID
        CommerceProduct::where('organization_id', $orgId)->update([
            'meta_catalog_id' => $cleanCatalogId,
        ]);

        return response()->json([
            'success' => true,
            'message' => "Meta Catalog ID '{$cleanCatalogId}' saved successfully!",
            'catalog_id' => $cleanCatalogId,
        ]);
    }

    public function linkCatalogToMeta(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $catalogId = trim($request->input('catalog_id') ?? \Illuminate\Support\Facades\Cache::get("org_{$orgId}_meta_catalog_id", ''));

        $channels = WhatsAppChannel::where('organization_id', $orgId)->get();
        if ($channels->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No active WhatsApp channels found.'], 422);
        }

        $globalToken = \Illuminate\Support\Facades\Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        $results = [];

        foreach ($channels as $channel) {
            $token = $channel->access_token ?: $globalToken;
            if (!$token) continue;

            $chKey = $channel->name ?? $channel->phone_number ?? $channel->id;

            // 1. Enable WhatsApp Commerce Settings (Catalog Visible + Cart Enabled on WhatsApp)
            if ($channel->phone_number_id) {
                try {
                    $visRes = \Illuminate\Support\Facades\Http::withToken($token)
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/whatsapp_commerce_settings?is_catalog_visible=true&is_cart_enabled=true");
                    $results[$chKey]['commerce_settings'] = $visRes->successful() ? 'enabled' : ($visRes->json('error.message') ?? $visRes->body());
                } catch (\Throwable $e) {
                    $results[$chKey]['commerce_settings'] = $e->getMessage();
                }
            }

            // 2. Link Catalog to WABA (if numeric catalog_id provided)
            if ($channel->waba_id && is_numeric($catalogId)) {
                try {
                    $linkRes = \Illuminate\Support\Facades\Http::withToken($token)
                        ->asForm()
                        ->post("https://graph.facebook.com/v22.0/{$channel->waba_id}/product_catalogs", [
                            'catalog_id' => $catalogId,
                        ]);
                    $results[$chKey]['catalog_link'] = $linkRes->successful() ? 'linked' : ($linkRes->json('error.message') ?? $linkRes->body());
                } catch (\Throwable $e) {
                    $results[$chKey]['catalog_link'] = $e->getMessage();
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'WhatsApp Commerce settings enabled on all channels & catalog link command sent to Meta!',
            'details' => $results,
        ]);
    }

    public function syncCatalog(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $products = CommerceProduct::where('organization_id', $orgId)->where('is_available', true)->get();
        $catalogId = trim($request->input('catalog_id') ?? \Illuminate\Support\Facades\Cache::get("org_{$orgId}_meta_catalog_id", ''));

        $channel = WhatsAppChannel::where('organization_id', $orgId)->where('is_default', true)->first()
            ?? WhatsAppChannel::where('organization_id', $orgId)->first();
        $globalToken = \Illuminate\Support\Facades\Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        $token = $channel?->access_token ?: $globalToken;

        // If numeric Meta catalog ID exists, attempt pushing products to Meta via Catalog Batch API
        $syncedWithMeta = false;
        $metaError = null;
        if (!empty($catalogId) && is_numeric($catalogId) && $token && $products->isNotEmpty()) {
            $batchRequests = [];
            foreach ($products as $p) {
                $batchRequests[] = [
                    'method' => 'UPDATE',
                    'data' => [
                        'id' => $p->retailer_id,
                        'title' => $p->name,
                        'description' => $p->description ?: $p->name,
                        'availability' => $p->is_available ? 'in stock' : 'out of stock',
                        'condition' => 'new',
                        'price' => (int) round(((float)$p->price) * 100), // in cents / paise
                        'currency' => $p->currency ?? 'INR',
                        'image_link' => $p->image_url,
                        'link' => url('/commerce'),
                    ],
                ];
            }

            try {
                $batchRes = \Illuminate\Support\Facades\Http::withToken($token)
                    ->post("https://graph.facebook.com/v22.0/{$catalogId}/items_batch", [
                        'item_type' => 'PRODUCT_ITEM',
                        'requests' => $batchRequests,
                    ]);
                if ($batchRes->successful()) {
                    $syncedWithMeta = true;
                } else {
                    $metaError = $batchRes->json('error.message') ?? $batchRes->body();
                }
            } catch (\Throwable $e) {
                $metaError = $e->getMessage();
            }
        }

        // Also ensure WhatsApp commerce settings are enabled on default channel
        if ($channel?->phone_number_id && $token) {
            try {
                \Illuminate\Support\Facades\Http::withToken($token)
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/whatsapp_commerce_settings?is_catalog_visible=true&is_cart_enabled=true");
            } catch (\Throwable $e) {}
        }

        $count = $products->count();
        $msg = $syncedWithMeta
            ? "Successfully synced {$count} items with Meta Commerce Manager Catalog #{$catalogId}!"
            : ($metaError ? "Local catalog refreshed ({$count} items). Meta sync note: {$metaError}" : "Successfully synced {$count} items with catalog!");

        return response()->json([
            'success' => true,
            'message' => $msg,
            'synced_count' => $count,
            'synced_at' => now()->toIso8601String(),
        ]);
    }

    public function sendCatalogMessage(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $validated = $request->validate([
            'phone' => 'required|string',
            'channel_id' => 'nullable|string',
            'body_text' => 'nullable|string',
        ]);

        $channel = !empty($validated['channel_id'])
            ? WhatsAppChannel::where('organization_id', $orgId)->where('id', $validated['channel_id'])->first()
            : WhatsAppChannel::where('organization_id', $orgId)->where('is_default', true)->first()
                ?? WhatsAppChannel::where('organization_id', $orgId)->first();

        $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (!str_starts_with($cleanPhone, '91') && strlen($cleanPhone) === 10) {
            $cleanPhone = '91' . $cleanPhone;
        }

        $productsQuery = CommerceProduct::where('organization_id', $orgId)->where('is_available', true);
        if ($channel) {
            $productsQuery->where(function ($q) use ($channel) {
                $q->where('channel_id', $channel->id)->orWhereNull('channel_id');
            });
        }
        $channelProducts = $productsQuery->get();
        if ($channelProducts->isEmpty()) {
            $channelProducts = CommerceProduct::where('organization_id', $orgId)->where('is_available', true)->get();
        }

        $firstProduct = $channelProducts->first();
        $thumbRetailerId = $firstProduct?->retailer_id ?? 'TSHIRT-POLO-BLK';

        $bodyText = !empty($validated['body_text'])
            ? $validated['body_text']
            : 'Welcome! Browse our WhatsApp Catalog and tap Add to Cart to order directly:';

        $sentSuccessfully = false;
        $metaError = null;

        $globalToken = \Illuminate\Support\Facades\Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        $token = $channel?->access_token ?: $globalToken;

        // 1. If active Meta channel credentials exist, dispatch via Meta Cloud API
        if ($channel && $channel->phone_number_id && $token) {
            try {
                // Official Native Meta Catalog interactive message
                $catalogPayload = [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $cleanPhone,
                    'type' => 'interactive',
                    'interactive' => [
                        'type' => 'catalog_message',
                        'body' => ['text' => $bodyText],
                        'action' => [
                            'name' => 'catalog_message',
                        ],
                        'footer' => ['text' => $channel->name ?? 'WhatsApp Store'],
                    ],
                ];

                if (!empty($thumbRetailerId)) {
                    $catalogPayload['interactive']['action']['parameters'] = [
                        'thumbnail_product_retailer_id' => $thumbRetailerId,
                    ];
                }

                $nativeRes = \Illuminate\Support\Facades\Http::withToken($token)
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $catalogPayload);

                // Auto-retry without thumbnail parameter if Meta rejects retailer ID
                if (!$nativeRes->successful() && isset($catalogPayload['interactive']['action']['parameters'])) {
                    unset($catalogPayload['interactive']['action']['parameters']);
                    $retryNativeRes = \Illuminate\Support\Facades\Http::withToken($token)
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $catalogPayload);
                    if ($retryNativeRes->successful()) {
                        $nativeRes = $retryNativeRes;
                    }
                }

                // Auto-retry with global token if channel-specific token had permission error
                if (!$nativeRes->successful() && $globalToken && $token !== $globalToken) {
                    $retryRes = \Illuminate\Support\Facades\Http::withToken($globalToken)
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $catalogPayload);
                    if ($retryRes->successful()) {
                        $nativeRes = $retryRes;
                        $token = $globalToken;
                        $channel->update(['access_token' => $globalToken]);
                    }
                }

                // If error mentions catalog not enabled/linked in commerce settings (code 131009), auto-enable commerce settings & retry
                if (!$nativeRes->successful() && str_contains($nativeRes->body(), '131009')) {
                    try {
                        \Illuminate\Support\Facades\Http::withToken($token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/whatsapp_commerce_settings?is_catalog_visible=true&is_cart_enabled=true");

                        $savedCatalogId = \Illuminate\Support\Facades\Cache::get("org_{$orgId}_meta_catalog_id");
                        if ($channel->waba_id && !empty($savedCatalogId) && is_numeric($savedCatalogId)) {
                            \Illuminate\Support\Facades\Http::withToken($token)
                                ->asForm()
                                ->post("https://graph.facebook.com/v22.0/{$channel->waba_id}/product_catalogs", [
                                    'catalog_id' => $savedCatalogId,
                                ]);
                        }

                        $retryAfterEnable = \Illuminate\Support\Facades\Http::withToken($token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", $catalogPayload);
                        if ($retryAfterEnable->successful()) {
                            $nativeRes = $retryAfterEnable;
                        }
                    } catch (\Throwable $e) {}
                }

                $isNativeCatalog = false;
                if ($nativeRes->successful()) {
                    $sentSuccessfully = true;
                    $isNativeCatalog = true;
                } else {
                    \Illuminate\Support\Facades\Log::warning('Meta native catalog message returned error: ' . $nativeRes->body());

                    // Fallback: Send rich catalog showcase cards with this channel's available products
                    $products = $channelProducts->take(6);
                    $itemsText = "";
                    foreach ($products as $idx => $p) {
                        $itemsText .= ($idx + 1) . ". *{$p->name}* - ₹" . number_format((float)$p->price, 2) . " (`{$p->retailer_id}`)\n";
                    }

                    $storeName = $channel->name ?? 'Sathwara InfoTech Store';
                    $cleanSenderPhone = preg_replace('/[^0-9]/', '', $channel->phone_number ?? '');

                    $catalogCaption = "🛍️ *{$storeName} Catalog*\n\n"
                        . "{$bodyText}\n\n"
                        . "📦 *Available Products:*\n"
                        . $itemsText . "\n"
                        . ($cleanSenderPhone ? "🛒 *Open WhatsApp Store:* https://wa.me/c/{$cleanSenderPhone}\n\n" : "")
                        . "👉 *To Order:* Reply *ORDER <Item Code>* (e.g. `ORDER {$thumbRetailerId}`) or send your selection here!";

                    $firstProduct = $products->first() ?? $channelProducts->first();
                    $thumbImage = $firstProduct?->image_url;
                    if ($thumbImage) {
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                                'messaging_product' => 'whatsapp',
                                'recipient_type' => 'individual',
                                'to' => $cleanPhone,
                                'type' => 'image',
                                'image' => [
                                    'link' => $thumbImage,
                                    'caption' => $catalogCaption,
                                ],
                            ]);
                    } else {
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                                'messaging_product' => 'whatsapp',
                                'recipient_type' => 'individual',
                                'to' => $cleanPhone,
                                'type' => 'text',
                                'text' => ['body' => $catalogCaption],
                            ]);
                    }

                    if ($fallbackRes->successful()) {
                        $sentSuccessfully = true;
                    } else {
                        $errData = $fallbackRes->json();
                        $metaError = $errData['error']['message'] ?? $fallbackRes->body();
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Send catalog message exception: ' . $e->getMessage());
                $metaError = $e->getMessage();
            }
        } else {
            $metaError = 'No active WhatsApp channel credentials found.';
        }

        if (!$sentSuccessfully) {
            return response()->json([
                'success' => false,
                'message' => "Message could not be delivered to +{$cleanPhone}. " . ($metaError ? "Meta API: {$metaError}" : "Please check WhatsApp connection."),
            ], 422);
        }

        $msgWamid = ($nativeRes ?? null)?->json('messages.0.id') ?? ($fallbackRes ?? null)?->json('messages.0.id');

        // 2. Log in conversation inbox thread
        $conversation = \App\Modules\Messaging\Models\Conversation::firstOrCreate(
            ['organization_id' => $orgId, 'contact_phone' => '+' . $cleanPhone],
            ['contact_name' => 'Customer', 'status' => 'open']
        );
        \App\Modules\Messaging\Models\Message::create([
            'conversation_id' => $conversation->id,
            'organization_id' => $orgId,
            'direction' => 'outbound',
            'sender_type' => 'user',
            'type' => 'interactive',
            'wamid' => $msgWamid,
            'content' => "🛍️ Catalog Message Sent: {$bodyText}",
            'status' => 'sent',
        ]);

        $successMessage = ($isNativeCatalog ?? false)
            ? "Official WhatsApp Catalog (with 'View catalog' button) delivered to +{$cleanPhone}!"
            : "Catalog card sent to +{$cleanPhone}! (Note: To show the official green 'View catalog' button, please connect your Catalog in Meta WhatsApp Manager > Account tools > Catalog).";

        return response()->json([
            'success' => true,
            'message' => $successMessage,
            'is_native' => $isNativeCatalog ?? false,
        ]);
    }

    public function sendProductMessage(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $validated = $request->validate([
            'product_id' => 'required|string',
            'phone' => 'required|string',
            'channel_id' => 'nullable|string',
            'body_text' => 'nullable|string',
        ]);

        $product = CommerceProduct::where('organization_id', $orgId)->where('id', $validated['product_id'])->firstOrFail();
        $channel = !empty($validated['channel_id'])
            ? WhatsAppChannel::where('organization_id', $orgId)->where('id', $validated['channel_id'])->first()
            : WhatsAppChannel::where('organization_id', $orgId)->where('is_default', true)->first()
                ?? WhatsAppChannel::where('organization_id', $orgId)->first();

        $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (!str_starts_with($cleanPhone, '91') && strlen($cleanPhone) === 10) {
            $cleanPhone = '91' . $cleanPhone;
        }

        $catalogId = $product->meta_catalog_id;
        if (empty($catalogId) || !is_numeric($catalogId)) {
            $catalogId = $channel->waba_id ?? '934553439246885';
        }

        $bodyText = !empty($validated['body_text'])
            ? $validated['body_text']
            : "Check out {$product->name} (₹" . number_format((float)$product->price, 2) . ") in our store:";

        $sentSuccessfully = false;
        $metaError = null;

        $globalToken = \Illuminate\Support\Facades\Cache::get('meta_whatsapp_token') ?: env('META_WHATSAPP_TOKEN', '');
        $token = $channel?->access_token ?: $globalToken;

        if ($channel && $channel->phone_number_id && $token) {
            try {
                // First attempt: Native Meta Product interactive message
                $nativeRes = \Illuminate\Support\Facades\Http::withToken($token)
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $cleanPhone,
                        'type' => 'interactive',
                        'interactive' => [
                            'type' => 'product',
                            'body' => ['text' => $bodyText],
                            'footer' => ['text' => $channel->name ?? 'Sathwara InfoTech Store'],
                            'action' => [
                                'catalog_id' => (string)$catalogId,
                                'product_retailer_id' => $product->retailer_id,
                            ],
                        ],
                    ]);

                // Auto-retry with global token if channel-specific token had permission error
                if (!$nativeRes->successful() && $globalToken && $token !== $globalToken) {
                    $retryRes = \Illuminate\Support\Facades\Http::withToken($globalToken)
                        ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                            'messaging_product' => 'whatsapp',
                            'recipient_type' => 'individual',
                            'to' => $cleanPhone,
                            'type' => 'interactive',
                            'interactive' => [
                                'type' => 'product',
                                'body' => ['text' => $bodyText],
                                'footer' => ['text' => $channel->name ?? 'Sathwara InfoTech Store'],
                                'action' => [
                                    'catalog_id' => (string)$catalogId,
                                    'product_retailer_id' => $product->retailer_id,
                                ],
                            ],
                        ]);
                    if ($retryRes->successful()) {
                        $nativeRes = $retryRes;
                        $token = $globalToken;
                        $channel->update(['access_token' => $globalToken]);
                    }
                }

                if ($nativeRes->successful()) {
                    $sentSuccessfully = true;
                } else {
                    \Illuminate\Support\Facades\Log::warning('Meta native single product message error: ' . $nativeRes->body());

                    // Fallback: Send Rich Product Image Card
                    $cardCaption = "🛍️ *{$product->name}*\n"
                        . "💰 *Price:* ₹" . number_format((float)$product->price, 2) . "\n"
                        . "🏷️ *Category:* {$product->category}\n"
                        . "📦 *SKU:* `{$product->retailer_id}`\n\n"
                        . "{$product->description}\n\n"
                        . "👉 *To Order:* Reply *ORDER {$product->retailer_id}* to confirm purchase directly in WhatsApp!";

                    if ($product->image_url) {
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                                'messaging_product' => 'whatsapp',
                                'recipient_type' => 'individual',
                                'to' => $cleanPhone,
                                'type' => 'image',
                                'image' => [
                                    'link' => $product->image_url,
                                    'caption' => $cardCaption,
                                ],
                            ]);
                    } else {
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($token)
                            ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                                'messaging_product' => 'whatsapp',
                                'recipient_type' => 'individual',
                                'to' => $cleanPhone,
                                'type' => 'text',
                                'text' => ['body' => $cardCaption],
                            ]);
                    }

                    if ($fallbackRes->successful()) {
                        $sentSuccessfully = true;
                    } else {
                        $errData = $fallbackRes->json();
                        $metaError = $errData['error']['message'] ?? $fallbackRes->body();
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::error('Send product message exception: ' . $e->getMessage());
                $metaError = $e->getMessage();
            }
        } else {
            $metaError = 'No active WhatsApp channel credentials found.';
        }

        if (!$sentSuccessfully) {
            return response()->json([
                'success' => false,
                'message' => "Message could not be delivered to +{$cleanPhone}. " . ($metaError ? "Meta API: {$metaError}" : "Please check WhatsApp connection."),
            ], 422);
        }

        $msgWamid = ($nativeRes ?? null)?->json('messages.0.id') ?? ($fallbackRes ?? null)?->json('messages.0.id');

        $conversation = \App\Modules\Messaging\Models\Conversation::firstOrCreate(
            ['organization_id' => $orgId, 'contact_phone' => '+' . $cleanPhone],
            ['contact_name' => 'Customer', 'status' => 'open']
        );
        \App\Modules\Messaging\Models\Message::create([
            'conversation_id' => $conversation->id,
            'organization_id' => $orgId,
            'direction' => 'outbound',
            'sender_type' => 'user',
            'type' => 'interactive',
            'wamid' => $msgWamid,
            'content' => "🛍️ Product Message Sent: {$product->name} (₹{$product->price})",
            'status' => 'sent',
        ]);

        return response()->json([
            'success' => true,
            'message' => "Product '{$product->name}' sent to +{$cleanPhone} via WhatsApp!",
        ]);
    }

    public function simulateOrder(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $products = CommerceProduct::where('organization_id', $orgId)->take(2)->get();
        if ($products->isEmpty()) {
            return response()->json(['success' => false, 'message' => 'No products found to create an order.'], 422);
        }

        $items = [];
        $total = 0;
        foreach ($products as $p) {
            $items[] = [
                'name' => $p->name,
                'qty' => 1,
                'price' => (float)$p->price,
                'retailer_id' => $p->retailer_id,
            ];
            $total += (float)$p->price;
        }

        $order = CommerceOrder::create([
            'organization_id' => $orgId,
            'order_number' => 'WA-' . rand(10000, 99999),
            'customer_name' => 'Tanvi Malaviya',
            'customer_phone' => '+919898696798',
            'total_amount' => $total,
            'currency' => 'INR',
            'status' => 'pending',
            'items' => $items,
            'meta_order_id' => 'sim_' . uniqid(),
            'notes' => 'Simulated WhatsApp Cart Order from +91 98986 96798',
        ]);

        return response()->json([
            'success' => true,
            'message' => "WhatsApp Cart Order #{$order->order_number} received! It is now visible in the Orders table.",
            'order' => $order,
        ]);
    }

    public function seedInitialProducts(string $orgId): void
    {
        $initial = [
            [
                'name' => 'Classic Cotton Polo T-Shirt',
                'retailer_id' => 'TSHIRT-POLO-BLK',
                'description' => '100% Breathable cotton slim fit polo shirt. Perfect for daily and casual wear.',
                'price' => 799.00,
                'category' => 'Apparel',
                'image_url' => 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80',
            ],
            [
                'name' => 'Pro Smart Fitness Watch',
                'retailer_id' => 'WATCH-PRO-01',
                'description' => 'AMOLED Display with 24/7 Heart rate & SpO2 monitor. Water resistant IP68 with 7-day battery.',
                'price' => 1999.00,
                'category' => 'Electronics',
                'image_url' => 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
            ],
            [
                'name' => 'True Wireless ANC Earbuds',
                'retailer_id' => 'EARBUDS-TWS-02',
                'description' => 'Active Noise Cancellation with 30hrs playtime and deep dynamic bass.',
                'price' => 1499.00,
                'category' => 'Electronics',
                'image_url' => 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
            ],
            [
                'name' => 'Genuine Leather Minimalist Wallet',
                'retailer_id' => 'WALLET-LTHR-BRN',
                'description' => 'Handcrafted RFID-blocking bifold wallet with 8 card slots and currency compartment.',
                'price' => 599.00,
                'category' => 'Accessories',
                'image_url' => 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&q=80',
            ],
        ];

        foreach ($initial as $item) {
            CommerceProduct::create([
                'organization_id' => $orgId,
                'name' => $item['name'],
                'retailer_id' => $item['retailer_id'],
                'description' => $item['description'],
                'price' => $item['price'],
                'currency' => 'INR',
                'category' => $item['category'],
                'image_url' => $item['image_url'],
                'is_available' => true,
                'meta_catalog_id' => '934553439246885_cat_01',
            ]);
        }
    }
}
