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
    Route::get('developers', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id
            ?? '';
        $channels = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)->get(['id', 'name', 'phone_number', 'phone_number_id', 'is_default']);
        return \Inertia\Inertia::render('developers/index', [
            'channels' => $channels,
        ]);
    })->name('developers.index');
    Route::post('developers/send-test', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'sendTestMessage'])->name('developers.send-test');

    // Bot Flows, Auto Responder & AI Agent
    Route::redirect('bot', 'flows')->name('bot.index');
    Route::inertia('flows', 'bot/flows')->name('flows.index');
    Route::inertia('auto-responder', 'bot/auto-responder')->name('auto-responder.index');
    Route::inertia('ai-agent', 'bot/ai-agent')->name('ai-agent.index');

    // Chat: Inbox, History, Stages
    Route::get('inbox', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'index'])->name('inbox.index');
    Route::get('inbox/sync', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'sync'])->name('inbox.sync');
    Route::post('inbox/reply', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'reply'])->name('inbox.reply');
    Route::post('inbox/update-contact', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'updateContact'])->name('inbox.update-contact');
    Route::post('inbox/new-chat', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'startConversation'])->name('inbox.new-chat');
    Route::post('inbox/simulate-inbound', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'simulateInbound'])->name('inbox.simulate');
    Route::get('chat/history', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'history'])->name('chat.history');
    Route::get('chat/stages', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'stages'])->name('chat.stages');
    Route::post('chat/stages/update-stage', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'updateStage'])->name('chat.stages.update');

    // CRM & Segments
    Route::inertia('contacts', 'contacts/index')->name('contacts.index');
    Route::inertia('segments', 'contacts/segments')->name('segments.index');

    // Broadcasts & Templates
    Route::inertia('campaigns', 'campaigns/index')->name('campaigns.index');
    Route::inertia('templates', 'campaigns/templates')->name('templates.index');

    Route::inertia('reports', 'reports/index')->name('reports.index');

    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
    Route::post('/workspace/store', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'store'])->name('workspace.store');
});

require __DIR__.'/settings.php';
