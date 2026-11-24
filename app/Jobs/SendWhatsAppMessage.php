<?php

namespace App\Jobs;

use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Message;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\MetaApi;
use App\Shared\TenantContext;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendWhatsAppMessage implements ShouldQueue
{
    use Queueable;
    public int $tries = 3;
    public function __construct(public string $messageId, public array $payload) {}
    public function backoff(): array { return [15, 60]; }
    public function handle(MetaApi $api): void
    {
        $message = Message::withoutGlobalScopes()->findOrFail($this->messageId);
        if ($message->wamid) { return; }
        $org = Organization::find($message->organization_id);
        if (! $org?->isActive()) { $message->update(['status' => 'failed']); return; }
        TenantContext::set($org);
        try {
            $conversation = $message->conversation;
            $channel = WhatsAppChannel::where('phone_number_id', $conversation->channel_phone_number_id)->firstOrFail();
            if (($this->payload['type'] ?? '') !== 'template' && ! $conversation->isWindowOpen()) { $message->update(['status' => 'failed']); return; }
            $id = $api->send($channel, $this->payload);
            $message->update(['wamid' => $id, 'status' => 'sent']);
        } finally { TenantContext::clear(); }
    }
    public function failed(?\Throwable $exception): void { Message::withoutGlobalScopes()->whereKey($this->messageId)->update(['status' => 'failed']); }
}
