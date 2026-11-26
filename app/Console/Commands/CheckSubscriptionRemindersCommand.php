<?php

namespace App\Console\Commands;

use App\Services\SubscriptionReminderService;
use Illuminate\Console\Command;

class CheckSubscriptionRemindersCommand extends Command
{
    protected $signature = 'subscriptions:check-reminders';
    protected $description = 'Check subscription expiry intervals (30, 15, 7, 3, 1 days) and low wallet balances';

    public function handle(SubscriptionReminderService $service): int
    {
        $this->info('Checking expiring subscriptions and expiry transitions...');
        $expiring = $service->checkExpiringSubscriptions();
        $this->info(count($expiring) . ' subscription notifications processed.');

        $this->info('Checking low wallet balances (< ₹100)...');
        $lowBalances = $service->checkLowWalletBalances();
        $this->info(count($lowBalances) . ' low balance alerts recorded.');

        return Command::SUCCESS;
    }
}
