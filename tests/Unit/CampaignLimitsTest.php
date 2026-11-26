<?php

namespace Tests\Unit;

use App\Services\CampaignLimits;
use Tests\TestCase;

class CampaignLimitsTest extends TestCase
{
    public function test_supported_tiers_and_unknown_values(): void
    {
        foreach (['TIER_250' => 250, 'TIER_2K' => 2000, 'TIER_10000' => 10000, 'TIER_100K' => 100000, 'TIER_1K' => 1000] as $tier => $capacity) {
            $this->assertEquals($capacity, CampaignLimits::tierCapacity($tier));
        }
        $this->assertNull(CampaignLimits::tierCapacity('UNLIMITED'));
        $this->assertNull(CampaignLimits::tierCapacity('UNKNOWN'));
    }

    public function test_rolling_window_waits_for_prior_usage_and_existing_future_reservations(): void
    {
        $now = 200000;
        $planner = new CampaignLimits;
        $this->assertEquals([$now + 86401, $now + 172802], $planner->plan([2000, 1000], 2000, [['at' => $now, 'count' => 500]], $now));
        $this->assertEquals([$now + 86400 + 86401], $planner->plan([1000], 2000, [['at' => $now + 86400, 'count' => 2000]], $now));
        $this->assertEquals([$now, $now], $planner->plan([2000, 1000], null, [], $now));
    }
}
