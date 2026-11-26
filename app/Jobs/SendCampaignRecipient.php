<?php

namespace App\Jobs;

use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Crm\Models\Contact;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\CampaignLimits;
use App\Services\MetaApi;
use App\Shared\TenantContext;
use Carbon\CarbonInterface;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SendCampaignRecipient implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public int $timeout = 60;

    public function __construct(public int $recipientId) {}

    public static function enqueue(int $recipientId, ?CarbonInterface $scheduledAt = null): void
    {
        $pending = self::dispatch($recipientId);
        if ($scheduledAt?->isFuture()) {
            $pending->delay($scheduledAt);
            if (config('queue.default') === 'sync') {
                $pending->onConnection('database');
            }
        }
    }

    public function handle(MetaApi $api): void
    {
        $lock = Cache::lock('campaign-recipient-'.$this->recipientId, $this->timeout + 30);
        if (! $lock->get()) {
            return;
        }
        try {
            $this->send($api);
        } finally {
            $lock->release();
        }
    }

    private function reserveActualStart(BroadcastCampaign $campaign): void
    {
        $capacity = CampaignLimits::tierCapacity($campaign->payload['messaging_tier'] ?? null);
        if (! $capacity || isset($campaign->payload['batch_started_at'])) {
            return;
        }
        DB::transaction(function () use ($campaign, $capacity) {
            Organization::whereKey($campaign->organization_id)->lockForUpdate()->firstOrFail();
            $fresh = BroadcastCampaign::withoutGlobalScopes()->findOrFail($campaign->id);
            if (isset($fresh->payload['batch_started_at'])) {
                return;
            }
            $events = array_values(array_filter(
                app(CampaignLimits::class)->reservations($campaign->organization_id, $campaign->id),
                fn ($event) => $event['at'] <= now()->timestamp,
            ));
            $time = app(CampaignLimits::class)->plan([$fresh->recipients_count], $capacity, $events)[0];
            $scheduledAt = Carbon::createFromTimestamp($time, config('app.timezone'));
            $changes = ['scheduled_at' => $scheduledAt];
            if ($scheduledAt->isFuture()) {
                $changes['status'] = 'scheduled';
            } else {
                $changes['payload'] = [...$fresh->payload, 'batch_started_at' => now()->toIso8601String()];
            }
            $fresh->update($changes);
        });
        $campaign->refresh();
    }

    private function send(MetaApi $api): void
    {
        $r = DB::table('campaign_recipients')->find($this->recipientId);
        if (! $r || $r->status !== 'queued') {
            return;
        }
        $campaign = BroadcastCampaign::withoutGlobalScopes()->findOrFail($r->campaign_id);
        if (! $campaign->is_paused && ! $campaign->scheduled_at?->isFuture()) {
            $this->reserveActualStart($campaign);
        }
        if ($campaign->scheduled_at?->isFuture()) {
            // Waiting for allowance is a new scheduled job, not a failed send attempt.
            self::enqueue($this->recipientId, $campaign->scheduled_at);

            return;
        }
        if ($campaign->is_paused || $campaign->status === 'cancelled') {
            return;
        }
        $org = Organization::findOrFail($campaign->organization_id);
        TenantContext::set($org);
        try {
            abort_unless($org->isActive(), 422, 'Workspace suspended.');
            $channel = WhatsAppChannel::where('status', 'connected')->findOrFail($campaign->channel_id);
            abort_if(Contact::where('contact_phone', $r->phone)->where('is_opted_in', false)->exists(), 422, 'Recipient opted out.');
            $conversation = Conversation::firstOrCreate(['organization_id' => $org->id, 'channel_phone_number_id' => $channel->phone_number_id, 'contact_phone' => $r->phone], ['channel_id' => $channel->id, 'contact_name' => $r->name ?: $r->phone, 'status' => 'open', 'is_opted_in' => true]);
            $wamid = $api->send($channel, ['to' => preg_replace('/\D/', '', $r->phone), 'type' => 'template', 'template' => $campaign->payload['template']]);
            DB::transaction(function () use ($r, $campaign, $conversation, $wamid, $org) {
                Message::create(['organization_id' => $org->id, 'conversation_id' => $conversation->id, 'direction' => 'outbound', 'sender_type' => 'agent', 'type' => 'template', 'content' => $campaign->payload['content'], 'wamid' => $wamid, 'status' => 'sent']);
                $conversation->update(['last_message_at' => now()]);
                DB::table('campaign_recipients')->where('id', $r->id)->update(['status' => 'sent', 'wamid' => $wamid, 'updated_at' => now()]);
            });
        } catch (\Throwable $e) {
            DB::table('campaign_recipients')->where('id', $r->id)->update(['status' => 'failed', 'error' => mb_substr($e->getMessage(), 0, 2000), 'updated_at' => now()]);
        } finally {
            $counts = DB::table('campaign_recipients')->where('campaign_id', $campaign->id)->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
            $sent = ($counts['sent'] ?? 0) + ($counts['delivered'] ?? 0) + ($counts['read'] ?? 0);
            $failed = $counts['failed'] ?? 0;
            $campaign->update(['success_count' => $sent, 'failed_count' => $failed, 'status' => ($counts['queued'] ?? 0) > 0 ? 'processing' : ($failed ? ($sent ? 'partial' : 'failed') : 'completed')]);
            TenantContext::clear();
        }
    }
}
