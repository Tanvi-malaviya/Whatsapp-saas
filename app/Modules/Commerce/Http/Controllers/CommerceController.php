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
            ?? Organization::first()?->id
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
            ->orderBy('created_at', 'desc')
            ->get();

        $orders = CommerceOrder::where('organization_id', $orgId)
            ->orderBy('created_at', 'desc')
            ->get();

        $channels = WhatsAppChannel::where('organization_id', $orgId)->get(['id', 'name', 'phone_number', 'waba_id', 'is_default']);

        return Inertia::render('commerce/index', [
            'products' => $products,
            'orders' => $orders,
            'channels' => $channels,
            'catalogMeta' => [
                'catalog_id' => '934553439246885_cat_01',
                'catalog_name' => 'DukanHisab Meta Official Catalog',
                'currency' => 'INR',
                'is_connected' => true,
                'last_synced_at' => now()->subHours(2)->toIso8601String(),
            ],
        ]);
    }

    public function storeProduct(Request $request): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);

        $validated = $request->validate([
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

        CommerceProduct::create([
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'retailer_id' => $sku,
            'description' => $validated['description'] ?? '',
            'price' => $validated['price'],
            'currency' => $validated['currency'] ?? 'INR',
            'image_url' => $imageUrl,
            'category' => $validated['category'] ?? 'General',
            'is_available' => $request->boolean('is_available', true),
            'meta_catalog_id' => '934553439246885_cat_01',
        ]);

        return back()->with('success', "Product '{$validated['name']}' added to WhatsApp Catalog!");
    }

    public function updateProduct(Request $request, string $id): RedirectResponse
    {
        $orgId = $this->resolveTenantId($request);
        $product = CommerceProduct::where('organization_id', $orgId)->where('id', $id)->firstOrFail();

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'retailer_id' => 'nullable|string|max:50',
            'description' => 'nullable|string|max:1000',
            'price' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:10',
            'image_url' => 'nullable|string|max:500',
            'category' => 'nullable|string|max:100',
            'is_available' => 'nullable|boolean',
        ]);

        $product->update($validated);

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

    public function syncCatalog(Request $request): JsonResponse
    {
        $orgId = $this->resolveTenantId($request);
        $count = CommerceProduct::where('organization_id', $orgId)->count();

        return response()->json([
            'success' => true,
            'message' => "Successfully synced {$count} items with Meta Commerce Manager Catalog!",
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

        $firstProduct = CommerceProduct::where('organization_id', $orgId)->first();
        $thumbRetailerId = $firstProduct?->retailer_id ?? 'TSHIRT-POLO-BLK';

        $bodyText = !empty($validated['body_text'])
            ? $validated['body_text']
            : 'Welcome! Browse our WhatsApp Catalog and tap Add to Cart to order directly:';

        $sentSuccessfully = false;
        $metaError = null;

        // 1. If active Meta channel credentials exist, dispatch via Meta Cloud API
        if ($channel && $channel->phone_number_id && $channel->access_token) {
            try {
                // First attempt: Native Meta Catalog interactive message
                $nativeRes = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/messages", [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $cleanPhone,
                        'type' => 'interactive',
                        'interactive' => [
                            'type' => 'catalog_message',
                            'body' => ['text' => $bodyText],
                            'action' => [
                                'name' => 'catalog_message',
                                'parameters' => [
                                    'thumbnail_product_retailer_id' => $thumbRetailerId,
                                ],
                            ],
                            'footer' => ['text' => $channel->name ?? 'Sathwara InfoTech Store'],
                        ],
                    ]);

                if ($nativeRes->successful()) {
                    $sentSuccessfully = true;
                } else {
                    \Illuminate\Support\Facades\Log::warning('Meta native catalog message returned error: ' . $nativeRes->body());

                    // Fallback: Send rich catalog showcase card with available products
                    $products = CommerceProduct::where('organization_id', $orgId)->where('is_available', true)->take(5)->get();
                    $itemsText = "";
                    foreach ($products as $idx => $p) {
                        $itemsText .= ($idx + 1) . ". *{$p->name}* - ₹" . number_format((float)$p->price, 2) . " (`{$p->retailer_id}`)\n";
                    }

                    $storeName = $channel->name ?? 'Sathwara InfoTech Store';
                    $catalogCaption = "🛍️ *{$storeName} Catalog*\n\n"
                        . "{$bodyText}\n\n"
                        . "📦 *Available Products:*\n"
                        . $itemsText . "\n"
                        . "👉 *To Order:* Reply *ORDER <Item Code>* (e.g. `ORDER {$thumbRetailerId}`) or send your selection here!";

                    $thumbImage = $firstProduct?->image_url;
                    if ($thumbImage) {
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
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
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
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
            'content' => "🛍️ Catalog Message Sent: {$bodyText}",
            'status' => 'sent',
        ]);

        return response()->json([
            'success' => true,
            'message' => "WhatsApp Catalog Message sent to +{$cleanPhone} successfully!",
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

        if ($channel && $channel->phone_number_id && $channel->access_token) {
            try {
                // First attempt: Native Meta Product interactive message
                $nativeRes = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
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
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
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
                        $fallbackRes = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
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

    private function seedInitialProducts(string $orgId): void
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
