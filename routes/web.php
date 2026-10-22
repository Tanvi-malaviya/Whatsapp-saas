<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Meta WhatsApp Cloud API Webhook Endpoints
Route::get('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'verify']);
Route::post('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'receive']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('whatsapp/connect', 'whatsapp/connect')->name('whatsapp.connect');
    Route::inertia('bot', 'bot/index')->name('bot.index');
    Route::inertia('inbox', 'inbox/index')->name('inbox.index');
    Route::inertia('contacts', 'contacts/index')->name('contacts.index');
    Route::inertia('campaigns', 'campaigns/index')->name('campaigns.index');
    Route::inertia('reports', 'reports/index')->name('reports.index');

    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
});

require __DIR__.'/settings.php';
