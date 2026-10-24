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
    Route::get('contacts', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        \App\Shared\TenantContext::set($org);

        $contacts = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => (string) $c->id,
                    'name' => $c->contact_name ?: ($c->contact_phone ?: 'Unknown Contact'),
                    'phone' => $c->contact_phone,
                    'email' => '—',
                    'city' => '—',
                    'stage' => $c->pipeline_stage ?: 'New',
                    'consent' => 'opted_in',
                ];
            })
            ->values()
            ->all();

        return \Inertia\Inertia::render('contacts/index', [
            'initialContacts' => $contacts,
        ]);
    })->name('contacts.index');

    Route::post('contacts', function (\Illuminate\Http\Request $request) {
        $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

        $phone = preg_replace('/[^\d+]/', '', $request->phone);
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . ltrim($phone, '0');
        }

        \App\Modules\Messaging\Models\Conversation::updateOrCreate(
            [
                'organization_id' => $org->id,
                'contact_phone' => $phone,
            ],
            [
                'contact_name' => $request->name,
                'pipeline_stage' => $request->stage ?? 'New',
                'status' => 'active',
                'last_message_at' => now(),
            ]
        );

        return back()->with('success', 'Contact created successfully.');
    })->name('contacts.store');

    Route::post('contacts/bulk', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

        $list = $request->input('contacts', []);
        foreach ($list as $item) {
            $name = trim($item['name'] ?? '');
            $phone = trim($item['phone'] ?? '');
            if (empty($phone)) continue;

            $cleanPhone = preg_replace('/[^\d+]/', '', $phone);
            if (!str_starts_with($cleanPhone, '+')) {
                $cleanPhone = '+' . ltrim($cleanPhone, '0');
            }

            \App\Modules\Messaging\Models\Conversation::updateOrCreate(
                [
                    'organization_id' => $org->id,
                    'contact_phone' => $cleanPhone,
                ],
                [
                    'contact_name' => $name ?: $cleanPhone,
                    'pipeline_stage' => 'New',
                    'status' => 'active',
                    'last_message_at' => now(),
                ]
            );
        }

        return back()->with('success', count($list) . ' contacts imported.');
    })->name('contacts.bulk');

    Route::put('contacts/{id}', function (\Illuminate\Http\Request $request, string $id) {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
            'stage' => 'nullable|string|in:New,Contacted,Interested,Won',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $conv = \App\Modules\Messaging\Models\Conversation::where('organization_id', $orgId)
            ->where('id', $id)
            ->first();

        if ($conv) {
            $cleanPhone = preg_replace('/[^\d+]/', '', $validated['phone']);
            if (!str_starts_with($cleanPhone, '+')) {
                $cleanPhone = '+' . ltrim($cleanPhone, '0');
            }

            $conv->update([
                'contact_name' => $validated['name'],
                'contact_phone' => $cleanPhone,
                'pipeline_stage' => $validated['stage'] ?? $conv->pipeline_stage,
            ]);
        }

        return back()->with('success', 'Contact updated successfully.');
    })->name('contacts.update');

    Route::delete('contacts/{id}', function (\Illuminate\Http\Request $request, string $id) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        \App\Modules\Messaging\Models\Conversation::where('organization_id', $orgId)
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'Contact deleted successfully.');
    })->name('contacts.destroy');

    Route::inertia('segments', 'contacts/segments')->name('segments.index');

    // Broadcasts & Templates
    Route::get('campaigns', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'index'])->name('campaigns.index');
    Route::post('campaigns/broadcast', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'broadcast'])->name('campaigns.broadcast');
    Route::inertia('templates', 'campaigns/templates')->name('templates.index');

    Route::inertia('reports', 'reports/index')->name('reports.index');

    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
    Route::post('/workspace/store', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'store'])->name('workspace.store');
});

require __DIR__.'/settings.php';
