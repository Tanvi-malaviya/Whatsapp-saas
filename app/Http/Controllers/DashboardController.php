<?php

namespace App\Http\Controllers;

use App\Modules\Bot\Models\BotFlow;
use App\Modules\Campaigns\Http\Controllers\CampaignController;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Shared\TenantContext;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private function resolveOrg(Request $request): ?Organization
    {
        $orgId = TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        return $orgId ? (Organization::find($orgId)) : null;
    }

    public function index(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        $orgId = $org?->id;

        // 1. All Connected Channels for this workspace
        $channels = WhatsAppChannel::when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->where('status', 'connected')
            ->get();

        $selectedChannelId = $request->query('channel_id');
        $filterBySpecificChannel = $selectedChannelId && $selectedChannelId !== 'all';

        $activeChannel = null;
        if ($filterBySpecificChannel) {
            $activeChannel = $channels->firstWhere('id', $selectedChannelId);
        }
        if (! $activeChannel && $channels->isNotEmpty()) {
            $activeChannel = $channels->firstWhere('is_default', true) ?? $channels->first();
        }

        // 2. Metrics (Filtered or Workspace-Wide Aggregate across all numbers)
        $msgQuery = Message::query();
        if ($filterBySpecificChannel) {
            $msgQuery->where('channel_id', $selectedChannelId);
        } elseif ($orgId) {
            $msgQuery->whereHas('conversation', fn ($cq) => $cq->where('organization_id', $orgId));
        }

        $totalMessages = (clone $msgQuery)->count();
        $inboundMessages = (clone $msgQuery)->where('direction', 'inbound')->count();
        $outboundMessages = (clone $msgQuery)->where('direction', 'outbound')->count();

        $convQuery = Conversation::when($orgId, fn ($q) => $q->where('organization_id', $orgId));
        if ($filterBySpecificChannel) {
            $convQuery->where('channel_id', $selectedChannelId);
        }

        $activeWindowConvs = (clone $convQuery)
            ->whereNotNull('window_expires_at')
            ->where('window_expires_at', '>', now())
            ->count();

        $totalConvs = (clone $convQuery)->count();

        // 3. Recent Conversations
        $conversations = (clone $convQuery)
            ->with(['messages' => fn ($q) => $q->latest()->take(1)])
            ->orderByDesc('last_message_at')
            ->take(10)
            ->get()
            ->map(function ($c) {
                $lastMsg = $c->messages->first();
                $diff = $c->last_message_at ? $c->last_message_at->timezone('Asia/Kolkata')->diffForHumans() : 'Recently';
                $windowMinutes = $c->window_expires_at ? max(0, (int) now()->diffInMinutes($c->window_expires_at, false)) : 0;

                return [
                    'id' => (string) $c->id,
                    'name' => $c->contact_name ?: $c->contact_phone,
                    'phone' => $c->contact_phone,
                    'lastMessage' => $lastMsg ? $lastMsg->content : 'No messages yet',
                    'time' => $diff,
                    'unread' => (int) ($c->unread_count ?? 0),
                    'status' => $c->status ?? 'open',
                    'intent' => $c->pipeline_stage ?: 'General Inquiry',
                    'windowRemaining' => $windowMinutes > 0 ? floor($windowMinutes / 60) . 'h ' . ($windowMinutes % 60) . 'm' : 'Closed',
                ];
            });

        // 4. Real Templates from Meta (using active or default channel)
        $metaTemplates = [];
        $channelForTemplates = $activeChannel ?? $channels->first();
        if ($channelForTemplates) {
            try {
                $camp = new CampaignController();
                $allTpls = $camp->getMetaTemplates($channelForTemplates);
                $metaTemplates = array_slice($allTpls, 0, 10);
            } catch (\Throwable $e) {
                $metaTemplates = [];
            }
        }

        // 5. Bot Workflows
        $botFlows = BotFlow::when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->take(6)
            ->get()
            ->map(function ($f) {
                return [
                    'id' => (string) $f->id,
                    'name' => $f->name,
                    'trigger' => $f->trigger_keywords ?: 'First Message',
                    'status' => $f->status ?? 'active',
                    'description' => $f->description ?: 'Automated conversational bot flow.',
                ];
            });

        return Inertia::render('dashboard', [
            'channels' => $channels->map(fn ($ch) => [
                'id' => (string) $ch->id,
                'name' => $ch->name,
                'phone' => $ch->phone_number,
                'phone_id' => $ch->phone_number_id,
                'quality' => $ch->quality_rating ?: 'GREEN',
                'is_default' => (bool) $ch->is_default,
                'status' => $ch->status,
            ]),
            'selected_channel_id' => $selectedChannelId ?: 'all',
            'channel' => $activeChannel ? [
                'id' => (string) $activeChannel->id,
                'name' => $activeChannel->name,
                'phone' => $activeChannel->phone_number,
                'phone_id' => $activeChannel->phone_number_id,
                'waba_id' => $activeChannel->waba_id,
                'status' => $activeChannel->status,
                'quality' => $activeChannel->quality_rating ?: 'GREEN',
                'tier' => $activeChannel->messaging_limit ?: 'UNKNOWN',
            ] : null,
            'metrics' => [
                'total_messages' => $totalMessages,
                'inbound_messages' => $inboundMessages,
                'outbound_messages' => $outboundMessages,
                'active_24h' => $activeWindowConvs,
                'total_conversations' => $totalConvs,
                'templates_count' => count($metaTemplates),
                'bot_flows_count' => $botFlows->count(),
            ],
            'recentConversations' => $conversations,
            'metaTemplates' => $metaTemplates,
            'botFlows' => $botFlows,
        ]);
    }
}
