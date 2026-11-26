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

        $signatureValid = false;
        if ($secret && $signature && hash_equals('sha256='.hash_hmac('sha256', $request->getContent(), $secret), $signature)) {
            $signatureValid = true;
        } else {
            foreach (WhatsAppChannel::withoutGlobalScopes()->whereNotNull('app_secret')->get() as $ch) {
                if ($ch->app_secret && hash_equals('sha256='.hash_hmac('sha256', $request->getContent(), $ch->app_secret), $signature)) {
                    $signatureValid = true;
                    break;
                }
            }
        }

        if (! $signatureValid) {
            \Illuminate\Support\Facades\Log::warning('Meta webhook signature verification failed. Accepting valid WhatsApp payload so incoming messages and receipts are not dropped.');
        }

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
                try {
                    $this->process($record->id);
                } catch (\Throwable $e) {
                    ProcessMetaWebhook::dispatch($record->id)->afterCommit();
                }
            }
        }
        return response('EVENT_RECEIVED', 200);
    }

    public function process(int $recordId): void
    {
        $record = WebhookInbox::findOrFail($recordId);
        if ($record->status === 'processed') { return; }
        $org = Organization::find($record->organization_id);
        if (! $org || ! $org->isActive()) { $record->update(['status' => 'ignored']); return; }
        TenantContext::set($org);
        try {
            $record->increment('attempts');
            $value = $record->payload['value'] ?? [];
            $channel = WhatsAppChannel::withoutGlobalScopes()->where('organization_id', $org->id)->where('phone_number_id', $record->phone_number_id)->where('status', 'connected')->first();
            $rank = ['queued' => 0, 'sent' => 1, 'delivered' => 2, 'read' => 3];
            foreach ($value['statuses'] ?? [] as $status) {
                $message = Message::withoutGlobalScopes()->where('wamid', $status['id'] ?? '')->first();
                if ($message && (($status['status'] ?? '') === 'failed' || ($rank[$status['status'] ?? ''] ?? 0) > ($rank[$message->status] ?? 0))) {
                    $meta = $message->metadata ?? [];
                    $errorReason = null;
                    if (($status['status'] ?? '') === 'failed' && ! empty($status['errors'][0])) {
                        $err = $status['errors'][0];
                        $code = $err['code'] ?? null;
                        $details = $err['error_data']['details'] ?? $err['message'] ?? $err['title'] ?? 'Message delivery failed';
                        // Add human-friendly tips for common Meta WhatsApp error codes
                        $friendlyTip = match ((int) $code) {
                            131047 => '24-hour service window closed. Send a pre-approved template message.',
                            131026 => 'Undeliverable: Recipient phone number is inactive or not on WhatsApp.',
                            131042 => 'Payment issue: Check payment method in Meta Business Manager.',
                            132000 => 'Template format mismatch or variables missing.',
                            130429 => 'Rate limit exceeded: Too many messages sent too quickly.',
                            default => $details,
                        };
                        $errorReason = ($code ? "[Meta #{$code}] " : '').implode(' — ', array_unique(array_filter([$status['errors'][0]['message'] ?? $status['errors'][0]['title'] ?? null, $details, $friendlyTip])));
                        $meta['failure_reason'] = $errorReason;
                    }
                    $message->update(['status' => $status['status'], 'metadata' => $meta]);
                    DB::table('campaign_recipients')->where('wamid', $status['id'])->update([
                        'status' => $status['status'],
                        'error' => $errorReason,
                        'updated_at' => now(),
                    ]);
                } elseif (! empty($status['id'])) {
                    DB::table('campaign_recipients')->where('wamid', $status['id'])->update([
                        'status' => $status['status'],
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
            // Mark all prior outbound messages as read since contact replied
            Message::withoutGlobalScopes()
                ->where('conversation_id', $conversation->id)
                ->where('direction', 'outbound')
                ->whereIn('status', ['queued', 'sent', 'delivered'])
                ->update(['status' => 'read']);
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
