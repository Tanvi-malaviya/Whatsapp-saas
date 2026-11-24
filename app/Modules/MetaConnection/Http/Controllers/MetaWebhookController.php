<?php

namespace App\Modules\MetaConnection\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessMetaWebhook;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\Messaging\Models\WebhookInbox;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\AutomationService;
use App\Services\MetaApi;
use App\Shared\PhoneNumber;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class MetaWebhookController extends Controller
{
    public function verify(Request $request)
    {
        $expected = MetaApi::setting('verify_token');
        $token = $request->input('hub_verify_token', $request->input('hub.verify_token', ''));
        abort_unless($expected && $request->input('hub_mode', $request->input('hub.mode')) === 'subscribe' && hash_equals($expected, (string) $token), 403);
        return response((string) $request->input('hub_challenge', $request->input('hub.challenge')), 200)->header('Content-Type', 'text/plain');
    }

    public function receive(Request $request)
    {
        $secret = MetaApi::setting('app_secret');
        $signature = $request->header('X-Hub-Signature-256', '');
        abort_unless($secret && hash_equals('sha256='.hash_hmac('sha256', $request->getContent(), $secret), $signature), 403, 'Invalid webhook signature.');
        $payload = $request->validate(['object' => 'required|in:whatsapp_business_account', 'entry' => 'required|array']);
        foreach ($payload['entry'] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                $value = $change['value'] ?? [];
                $phoneId = $value['metadata']['phone_number_id'] ?? null;
                $channel = $phoneId ? WhatsAppChannel::withoutGlobalScopes()->where('phone_number_id', $phoneId)->where('status', 'connected')->first() : null;
                // WABA-level template events have no receiving phone ID.
                if (! $channel && ! $phoneId && ($entry['id'] ?? null)) {
                    $channel = WhatsAppChannel::withoutGlobalScopes()->where('waba_id', $entry['id'])->first();
                }
                if (! $channel) { continue; }
                $record = WebhookInbox::create(['provider' => 'meta', 'organization_id' => $channel->organization_id,
                    'phone_number_id' => $phoneId, 'payload' => $change, 'status' => 'pending']);
                ProcessMetaWebhook::dispatch($record->id)->afterCommit();
            }
        }
        return response('EVENT_RECEIVED', 200);
    }

    public function process(int $recordId): void
    {
        $entry = $payload['entry'][0] ?? null;
        $change = $entry['changes'][0]['value'] ?? null;

        if (! $change) {
            return;
        }

        // Process delivery/read receipt statuses from Meta
        $statuses = $change['statuses'] ?? [];
        if (! empty($statuses)) {
            foreach ($statuses as $st) {
                $statusWamid = $st['id'] ?? null;
                $newStatus = $st['status'] ?? null; // 'sent', 'delivered', 'read', 'failed'
                if ($statusWamid && $newStatus) {
                    $errors = $st['errors'] ?? [];
                    if (!empty($errors)) {
                        Log::warning("WhatsApp message delivery failed ({$statusWamid}): " . json_encode($errors));
                    }
                    Message::where('wamid', $statusWamid)->update(['status' => $newStatus]);
                }
            }
        }

        $messages = $change['messages'] ?? [];
        if (empty($messages)) {
            return;
        }

        // Get sender profile
        $contactProfile = $change['contacts'][0] ?? null;
        $contactName = $contactProfile['profile']['name'] ?? 'WhatsApp Customer';
        $phoneNumberId = $change['metadata']['phone_number_id'] ?? null;

        foreach ($messages as $msg) {
            $wamid = $msg['id'] ?? null;
            $fromNumber = $msg['from'] ?? null;
            $msgType = $msg['type'] ?? 'text';
            $textBody = $msg['text']['body'] ?? ($msg['button']['text'] ?? '');

            // Meta Cloud API: Customer sent a Cart from WhatsApp Catalog
            $orderItems = [];
            $totalAmount = 0.0;
            $currency = 'INR';
            $orderData = [];
            if ($msgType === 'order') {
                $orderData = $msg['order'] ?? [];
                $productItems = $orderData['product_items'] ?? [];
                foreach ($productItems as $pItem) {
                    $qty = (int) ($pItem['quantity'] ?? 1);
                    $price = (float) ($pItem['item_price'] ?? 0);
                    $retailerId = $pItem['product_retailer_id'] ?? '';
                    $currency = $pItem['currency'] ?? 'INR';
                    $matchedProduct = \App\Modules\Commerce\Models\CommerceProduct::where('retailer_id', $retailerId)->first();
                    $name = $matchedProduct?->name ?? $retailerId ?? 'Catalog Product';

                    $orderItems[] = [
                        'name' => $name,
                        'qty' => $qty,
                        'price' => $price,
                        'retailer_id' => $retailerId,
                    ];
                    $totalAmount += ($qty * $price);
                }

                $textBody = "🛒 New WhatsApp Cart Order (" . count($orderItems) . " item(s)) - Total: ₹" . number_format($totalAmount, 2);
                if (!empty($orderData['text'])) {
                    $textBody .= "\nNote: " . $orderData['text'];
                }
            }

            if (! $fromNumber || empty($textBody)) {
                continue;
            }

            // Deduplication: if message with this wamid already exists, skip
            if ($wamid && Message::where('wamid', $wamid)->exists()) {
                continue;
            }

            $normalizedPhone = (new PhoneNumber($fromNumber))->getE164();

            // 1. Match existing active conversation thread for this contact phone
            $existingConv = Conversation::where('contact_phone', $normalizedPhone)
                ->orderBy('last_message_at', 'desc')
                ->first();

            $org = null;
            if ($existingConv) {
                $org = Organization::find($existingConv->organization_id);
            }

            // 2. Fallback to active logged in user's current organization
            if (! $org) {
                $activeUserOrg = \App\Models\User::first()?->current_organization_id;
                if ($activeUserOrg && $phoneNumberId) {
                    $channel = WhatsAppChannel::where('phone_number_id', $phoneNumberId)
                        ->where('organization_id', $activeUserOrg)
                        ->first();
                    if ($channel) {
                        $org = Organization::find($channel->organization_id);
                    }
                }
            }

            // 3. Fallback to channel's organization
            if (! $org && $phoneNumberId) {
                $channel = WhatsAppChannel::where('phone_number_id', $phoneNumberId)->first();
                $org = $channel ? Organization::find($channel->organization_id) : null;
            }

            $org = $org ?? TenantContext::get() ?? Organization::first();

            if (! $org) {
                continue;
            }

            TenantContext::set($org);

            // Find or create active conversation thread in resolved organization
            $conversation = Conversation::firstOrCreate(
                [
                    'organization_id' => $org->id,
                    'contact_phone' => $normalizedPhone,
                ],
                [
                    'contact_name' => $contactName,
                    'channel_phone_number_id' => $phoneNumberId,
                    'status' => 'open',
                ]
            );

            // Extend 24h customer service window & update last activity
            $conversation->extendWindow();
            
            // Check for WhatsApp standard Opt-In / Opt-Out keywords
            $cleanText = strtoupper(trim($textBody));
            $optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'OPTOUT', 'CANCEL', 'STOPALL'];
            $optInKeywords = ['START', 'UNSTOP', 'YES'];

            if (in_array($cleanText, $optOutKeywords)) {
                $conversation->update(['is_opted_in' => false, 'last_message_at' => now()]);
            } elseif (in_array($cleanText, $optInKeywords)) {
                $conversation->update(['is_opted_in' => true, 'last_message_at' => now()]);
            } else {
                $conversation->update(['last_message_at' => now()]);
            }

            // Store inbound message
            Message::create([
                'conversation_id' => $conversation->id,
                'organization_id' => $org->id,
                'direction' => 'inbound',
                'sender_type' => 'contact',
                'sender_id' => $normalizedPhone,
                'wamid' => $wamid,
                'type' => $msgType,
                'content' => $textBody,
                'status' => 'received',
                'meta_cost_paise' => 0,
            ]);

            // If real WhatsApp cart order, record into CommerceOrder
            if ($msgType === 'order' && !empty($orderItems)) {
                $newOrder = \App\Modules\Commerce\Models\CommerceOrder::create([
                    'organization_id' => $org->id,
                    'order_number' => 'WA-' . rand(10000, 99999),
                    'customer_name' => $contactName,
                    'customer_phone' => $normalizedPhone,
                    'total_amount' => $totalAmount,
                    'currency' => $currency,
                    'status' => 'pending',
                    'items' => $orderItems,
                    'meta_order_id' => $wamid,
                    'notes' => $orderData['text'] ?? 'Placed directly via WhatsApp Catalog Cart.',
                ]);

                // Send instant WhatsApp order confirmation
                $confirmMsg = "🎉 *Order Placed Successfully!*\n\n"
                    . "Order No: *#{$newOrder->order_number}*\n"
                    . "Total Amount: *₹" . number_format($totalAmount, 2) . "*\n"
                    . "Items: " . count($orderItems) . "\n\n"
                    . "Thank you for shopping with us! Our team will contact you shortly to confirm your delivery.";

                Message::create([
                    'conversation_id' => $conversation->id,
                    'organization_id' => $org->id,
                    'direction' => 'outbound',
                    'sender_type' => 'bot',
                    'type' => 'text',
                    'content' => $confirmMsg,
                    'status' => 'sent',
                ]);
                $this->dispatchMetaReply($phoneNumberId, $fromNumber, $confirmMsg);
            }

            // If customer replied with text like ORDER / BUY / ORDER <SKU>
            $upperBody = strtoupper(trim($textBody));
            if ($msgType === 'text' && (str_starts_with($upperBody, 'ORDER') || str_starts_with($upperBody, 'BUY'))) {
                $matchedProduct = null;
                $allProducts = \App\Modules\Commerce\Models\CommerceProduct::where('organization_id', $org->id)->get();
                foreach ($allProducts as $p) {
                    if (str_contains($upperBody, strtoupper($p->retailer_id)) || str_contains($upperBody, strtoupper($p->name))) {
                        $matchedProduct = $p;
                        break;
                    }
                }

                // If SKU not specified, match the product sent most recently in this conversation
                if (!$matchedProduct) {
                    $lastProductMsg = Message::where('conversation_id', $conversation->id)
                        ->where('direction', 'outbound')
                        ->where('content', 'like', '%Product Message Sent:%')
                        ->latest()
                        ->first();

                    if ($lastProductMsg) {
                        foreach ($allProducts as $p) {
                            if (str_contains($lastProductMsg->content, $p->name)) {
                                $matchedProduct = $p;
                                break;
                            }
                        }
                    }
                    $message->update(['status' => $status['status'], 'metadata' => $meta]);
                    DB::table('campaign_recipients')->where('wamid', $status['id'])->update([
                        'status' => $status['status'],
                        'error' => $errorReason,
                        'updated_at' => now(),
                    ]);
                }
            }
            if ($channel) {
                foreach ($value['messages'] ?? [] as $incoming) { $this->incoming($org, $channel, $value, $incoming); }
                $channel->update(['webhook_verified_at' => now()]);
            }
            if (($record->payload['field'] ?? '') === 'message_template_status_update') {
                foreach (WhatsAppChannel::where('organization_id', $org->id)->get() as $ch) { \Illuminate\Support\Facades\Cache::forget('meta_templates_'.$ch->waba_id); }
            }
            $record->update(['status' => 'processed', 'error' => null]);
        } catch (\Throwable $exception) {
            $record->update(['status' => 'failed', 'error' => mb_substr($exception->getMessage(), 0, 2000)]);
            throw $exception;
        } finally { TenantContext::clear(); }
    }

    private function incoming(Organization $org, WhatsAppChannel $channel, array $value, array $incoming): void
    {
        $wamid = $incoming['id'] ?? null;
        if (! $wamid || empty($incoming['from'])) { return; }
        $phone = (new PhoneNumber($incoming['from']))->getE164();
        $profile = collect($value['contacts'] ?? [])->firstWhere('wa_id', $incoming['from']);
        $type = $incoming['type'] ?? 'text';
        $text = $incoming['text']['body'] ?? $incoming['button']['text'] ?? $incoming['interactive']['button_reply']['id'] ?? $incoming['interactive']['list_reply']['id'] ?? null;
        $text ??= $incoming[$type]['caption'] ?? match ($type) {
            'location' => json_encode($incoming['location'] ?? []),
            'contacts' => json_encode($incoming['contacts'] ?? []),
            'order' => 'New WhatsApp catalog order',
            default => ucfirst($type).' received',
        };
        $result = DB::transaction(function () use ($org, $channel, $incoming, $phone, $profile, $type, $text, $wamid) {
            // Serializes duplicate provider deliveries before any bot or order side effects.
            Organization::whereKey($org->id)->lockForUpdate()->firstOrFail();
            if (Message::where('wamid', $wamid)->exists()) { return null; }
            $conversation = Conversation::firstOrCreate([
                'organization_id' => $org->id, 'channel_phone_number_id' => $channel->phone_number_id, 'contact_phone' => $phone,
            ], ['channel_id' => $channel->id, 'contact_name' => $profile['profile']['name'] ?? $phone, 'status' => 'open', 'is_opted_in' => true]);
            $first = ! $conversation->messages()->where('direction', 'inbound')->exists();
            $sentAt = isset($incoming['timestamp']) ? \Carbon\CarbonImmutable::createFromTimestamp((int) $incoming['timestamp']) : now();
            $window = $sentAt->addHours(24);
            $conversation->update([
                'channel_id' => $channel->id, 'last_message_at' => max($sentAt, $conversation->last_message_at ?? $sentAt),
                'window_expires_at' => max($window, $conversation->window_expires_at ?? $window),
                'is_opted_in' => in_array(strtoupper(trim($text)), ['STOP', 'UNSUBSCRIBE', 'OPTOUT', 'CANCEL', 'STOPALL']) ? false : (in_array(strtoupper(trim($text)), ['START', 'UNSTOP', 'YES']) ? true : (bool) ($conversation->is_opted_in ?? true)),
                'unread_count' => $conversation->unread_count + 1,
            ]);
            $message = Message::create(['organization_id' => $org->id, 'conversation_id' => $conversation->id,
                'direction' => 'inbound', 'sender_type' => 'contact', 'sender_id' => $phone,
                'wamid' => $wamid, 'type' => $type, 'content' => $text, 'status' => 'received']);
            if ($type === 'order') { $this->order($org, $channel, $incoming, $conversation); }
            return [$conversation, $message, $first];
        });
        if (! $result) { return; }
        [$conversation, $message, $first] = $result;
        if (isset($incoming[$type]['id']) && in_array($type, ['image', 'audio', 'video', 'document', 'sticker'])) {
            $media = Http::withToken($channel->access_token)->timeout(20)->get(MetaApi::base().'/'.$incoming[$type]['id'])->throw()->json();
            $url = $media['url'] ?? '';
            $host = parse_url($url, PHP_URL_HOST) ?? '';
            abort_unless(str_starts_with($url, 'https://') && (str_ends_with($host, '.facebook.com') || str_ends_with($host, '.fbcdn.net') || str_ends_with($host, '.fbsbx.com')), 422, 'Unexpected media host.');
            $response = Http::withToken($channel->access_token)->timeout(30)->withOptions(['allow_redirects' => false])->get($url)->throw();
            if (strlen($response->body()) <= 52428800) {
                $path = 'messages/'.$org->id.'/'.$message->id;
                Storage::disk('local')->put($path, $response->body());
                $message->update(['metadata' => ['media_path' => $path, 'mime_type' => $media['mime_type'] ?? 'application/octet-stream', 'filename' => basename($incoming[$type]['filename'] ?? ucfirst($type))]]);
            }
        }
        if ($org->isSubscriptionActive() && $conversation->is_opted_in && $conversation->isWindowOpen() && ! $conversation->assigned_user_id && $type !== 'order') {
            $reply = app(AutomationService::class)->reply($org, $conversation, $text, $first);
            if ($reply) {
                $out = Message::create(['organization_id' => $org->id, 'conversation_id' => $conversation->id,
                    'direction' => 'outbound', 'sender_type' => 'bot', 'type' => 'text', 'content' => $reply, 'status' => 'queued']);
                \App\Jobs\SendWhatsAppMessage::dispatch($out->id, ['to' => preg_replace('/\D/', '', $phone), 'type' => 'text', 'text' => ['body' => $reply]]);
            }
        }
    }

    private function order(Organization $org, WhatsAppChannel $channel, array $incoming, Conversation $conversation): void
    {
        $items = []; $total = 0; $currency = $org->currency ?: 'INR';
        foreach ($incoming['order']['product_items'] ?? [] as $item) {
            $product = \App\Modules\Commerce\Models\CommerceProduct::where('retailer_id', $item['product_retailer_id'] ?? '')->first();
            $quantity = max(1, (int) ($item['quantity'] ?? 1)); $price = (float) ($item['item_price'] ?? 0);
            $currency = $item['currency'] ?? $currency;
            $items[] = ['name' => $product?->name ?? $item['product_retailer_id'], 'retailer_id' => $item['product_retailer_id'], 'qty' => $quantity, 'price' => $price]; $total += $quantity * $price;
        }
        \App\Modules\Commerce\Models\CommerceOrder::firstOrCreate(['organization_id' => $org->id, 'meta_order_id' => $incoming['id']], [
            'order_number' => 'WA-'.strtoupper(\Illuminate\Support\Str::random(12)), 'customer_name' => $conversation->contact_name,
            'customer_phone' => $conversation->contact_phone, 'total_amount' => $total, 'currency' => $currency,
            'status' => 'pending', 'items' => $items, 'notes' => $incoming['order']['text'] ?? null,
        ]);
    }
}
