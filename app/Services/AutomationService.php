<?php

namespace App\Services;

use App\Modules\Bot\Models\BotFlow;
use App\Modules\Bot\Models\BotRule;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;

class AutomationService
{
    public function reply(Organization $org, Conversation $conversation, string $text, bool $first = false): ?string
    {
        $config = $org->metadata['auto_responder'] ?? [];
        $state = $conversation->bot_state ?? [];
        if (($state['handoff'] ?? false) || $conversation->assigned_user_id) { return null; }
        $flow = ! empty($state['flow_id']) ? BotFlow::where('status', 'active')->find($state['flow_id']) : null;
        if ($flow && isset($state['followup'])) {
            $option = collect($flow->options)->firstWhere('id', $state['followup']);
            $conversation->update(['bot_state' => ['flow_id' => $flow->id, 'last_answer' => mb_substr($text, 0, 2000)]]);
            return $option['followup_reply'] ?? 'Thank you. Your response has been recorded.';
        }
        if ($flow) {
            $option = collect($flow->options)->firstWhere('id', trim($text));
            if ($option) {
                $flow->increment('execution_count');
                $new = ['flow_id' => $flow->id];
                if (($option['action_type'] ?? '') === 'human_handoff') {
                    $new['handoff'] = true; $conversation->status = 'pending';
                }
                if (($option['action_type'] ?? '') === 'followup') { $new['followup'] = $option['id']; }
                $conversation->bot_state = $new; $conversation->save();
                $reply = $option['reply_text'] ?? '';
                if (isset($new['followup'])) { $reply .= "\n".($option['followup_question'] ?? ''); }
                return $reply;
            }
        }
        foreach (BotRule::where('organization_id', $org->id)->where('is_enabled', true)->orderBy('priority')->get() as $rule) {
            if ($rule->matches($text)) { return $this->variables($rule->reply_text, $conversation); }
        }
        foreach (BotFlow::where('organization_id', $org->id)->where('status', 'active')->get() as $candidate) {
            foreach (explode(',', $candidate->trigger_keywords) as $keyword) {
                if (trim($keyword) !== '' && mb_stripos($text, trim($keyword)) !== false) {
                    $conversation->update(['bot_state' => ['flow_id' => $candidate->id]]);
                    $candidate->increment('execution_count'); return $candidate->greeting_message;
                }
            }
        }
        $local = now($org->timezone ?: 'UTC');
        $outside = ! in_array((int) $local->format('N'), $config['business_days'] ?? [1,2,3,4,5], true)
            || $local->format('H:i') < ($config['opens_at'] ?? '09:00') || $local->format('H:i') >= ($config['closes_at'] ?? '17:00');
        if (($config['away_enabled'] ?? false) && $outside) { return $this->variables($config['away_message'] ?? '', $conversation); }
        if ($first && ($config['welcome_enabled'] ?? false)) { return $this->variables($config['welcome_message'] ?? '', $conversation); }
        if ($org->metadata['ai_agent']['enabled'] ?? false) {
            $history = $conversation->messages()->reorder()->latest()->take(8)->get()->reverse()->map(fn ($m) => ['sender' => $m->direction === 'inbound' ? 'user' : 'ai', 'text' => $m->content])->values()->all();
            return app(AiAgentService::class)->answer($org, $text, $history);
        }
        return null;
    }
    private function variables(string $text, Conversation $conversation): string
    {
        return strtr($text, ['{{name}}' => $conversation->contact_name ?: 'Customer', '{{phone}}' => $conversation->contact_phone]);
    }
}
