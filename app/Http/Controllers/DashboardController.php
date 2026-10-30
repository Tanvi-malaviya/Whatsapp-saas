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
            ?? $request->user()?->organizations()->first()?->id
            ?? Organization::first()?->id;

        return $orgId ? (Organization::find($orgId) ?? Organization::first()) : null;
    }

    public function index(Request $request): Response
    {
        $org = $this->resolveOrg($request);
        $orgId = $org?->id;

        // 1. Channel
        $channel = WhatsAppChannel::where('status', 'connected')
            ->when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->first() ?? WhatsAppChannel::first();

        // 2. Metrics
        $totalMessages = Message::when($orgId, function ($q) use ($orgId) {
            $q->whereHas('conversation', fn ($cq) => $cq->where('organization_id', $orgId));
        })->count();

        $inboundMessages = Message::where('direction', 'inbound')
            ->when($orgId, function ($q) use ($orgId) {
                $q->whereHas('conversation', fn ($cq) => $cq->where('organization_id', $orgId));
            })->count();

        $outboundMessages = Message::where('direction', 'outbound')
            ->when($orgId, function ($q) use ($orgId) {
                $q->whereHas('conversation', fn ($cq) => $cq->where('organization_id', $orgId));
            })->count();

        $activeWindowConvs = Conversation::when($orgId, fn ($q) => $q->where('organization_id', $orgId))
            ->whereNotNull('window_expires_at')
            ->where('window_expires_at', '>', now())
            ->count();

        $totalConvs = Conversation::when($orgId, fn ($q) => $q->where('organization_id', $orgId))->count();

        // 3. Real Recent Conversations
        $conversations = Conversation::when($orgId, fn ($q) => $q->where('organization_id', $orgId))
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

        // 4. Real Templates from Meta
        $metaTemplates = [];
        if ($channel) {
            try {
                $camp = new CampaignController();
                $allTpls = $camp->getMetaTemplates($channel);
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
                    'trigger' => $f->trigger_keyword ?: 'First Message',
                    'status' => $f->status ?? 'active',
                    'description' => $f->description ?: 'Automated conversational bot flow.',
                ];
            });

        return Inertia::render('dashboard', [
            'channel' => $channel ? [
                'name' => $channel->name,
                'phone' => $channel->phone_number,
                'phone_id' => $channel->phone_number_id,
                'waba_id' => $channel->waba_id,
                'status' => $channel->status,
                'quality' => $channel->quality_rating ?: 'GREEN',
                'tier' => $channel->tier ?: 'TIER_1K',
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
