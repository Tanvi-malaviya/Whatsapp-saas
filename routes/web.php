<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Meta WhatsApp Cloud API Webhook Endpoints
Route::get('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'verify']);
Route::post('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'receive']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    
    // WhatsApp Channels & Number Connection (Like Xobito Channels)
    Route::get('whatsapp/connect', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'index'])->name('whatsapp.connect');
    Route::get('channels', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'index'])->name('channels.index');
    Route::post('channels', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'store'])->name('channels.store');
    Route::delete('channels/{id}', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'destroy'])->name('channels.destroy');
    Route::post('channels/{id}/test', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'testConnection'])->name('channels.test');

    // Developers Hub
    Route::inertia('developers', 'developers/index')->name('developers.index');

    // Bot Flows, Auto Responder & AI Agent
    Route::redirect('bot', 'flows')->name('bot.index');
    Route::inertia('flows', 'bot/flows')->name('flows.index');
    Route::inertia('auto-responder', 'bot/auto-responder')->name('auto-responder.index');
    Route::inertia('ai-agent', 'bot/ai-agent')->name('ai-agent.index');

    // Chat: Inbox, History, Stages
    Route::inertia('inbox', 'inbox/index')->name('inbox.index');
    Route::inertia('chat/history', 'inbox/history')->name('chat.history');
    Route::inertia('chat/stages', 'inbox/stages')->name('chat.stages');

    // CRM & Segments
    Route::inertia('contacts', 'contacts/index')->name('contacts.index');
    Route::inertia('segments', 'contacts/segments')->name('segments.index');

    // Broadcasts & Templates
    Route::inertia('campaigns', 'campaigns/index')->name('campaigns.index');
    Route::inertia('templates', 'campaigns/templates')->name('templates.index');

    Route::inertia('reports', 'reports/index')->name('reports.index');

    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
});

require __DIR__.'/settings.php';
