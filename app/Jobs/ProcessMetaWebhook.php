<?php

namespace App\Jobs;

use App\Modules\MetaConnection\Http\Controllers\MetaWebhookController;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ProcessMetaWebhook implements ShouldQueue
{
    use Queueable;
    public int $tries = 5;
    public int $timeout = 90;
    public function __construct(public int $recordId) {}
    public function backoff(): array { return [10, 30, 120, 300]; }
    public function handle(MetaWebhookController $controller): void { $controller->process($this->recordId); }
}
