<?php

namespace App\Modules\Analytics\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Foundation\Models\Organization;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class MetaCostAnalyticsController extends Controller
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

        // Fetch campaigns from database
        $campaigns = DB::table('broadcast_campaigns')
            ->where('organization_id', $orgId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Meta Rates for India (INR ₹)
        $rateMarketing = 0.85;
        $rateUtility = 0.12;
        $rateAuth = 0.12;

        $totalSent = 0;
        $totalDelivered = 0;
        $totalRead = 0;
        $totalMarketingCost = 0.00;
        $totalUtilityCost = 0.00;

        $campaignData = [];

        foreach ($campaigns as $camp) {
            $totalContacts = $camp->recipients_count ?? 0;
            $sent = $totalContacts;
            $delivered = $camp->success_count ?? 0;

            // Query actual read count from messages table for this campaign
            $read = DB::table('messages')
                ->where('organization_id', $orgId)
                ->where('content', 'LIKE', "[Broadcast Campaign: {$camp->name}]%")
                ->where('status', 'read')
                ->count();

            $tpl = strtolower(($camp->template_name ?? '') . ' ' . ($camp->name ?? ''));
            $category = (str_contains($tpl, 'invoice') || str_contains($tpl, 'due') || str_contains($tpl, 'payment') || str_contains($tpl, 'alert') || str_contains($tpl, 'order'))
                ? 'UTILITY'
                : 'MARKETING';

            $costPerMsg = $category === 'UTILITY' ? $rateUtility : $rateMarketing;
            $campCost = round($sent * $costPerMsg, 2);

            if ($category === 'UTILITY') {
                $totalUtilityCost += $campCost;
            } else {
                $totalMarketingCost += $campCost;
            }

            $totalSent += $sent;
            $totalDelivered += $delivered;
            $totalRead += $read;

            $campaignData[] = [
                'id' => $camp->id,
                'name' => $camp->name,
                'category' => $category,
                'total_contacts' => $totalContacts,
                'sent_count' => $sent,
                'delivered_count' => $delivered,
                'read_count' => $read,
                'delivery_rate' => $sent > 0 ? round(($delivered / $sent) * 100, 1) : 0,
                'read_rate' => $delivered > 0 ? round(($read / $delivered) * 100, 1) : 0,
                'cost_inr' => $campCost,
                'status' => $camp->status ?? 'completed',
                'created_at' => $camp->created_at,
            ];
        }

        $totalMetaCost = $totalMarketingCost + $totalUtilityCost;

        // Calculate 7-day Real Spend Trend from real database records (Asia/Kolkata timezone)
        $dailyTrends = [];
        $tz = 'Asia/Kolkata';
        for ($i = 6; $i >= 0; $i--) {
            $dayCarbon = now($tz)->subDays($i);
            $dayYmd = $dayCarbon->format('Y-m-d');
            $dayLabel = $dayCarbon->format('D'); // e.g. Thu, Fri
            $dateLabel = $dayCarbon->format('j M'); // e.g. 29 Oct

            $dayMarketingCost = 0.00;
            $dayUtilityCost = 0.00;
            $daySent = 0;

            foreach ($campaigns as $camp) {
                if (empty($camp->created_at)) continue;
                $campDate = \Carbon\Carbon::parse($camp->created_at)->timezone($tz)->format('Y-m-d');
                if ($campDate === $dayYmd) {
                    $cSent = $camp->recipients_count ?? 0;
                    $cTpl = strtolower(($camp->template_name ?? '') . ' ' . ($camp->name ?? ''));
                    $cCat = (str_contains($cTpl, 'invoice') || str_contains($cTpl, 'due') || str_contains($cTpl, 'payment') || str_contains($cTpl, 'alert') || str_contains($cTpl, 'order'))
                        ? 'UTILITY'
                        : 'MARKETING';

                    $cCost = round($cSent * ($cCat === 'UTILITY' ? $rateUtility : $rateMarketing), 2);
                    if ($cCat === 'UTILITY') {
                        $dayUtilityCost += $cCost;
                    } else {
                        $dayMarketingCost += $cCost;
                    }
                    $daySent += $cSent;
                }
            }

            $dailyTrends[] = [
                'day' => $dayLabel,
                'date' => $dateLabel,
                'marketingCost' => round($dayMarketingCost, 2),
                'utilityCost' => round($dayUtilityCost, 2),
                'sent' => $daySent,
            ];
        }

        return Inertia::render('reports/index', [
            'metrics' => [
                'total_sent' => $totalSent,
                'total_delivered' => $totalDelivered,
                'total_read' => $totalRead,
                'overall_delivery_rate' => $totalSent > 0 ? round(($totalDelivered / $totalSent) * 100, 1) : 0.0,
                'overall_read_rate' => $totalDelivered > 0 ? round(($totalRead / $totalDelivered) * 100, 1) : 0.0,
                'total_cost_inr' => $totalMetaCost,
                'marketing_cost_inr' => $totalMarketingCost,
                'utility_cost_inr' => $totalUtilityCost,
                'currency' => 'INR',
                'active_tier' => 'Meta India Standard (Tier 1)',
            ],
            'rates' => [
                'marketing' => $rateMarketing,
                'utility' => $rateUtility,
                'auth' => $rateAuth,
                'service' => 0.00, // 1000 free per month
            ],
            'dailyTrends' => $dailyTrends,
            'campaigns' => $campaignData,
        ]);
    }
}
