<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class CampaignLimits
{
    public static function tierCapacity(?string $tier): ?int
    {
        $tier = strtoupper(trim($tier ?? ''));
        if (preg_match('/^(?:TIER_)?(\d+)(K|M)?$/', $tier, $matches)) {
            $limit = (int) $matches[1] * match ($matches[2] ?? '') {
                'K' => 1000, 'M' => 1000000, default => 1
            };

            return $limit > 0 ? $limit : null;
        }

        return null;
    }

    public function forChannel(?WhatsAppChannel $channel): array
    {
        $batchLimit = max(1, (int) PlatformSetting::read('campaign_max_contacts', 2000));
        $tier = $channel?->messaging_limit;
        $source = $tier ? 'saved' : 'unknown';
        $checkedAt = null;
        if ($channel && $channel->status === 'connected' && $channel->access_token && $channel->phone_number_id) {
            $result = Cache::remember('campaign_tier_'.$channel->id, 300, function () use ($channel) {
                try {
                    $response = Http::withToken($channel->access_token)->timeout(8)->get(MetaApi::base().'/'.$channel->phone_number_id, [
                        'fields' => 'whatsapp_business_manager_messaging_limit',
                    ]);
                    $value = $response->successful() ? $response->json('whatsapp_business_manager_messaging_limit') : null;
                    if (is_string($value) && (self::tierCapacity($value) || str_contains(strtoupper($value), 'UNLIMITED'))) {
                        $channel->update(['messaging_limit' => $value]);

                        return ['tier' => $value, 'checked_at' => now()->toIso8601String()];
                    }
                } catch (\Throwable $e) {
                    // Retain a clearly marked saved tier when Meta cannot be reached.
                }

                return [];
            });
            if (! empty($result['tier'])) {
                $tier = $result['tier'];
                $source = 'meta';
                $checkedAt = $result['checked_at'];
            }
        }
        $capacity = self::tierCapacity($tier);
        $used = $capacity && $channel ? array_sum(array_column(array_filter(
            $this->reservations($channel->organization_id),
            fn ($event) => $event['at'] <= now()->timestamp && $event['at'] > now()->subDay()->timestamp,
        ), 'count')) : null;

        return [
            'tier' => $tier ?: 'UNKNOWN', 'dailyLimit' => $capacity,
            'unlimited' => str_contains(strtoupper($tier ?? ''), 'UNLIMITED'),
            'batchLimit' => $capacity ? min($batchLimit, $capacity) : $batchLimit,
            'localRemaining' => $capacity ? max(0, $capacity - $used) : null,
            'configuredBatchLimit' => $batchLimit, 'source' => $source, 'checkedAt' => $checkedAt,
        ];
    }

    /** Conservative local reservations. Meta also counts traffic outside this workspace. */
    public function reservations(string $organizationId, ?string $excludeCampaignId = null): array
    {
        $cutoff = now()->subDay();
        $events = DB::table('campaign_recipients as r')
            ->join('broadcast_campaigns as c', 'c.id', '=', 'r.campaign_id')
            ->where('c.organization_id', $organizationId)
            ->when($excludeCampaignId, fn ($query) => $query->where('c.id', '!=', $excludeCampaignId))
            ->whereIn('r.status', ['queued', 'sent', 'delivered', 'read'])
            ->selectRaw("CASE WHEN r.status = 'queued' THEN COALESCE(c.scheduled_at, c.created_at) ELSE r.updated_at END as reserved_at, COUNT(*) as total")
            ->groupBy('reserved_at')->get()
            ->filter(fn ($event) => Carbon::parse($event->reserved_at)->gt($cutoff))
            ->map(fn ($event) => ['at' => Carbon::parse($event->reserved_at)->timestamp, 'count' => (int) $event->total])->all();

        $direct = DB::table('messages as m')->join('conversations as c', 'c.id', '=', 'm.conversation_id')
            ->where('m.organization_id', $organizationId)->where('m.direction', 'outbound')->where('m.type', 'template')
            ->whereIn('m.status', ['queued', 'sent', 'delivered', 'read'])->where('m.created_at', '>', $cutoff)
            ->whereNotExists(fn ($query) => $query->selectRaw('1')->from('campaign_recipients as r')->whereColumn('r.wamid', 'm.wamid'))
            ->selectRaw('m.created_at as reserved_at, COUNT(*) as total')->groupBy('m.created_at')->get();
        foreach ($direct as $event) {
            $events[] = ['at' => Carbon::parse($event->reserved_at)->timestamp, 'count' => (int) $event->total];
        }

        return $events;
    }

    /** Append batches after existing reservations; count repeats conservatively. */
    public function plan(array $sizes, ?int $capacity, array $events = [], ?int $now = null): array
    {
        $now ??= now()->timestamp;
        $candidate = $now;
        if ($capacity && $events) {
            $candidate = max($candidate, max(array_column($events, 'at')));
        }
        $times = [];
        foreach ($sizes as $size) {
            if ($capacity) {
                if ($size > $capacity) {
                    throw new \InvalidArgumentException('A campaign batch cannot exceed its messaging tier.');
                }
                while (true) {
                    $active = array_values(array_filter($events, fn ($event) => $event['at'] > $candidate - 86400 && $event['at'] <= $candidate));
                    if (array_sum(array_column($active, 'count')) + $size <= $capacity) {
                        break;
                    }
                    $candidate = min(array_column($active, 'at')) + 86400 + 1;
                }
                $events[] = ['at' => $candidate, 'count' => $size];
            }
            $times[] = $candidate;
        }

        return $times;
    }
}
