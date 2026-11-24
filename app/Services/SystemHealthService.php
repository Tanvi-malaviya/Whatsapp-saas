<?php

namespace App\Services;

use App\Models\BillingInvoice;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Message;
use App\Modules\Messaging\Models\WebhookInbox;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SystemHealthService
{
    public function diagnose(): array
    {
        $issues = [];

        // 1. Check for expired subscriptions still marked 'active'
        $expiredActiveCount = Organization::where('status', 'active')
            ->whereNotNull('subscription_expires_at')
            ->where('subscription_expires_at', '<', now())
            ->count();

        if ($expiredActiveCount > 0) {
            $issues[] = [
                'id' => 'expired_subscriptions',
                'severity' => 'medium',
                'title' => "{$expiredActiveCount} Expired Subscriptions Still Active",
                'description' => "Workspaces with past expiration dates need status transition to 'expired'.",
                'count' => $expiredActiveCount,
                'autofixable' => true,
            ];
        }

        // 2. Check for orphaned channels (organization deleted or missing)
        $validOrgIds = Organization::pluck('id')->toArray();
        $orphanedChannels = WhatsAppChannel::whereNotIn('organization_id', $validOrgIds)->count();

        if ($orphanedChannels > 0) {
            $issues[] = [
                'id' => 'orphaned_channels',
                'severity' => 'high',
                'title' => "{$orphanedChannels} Orphaned WhatsApp Channel(s)",
                'description' => "Channels found without a valid parent workspace.",
                'count' => $orphanedChannels,
                'autofixable' => true,
            ];
        }

        // 3. Check for stuck campaign queues (> 2 hours old and still queued)
        $stuckQueuedCount = DB::table('campaign_recipients')
            ->where('status', 'queued')
            ->where('created_at', '<', now()->subHours(2))
            ->count();

        if ($stuckQueuedCount > 0) {
            $issues[] = [
                'id' => 'stuck_campaign_queue',
                'severity' => 'high',
                'title' => "{$stuckQueuedCount} Stuck Queued Campaign Messages",
                'description' => "Messages in queue for more than 2 hours requiring queue restart or reconciliation.",
                'count' => $stuckQueuedCount,
                'autofixable' => true,
            ];
        }

        // 4. Check for webhook processing failures
        $failedWebhooks = WebhookInbox::where('attempts', '>=', 3)->count();

        if ($failedWebhooks > 0) {
            $issues[] = [
                'id' => 'failed_webhooks',
                'severity' => 'medium',
                'title' => "{$failedWebhooks} High-Attempt Webhook Deliveries",
                'description' => "Incoming Meta webhooks that exceeded 3 processing retry attempts.",
                'count' => $failedWebhooks,
                'autofixable' => true,
            ];
        }

        // 5. Check WhatsApp channel health (quality rating YELLOW or RED)
        $degradedChannels = WhatsAppChannel::whereIn('quality_rating', ['YELLOW', 'RED'])->count();

        if ($degradedChannels > 0) {
            $issues[] = [
                'id' => 'degraded_channels',
                'severity' => 'high',
                'title' => "{$degradedChannels} Channel(s) With Degraded Meta Quality Rating",
                'description' => "WhatsApp numbers with YELLOW/RED rating due to customer blocks or spam reports.",
                'count' => $degradedChannels,
                'autofixable' => false,
            ];
        }

        // 6. Check for disconnected channels
        $disconnectedChannels = WhatsAppChannel::where('status', '!=', 'connected')->count();

        if ($disconnectedChannels > 0) {
            $issues[] = [
                'id' => 'disconnected_channels',
                'severity' => 'low',
                'title' => "{$disconnectedChannels} Disconnected WhatsApp Channel(s)",
                'description' => "Numbers currently requiring reconnection or authentication renewal.",
                'count' => $disconnectedChannels,
                'autofixable' => false,
            ];
        }

        $totalIssues = count($issues);
        $healthScore = max(0, 100 - ($totalIssues * 15));

        return [
            'health_score' => $healthScore,
            'status' => $totalIssues === 0 ? 'healthy' : ($healthScore >= 70 ? 'warning' : 'critical'),
            'total_issues' => $totalIssues,
            'issues' => $issues,
            'scanned_at' => now()->format('d M Y, h:i A'),
        ];
    }

    public function autoFix(): array
    {
        $actionsTaken = [];
        $fixedCount = 0;

        // 1. Fix expired subscriptions
        $expiredOrgs = Organization::where('status', 'active')
            ->whereNotNull('subscription_expires_at')
            ->where('subscription_expires_at', '<', now())
            ->get();

        foreach ($expiredOrgs as $org) {
            $org->update(['status' => 'expired']);
            AuditLog::record('autofix.subscription_expired', null, ['organization_id' => $org->id]);
            $fixedCount++;
        }

        if ($expiredOrgs->count() > 0) {
            $actionsTaken[] = "Synchronized {$expiredOrgs->count()} expired subscriptions to 'expired' status.";
        }

        // 2. Clean orphaned channels
        $validOrgIds = Organization::pluck('id')->toArray();
        $orphansDeleted = WhatsAppChannel::whereNotIn('organization_id', $validOrgIds)->delete();
        if ($orphansDeleted > 0) {
            $fixedCount += $orphansDeleted;
            $actionsTaken[] = "Purged {$orphansDeleted} orphaned WhatsApp channel records.";
        }

        // 3. Fix stuck campaign messages
        $stuckRecipients = DB::table('campaign_recipients')
            ->where('status', 'queued')
            ->where('created_at', '<', now()->subHours(2))
            ->get();

        if ($stuckRecipients->count() > 0) {
            $stuckCount = $stuckRecipients->count();
            // Re-dispatch stuck recipients
            foreach ($stuckRecipients as $r) {
                \App\Jobs\SendCampaignRecipient::dispatch($r->id);
            }
            $fixedCount += $stuckCount;
            $actionsTaken[] = "Re-queued {$stuckCount} stuck campaign recipient messages for dispatch.";
        }

        // 4. Reset webhook attempts for transient delivery
        $resetWebhooks = WebhookInbox::where('attempts', '>=', 3)->update(['attempts' => 1]);
        if ($resetWebhooks > 0) {
            $fixedCount += $resetWebhooks;
            $actionsTaken[] = "Reset attempt counters for {$resetWebhooks} webhook payloads.";
        }

        AuditLog::record('autofix.executed', null, [
            'fixed_count' => $fixedCount,
            'actions' => $actionsTaken,
        ]);

        return [
            'success' => true,
            'fixed_count' => $fixedCount,
            'actions_taken' => $actionsTaken,
            'message' => $fixedCount > 0
                ? "Auto bug fix executed successfully. Resolved {$fixedCount} issue(s)."
                : "System is already healthy. No auto-fixable anomalies detected.",
        ];
    }
}
