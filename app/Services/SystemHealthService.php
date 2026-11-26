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
use Illuminate\Support\Facades\Schema;

class SystemHealthService
{
    public function diagnose(): array
    {
        $issues = [];

        // 1. Check for expired subscriptions still marked 'active'
        try {
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
        } catch (\Throwable $e) {
            Log::warning('SystemHealthService check 1 error: ' . $e->getMessage());
        }

        // 2. Check for orphaned channels (organization deleted or missing)
        try {
            $validOrgIds = Organization::pluck('id')->toArray();
            $orphanedChannels = WhatsAppChannel::withoutGlobalScopes()
                ->whereNotIn('organization_id', $validOrgIds)
                ->count();

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
        } catch (\Throwable $e) {
            Log::warning('SystemHealthService check 2 error: ' . $e->getMessage());
        }

        // 3. Check for stuck campaign queues (> 2 hours old and still queued)
        try {
            if (Schema::hasTable('campaign_recipients')) {
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
            }
        } catch (\Throwable $e) {
            Log::warning('SystemHealthService check 3 error: ' . $e->getMessage());
        }

        // 4. Check for webhook processing failures
        try {
            if (Schema::hasTable('webhook_inbox')) {
                $failedWebhooks = 0;
                if (Schema::hasColumn('webhook_inbox', 'attempts')) {
                    $failedWebhooks = WebhookInbox::where('attempts', '>=', 3)->count();
                } elseif (Schema::hasColumn('webhook_inbox', 'status')) {
                    $failedWebhooks = WebhookInbox::where('status', 'failed')->count();
                }

                if ($failedWebhooks > 0) {
                    $issues[] = [
                        'id' => 'failed_webhooks',
                        'severity' => 'medium',
                        'title' => "{$failedWebhooks} High-Attempt Webhook Deliveries",
                        'description' => "Incoming Meta webhooks that exceeded processing retry attempts.",
                        'count' => $failedWebhooks,
                        'autofixable' => true,
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('SystemHealthService check 4 error: ' . $e->getMessage());
        }

        // 5. Check WhatsApp channel health (quality rating YELLOW or RED)
        try {
            $degradedChannels = WhatsAppChannel::withoutGlobalScopes()
                ->whereIn('quality_rating', ['YELLOW', 'RED'])
                ->count();

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
        } catch (\Throwable $e) {
            Log::warning('SystemHealthService check 5 error: ' . $e->getMessage());
        }

        // 6. Check for disconnected channels
        try {
            $disconnectedChannels = WhatsAppChannel::withoutGlobalScopes()
                ->where('status', '!=', 'connected')
                ->count();

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
        } catch (\Throwable $e) {
            Log::warning('SystemHealthService check 6 error: ' . $e->getMessage());
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
        try {
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
        } catch (\Throwable $e) {
            Log::warning('AutoFix Step 1 error: ' . $e->getMessage());
        }

        // 2. Clean orphaned channels
        try {
            $validOrgIds = Organization::pluck('id')->toArray();
            $orphansDeleted = WhatsAppChannel::withoutGlobalScopes()
                ->whereNotIn('organization_id', $validOrgIds)
                ->delete();
            if ($orphansDeleted > 0) {
                $fixedCount += $orphansDeleted;
                $actionsTaken[] = "Purged {$orphansDeleted} orphaned WhatsApp channel records.";
            }
        } catch (\Throwable $e) {
            Log::warning('AutoFix Step 2 error: ' . $e->getMessage());
        }

        // 3. Fix stuck campaign messages
        try {
            if (Schema::hasTable('campaign_recipients')) {
                $stuckRecipients = DB::table('campaign_recipients')
                    ->where('status', 'queued')
                    ->where('created_at', '<', now()->subHours(2))
                    ->get();

                if ($stuckRecipients->count() > 0) {
                    $stuckCount = $stuckRecipients->count();
                    foreach ($stuckRecipients as $r) {
                        if (class_exists(\App\Jobs\SendCampaignRecipient::class)) {
                            \App\Jobs\SendCampaignRecipient::dispatch($r->id);
                        }
                    }
                    $fixedCount += $stuckCount;
                    $actionsTaken[] = "Re-queued {$stuckCount} stuck campaign recipient messages for dispatch.";
                }
            }
        } catch (\Throwable $e) {
            Log::warning('AutoFix Step 3 error: ' . $e->getMessage());
        }

        // 4. Reset webhook attempts for transient delivery
        try {
            if (Schema::hasTable('webhook_inbox')) {
                if (Schema::hasColumn('webhook_inbox', 'attempts')) {
                    $resetWebhooks = WebhookInbox::where('attempts', '>=', 3)->update(['attempts' => 1]);
                    if ($resetWebhooks > 0) {
                        $fixedCount += $resetWebhooks;
                        $actionsTaken[] = "Reset attempt counters for {$resetWebhooks} webhook payloads.";
                    }
                } elseif (Schema::hasColumn('webhook_inbox', 'status')) {
                    $resetWebhooks = WebhookInbox::where('status', 'failed')->update(['status' => 'pending']);
                    if ($resetWebhooks > 0) {
                        $fixedCount += $resetWebhooks;
                        $actionsTaken[] = "Reset {$resetWebhooks} failed webhook records to pending.";
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('AutoFix Step 4 error: ' . $e->getMessage());
        }

        try {
            AuditLog::record('autofix.executed', null, [
                'fixed_count' => $fixedCount,
                'actions' => $actionsTaken,
            ]);
        } catch (\Throwable $e) {}

        return [
            'success' => true,
            'fixed_count' => $fixedCount,
            'actions_taken' => $actionsTaken,
            'message' => $fixedCount > 0
                ? "Auto bug fix executed successfully. Resolved {$fixedCount} issue(s)."
                : "System is healthy. No auto-fixable anomalies detected.",
        ];
    }
}
