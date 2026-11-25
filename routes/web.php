<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check() ? redirect(\App\Services\PanelNavigation::home(auth()->user())) : redirect()->route('login');
})->name('home');
Route::inertia('/privacy', 'privacy')->name('privacy');
Route::inertia('/terms', 'terms')->name('terms');

// Meta WhatsApp Cloud API Webhook Endpoints
Route::get('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'verify']);
Route::post('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'receive']);

Route::post('/webhooks/razorpay', [\App\Modules\Billing\Http\Controllers\BillingController::class, 'webhook']);

// Public Meta Commerce Scheduled Data Feed URL (for automatic background catalog sync)
Route::get('/commerce/catalog-feed.csv', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'publicCatalogFeed'])->name('commerce.catalog.feed');

Route::get('/invitations/{token}', [\App\Modules\Foundation\Http\Controllers\TeamController::class, 'accept'])->middleware('auth');

// Super Admin: Dedicated Separate Authentication Routes (Public access for Admin Login)
Route::get('admin/login', [\App\Http\Controllers\AdminController::class, 'showLogin'])->name('admin.login');
Route::post('admin/login', [\Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::class, 'store'])->middleware('throttle:login')->name('admin.login.submit');
Route::post('admin/logout', [\App\Http\Controllers\AdminController::class, 'logout'])->name('admin.logout');

// B2B Partner Login & Portal Authentication Routes
Route::get('agent/login', [\App\Http\Controllers\AgentController::class, 'showLogin'])->name('agent.login');
Route::post('agent/login', [\Laravel\Fortify\Http\Controllers\AuthenticatedSessionController::class, 'store'])->middleware('throttle:login')->name('agent.login.submit');
Route::post('agent/logout', [\App\Http\Controllers\AdminController::class, 'logout'])->name('agent.logout');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    
    // WhatsApp Channels & Number Connection (Like Xobito Channels)
    Route::get('whatsapp/connect', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'index'])->name('whatsapp.connect');
    Route::get('whatsapp/connect/setup', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'wizard'])->name('whatsapp.connect.wizard');
    Route::get('channels/connect', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'wizard'])->name('channels.connect');
    Route::get('channels', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'index'])->name('channels.index');
    Route::post('channels', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'store'])->name('channels.store');
    Route::get('channels/signup/review', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'reviewSignup']);
    Route::post('channels/signup/complete', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'completeSignup']);
    Route::post('channels/signup', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'beginSignup']);
    Route::post('channels/quick-connect', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'quickConnect'])->name('channels.quick-connect');
    Route::post('channels/sync-meta', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'syncFromMeta'])->name('channels.sync-meta');
    Route::delete('channels/{id}', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'destroy'])->name('channels.destroy');
    Route::post('channels/{id}/set-default', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'setDefault'])->name('channels.set-default');
    Route::post('channels/{id}/sync', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'syncChannel'])->name('channels.sync');
    Route::post('channels/{id}/test', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'testConnection'])->name('channels.test');
    Route::get('channels/{id}/templates', function (string $id) { $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::findOrFail($id); return response()->json(['templates' => array_values(array_filter(app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class)->getMetaTemplates($channel), fn ($t) => $t['status'] === 'APPROVED'))]); });
    Route::get('channels/{id}', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'show'])->name('channels.show');
    Route::get('whatsapp/channels/{id}', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'show'])->name('whatsapp.channels.show');

    // Developers redirect to System Logs
    Route::redirect('developers', '/insights/system-logs')->name('developers.index');

    // Super Admin: Dedicated Standalone Portal (Strict Auth & SuperAdmin Protection)
    Route::prefix('admin')
        ->middleware([\App\Http\Middleware\EnsureSuperAdmin::class])
        ->name('admin.')
        ->group(function () {
            Route::get('/', [\App\Http\Controllers\AdminController::class, 'dashboard'])->name('dashboard');
            Route::get('dashboard', [\App\Http\Controllers\AdminController::class, 'dashboard'])->name('dashboard.index');
            Route::get('organizations', [\App\Http\Controllers\AdminController::class, 'organizations'])->name('organizations');
            Route::post('organizations/{id}/limit', [\App\Http\Controllers\AdminController::class, 'updateLimit'])->name('organizations.limit');
            Route::match(['get', 'post'], 'organizations/{id}/switch', [\App\Http\Controllers\AdminController::class, 'switchWorkspace'])->name('organizations.switch');
            Route::delete('organizations/{id}', [\App\Http\Controllers\AdminController::class, 'destroyOrganization'])->name('organizations.destroy');
            Route::get('channels', [\App\Http\Controllers\AdminController::class, 'channels'])->name('channels');
            Route::get('users', [\App\Http\Controllers\AdminController::class, 'users'])->name('users');
            Route::post('users', [\App\Http\Controllers\AdminController::class, 'storeUser'])->name('users.store');
            Route::put('users/{id}', [\App\Http\Controllers\AdminController::class, 'updateUser'])->name('users.update');
            Route::delete('users/{id}', [\App\Http\Controllers\AdminController::class, 'destroyUser'])->name('users.destroy');
            Route::post('users/{id}/toggle-admin', [\App\Http\Controllers\AdminController::class, 'toggleSuperAdmin'])->name('users.toggle-admin');
            Route::post('users/{id}/toggle-agent', [\App\Http\Controllers\AdminController::class, 'toggleAgent'])->name('users.toggle-agent');
            Route::get('settings', [\App\Http\Controllers\AdminController::class, 'settings'])->name('settings');
            Route::post('settings', [\App\Http\Controllers\AdminController::class, 'updateSettings'])->name('settings.update');
            Route::post('diagnostics/autofix', [\App\Http\Controllers\AdminController::class, 'autoFixDiagnostics'])->name('diagnostics.autofix');
            Route::get('diagnostics', [\App\Http\Controllers\AdminController::class, 'diagnosticsReport'])->name('diagnostics.index');
        });

    // B2B Agent & Reseller Partner Portal
    Route::prefix('agent')
        ->middleware([\App\Http\Middleware\EnsureB2BAgent::class])
        ->name('agent.')
        ->group(function () {
            Route::get('/', [\App\Http\Controllers\AgentController::class, 'dashboard'])->name('dashboard');
            Route::get('dashboard', [\App\Http\Controllers\AgentController::class, 'dashboard'])->name('dashboard.index');
            Route::post('customers', [\App\Http\Controllers\AgentController::class, 'createCustomer'])->name('customers.store');
            Route::post('customers/{id}/assist', [\App\Http\Controllers\AgentController::class, 'assistCustomer'])->name('customers.assist');
            Route::post('exit-assist', [\App\Http\Controllers\AgentController::class, 'exitAssist'])->name('exit-assist');
            Route::get('customers/{id}/details', [\App\Http\Controllers\AgentController::class, 'customerDetails'])->name('customers.details');
        });

    // Bot Flows, Auto Responder & AI Agent
    Route::redirect('bot', 'flows')->name('bot.index');
    Route::get('flows', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);
        \App\Shared\TenantContext::set($org);

        $flows = \App\Modules\Bot\Models\BotFlow::where('organization_id', $org->id)
            ->latest()
            ->get();

        return \Inertia\Inertia::render('bot/flows', [
            'flows' => $flows,
        ]);
    })->name('flows.index');

    Route::post('flows', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'trigger_keywords' => 'required|string|max:500',
            'status' => 'required|string|in:active,draft',
            'greeting_message' => 'required|string|max:2000',
            'options' => 'required|array|min:1|max:10',
            'options.*.id' => 'required|string',
            'options.*.label' => 'required|string|max:100',
            'options.*.reply_text' => 'required|string|max:2000',
            'options.*.action_type' => 'nullable|string|in:reply,followup,link,human_handoff',
            'options.*.followup_question' => 'nullable|string|max:1000',
            'options.*.followup_reply' => 'nullable|string|max:2000',
        ]);

        \App\Modules\Bot\Models\BotFlow::create([
            'organization_id' => $orgId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'trigger_keywords' => $validated['trigger_keywords'],
            'status' => $validated['status'],
            'greeting_message' => $validated['greeting_message'],
            'options' => $validated['options'],
            'execution_count' => 0,
        ]);

        return back()->with('success', "Bot Flow '{$validated['name']}' created successfully.");
    })->name('flows.store');

    Route::put('flows/{flow}', function (\Illuminate\Http\Request $request, \App\Modules\Bot\Models\BotFlow $flow) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'trigger_keywords' => 'required|string|max:500',
            'status' => 'required|string|in:active,draft',
            'greeting_message' => 'required|string|max:2000',
            'options' => 'required|array|min:1|max:10',
            'options.*.id' => 'required|string',
            'options.*.label' => 'required|string|max:100',
            'options.*.reply_text' => 'required|string|max:2000',
            'options.*.action_type' => 'nullable|string|in:reply,followup,link,human_handoff',
            'options.*.followup_question' => 'nullable|string|max:1000',
            'options.*.followup_reply' => 'nullable|string|max:2000',
        ]);

        $flow->update($validated);

        return back()->with('success', "Bot Flow '{$flow->name}' updated successfully.");
    })->name('flows.update');

    Route::patch('flows/{flow}/toggle', function (\App\Modules\Bot\Models\BotFlow $flow) {
        $newStatus = $flow->status === 'active' ? 'draft' : 'active';
        $flow->update(['status' => $newStatus]);
        return back()->with('success', "Bot Flow status changed to {$newStatus}.");
    })->name('flows.toggle');

    Route::delete('flows/{flow}', function (\App\Modules\Bot\Models\BotFlow $flow) {
        $name = $flow->name;
        $flow->delete();
        return back()->with('success', "Bot Flow '{$name}' deleted successfully.");
    })->name('flows.destroy');
    Route::get('auto-responder', [\App\Modules\Bot\Http\Controllers\AutomationController::class, 'responder'])->name('auto-responder.index');
    Route::post('auto-responder', [\App\Modules\Bot\Http\Controllers\AutomationController::class, 'saveResponder']);
    Route::get('ai-agent', [\App\Modules\Bot\Http\Controllers\AutomationController::class, 'agent'])->name('ai-agent.index');
    Route::post('ai-agent', [\App\Modules\Bot\Http\Controllers\AutomationController::class, 'saveAgent']);
    Route::post('ai-agent/documents', [\App\Modules\Bot\Http\Controllers\AutomationController::class, 'upload']);
    Route::delete('ai-agent/documents/{id}', [\App\Modules\Bot\Http\Controllers\AutomationController::class, 'deleteDocument']);
    Route::post('ai-agent/test', [\App\Modules\Bot\Http\Controllers\AutomationController::class, 'test'])->middleware('throttle:10,1');

    // Chat: Inbox, History, Stages
    Route::get('inbox', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'index'])->name('inbox.index');
    Route::get('inbox/messages/{id}/attachment', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'attachment']);
    Route::post('inbox/conversations/{id}/read', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'markRead']);
    Route::post('inbox/conversations/{id}/assign', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'assign']);
    Route::get('inbox/sync', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'sync'])->name('inbox.sync');
    Route::post('inbox/reply', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'reply'])->name('inbox.reply');
    Route::post('inbox/update-contact', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'updateContact'])->name('inbox.update-contact');
    Route::post('inbox/new-chat', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'startConversation'])->name('inbox.new-chat');
    Route::post('inbox/simulate-inbound', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'simulateInbound'])->name('inbox.simulate');
    Route::get('chat/history', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'history'])->name('chat.history');
    Route::get('chat/stages', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'stages'])->name('chat.stages');
    Route::post('chat/stages/update-stage', [\App\Modules\Messaging\Http\Controllers\InboxController::class, 'updateStage'])->name('chat.stages.update');

    // CRM & Segments
    Route::get('contacts', [\App\Modules\Crm\Http\Controllers\ContactController::class, 'index'])->name('contacts.index');
    Route::post('contacts', [\App\Modules\Crm\Http\Controllers\ContactController::class, 'store'])->name('contacts.store');
    Route::post('contacts/bulk', [\App\Modules\Crm\Http\Controllers\ContactController::class, 'bulk'])->name('contacts.bulk');
    Route::put('contacts/{id}', [\App\Modules\Crm\Http\Controllers\ContactController::class, 'update'])->name('contacts.update');
    Route::delete('contacts/{id}', [\App\Modules\Crm\Http\Controllers\ContactController::class, 'destroy'])->name('contacts.destroy');

    Route::get('segments', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);
        $totalContacts = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)->count();

        // 1. Built-in Real Dynamic System Segments (computed from live contacts in DB)
        $optInCount = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)->where('is_opted_in', true)->count();
        $optOutCount = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)->where('is_opted_in', false)->count();
        $newLeadsCount = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)->where('pipeline_stage', 'New')->count();
        $interestedCount = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)->whereIn('pipeline_stage', ['Interested', 'Contacted'])->count();
        $wonCount = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)->where('pipeline_stage', 'Won')->count();
        $active7dCount = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)->where('last_message_at', '>=', now()->subDays(7))->count();

        // Check if there are any broadcast campaigns for last sent info
        $lastCampaign = \App\Modules\Campaigns\Models\BroadcastCampaign::where('organization_id', $org->id)->latest()->first();
        $lastBroadcastStr = $lastCampaign ? $lastCampaign->created_at->diffForHumans() : 'Never';

        $systemSegments = [
            [
                'id' => 'sys_opt_in',
                'name' => 'All Opted-In Contacts',
                'description' => 'Contacts with recorded permission to receive WhatsApp messages.',
                'count' => $optInCount,
                'criteria' => 'Consent = Opted In',
                'tags' => ['Opted-In', 'Broadcast Safe'],
                'filterType' => 'opt_in',
                'filterValue' => '',
                'lastBroadcast' => $lastBroadcastStr,
                'isSystem' => true,
                'updatedAt' => 'Real-time',
            ],
            [
                'id' => 'sys_new_leads',
                'name' => 'New Inbound Leads',
                'description' => 'Newly added contacts in "New" pipeline stage who have not yet been followed up.',
                'count' => $newLeadsCount,
                'criteria' => 'Stage: "New"',
                'tags' => ['Pipeline: New', 'Warm Leads'],
                'filterType' => 'stage',
                'filterValue' => 'New',
                'lastBroadcast' => 'Never',
                'isSystem' => true,
                'updatedAt' => 'Real-time',
            ],
            [
                'id' => 'sys_active_7d',
                'name' => 'Recently Active (Last 7 Days)',
                'description' => 'Contacts who exchanged messages with your business within the past 7 days.',
                'count' => $active7dCount,
                'criteria' => 'Last Message >= 7 Days Ago',
                'tags' => ['Active', 'High Engagement'],
                'filterType' => 'active_7d',
                'filterValue' => '',
                'lastBroadcast' => $lastBroadcastStr,
                'isSystem' => true,
                'updatedAt' => 'Real-time',
            ],
            [
                'id' => 'sys_interested',
                'name' => 'Interested / In-Discussion Leads',
                'description' => 'Prospects in "Interested" or "Contacted" pipeline stages evaluating offers.',
                'count' => $interestedCount,
                'criteria' => 'Stage in ["Interested", "Contacted"]',
                'tags' => ['Interested', 'Follow-up'],
                'filterType' => 'stage',
                'filterValue' => 'Interested',
                'lastBroadcast' => 'Never',
                'isSystem' => true,
                'updatedAt' => 'Real-time',
            ],
            [
                'id' => 'sys_won',
                'name' => 'Won / Converted Customers',
                'description' => 'Customers in "Won" stage who completed orders or purchases.',
                'count' => $wonCount,
                'criteria' => 'Stage: "Won"',
                'tags' => ['Customer', 'Converted'],
                'filterType' => 'stage',
                'filterValue' => 'Won',
                'lastBroadcast' => 'Never',
                'isSystem' => true,
                'updatedAt' => 'Real-time',
            ],
            [
                'id' => 'sys_opt_out',
                'name' => 'Opted-Out Contacts (DND)',
                'description' => 'Contacts who sent STOP or were marked Opt-Out. Excluded from broadcast campaigns.',
                'count' => $optOutCount,
                'criteria' => 'Consent = Opted Out (STOP)',
                'tags' => ['DND', 'Unsubscribed'],
                'filterType' => 'opt_out',
                'filterValue' => '',
                'lastBroadcast' => 'Never',
                'isSystem' => true,
                'updatedAt' => 'Real-time',
            ],
        ];

        // 2. Custom User-Created Segments from Database
        $customSegments = \App\Modules\Crm\Models\ContactSegment::where('organization_id', $org->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($s) {
                return [
                    'id' => (string) $s->id,
                    'name' => $s->name,
                    'description' => $s->description ?: 'Custom audience segment based on selected filters.',
                    'count' => $s->getMatchingCount(),
                    'criteria' => 'Filter: ' . ucfirst(str_replace('_', ' ', $s->filter_type)) . ($s->filter_value ? " = '{$s->filter_value}'" : ''),
                    'tags' => $s->tags ?: ['Custom'],
                    'filterType' => $s->filter_type,
                    'filterValue' => $s->filter_value ?: '',
                    'lastBroadcast' => 'Never',
                    'isSystem' => false,
                    'updatedAt' => $s->updated_at->diffForHumans(),
                ];
            })
            ->all();

        $allSegments = array_merge($systemSegments, $customSegments);

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->first();
        $templates = app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class)->getMetaTemplates($channel);

        return \Inertia\Inertia::render('contacts/segments', [
            'initialSegments' => $allSegments,
            'totalContacts' => $totalContacts,
            'templates' => $templates,
            'channel' => $channel ? [
                'id' => $channel->id,
                'name' => $channel->name,
                'phoneNumber' => $channel->phone_number,
                'status' => $channel->status,
            ] : null,
        ]);
    })->name('segments.index');

    Route::post('segments', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'filter_type' => 'required|string|in:all,opt_in,opt_out,stage,city,active_7d,inactive_30d',
            'filter_value' => 'nullable|string|max:100',
            'tag' => 'nullable|string|max:50',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);

        $tags = [];
        if (!empty($validated['tag'])) {
            $tags[] = trim($validated['tag']);
        }
        $tags[] = ucfirst(str_replace('_', ' ', $validated['filter_type']));

        \App\Modules\Crm\Models\ContactSegment::create([
            'organization_id' => $org->id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'filter_type' => $validated['filter_type'],
            'filter_value' => $validated['filter_value'] ?? null,
            'tags' => $tags,
        ]);

        return back()->with('success', 'Segment created successfully.');
    })->name('segments.store');

    Route::delete('segments/{id}', function (\Illuminate\Http\Request $request, string $id) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        \App\Modules\Crm\Models\ContactSegment::where('organization_id', $orgId)
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'Segment deleted successfully.');
    })->name('segments.destroy');

    Route::get('segments/preview', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $contactsQuery = \App\Modules\Crm\Models\Contact::where('organization_id', $orgId);

        if ($request->filled('filter_type')) {
            $fType = $request->query('filter_type');
            $fVal = $request->query('filter_value');
            if ($fType === 'opt_in') {
                $contactsQuery->where('is_opted_in', true);
            } elseif ($fType === 'opt_out') {
                $contactsQuery->where('is_opted_in', false);
            } elseif ($fType === 'stage' && $fVal) {
                $contactsQuery->where('pipeline_stage', $fVal);
            } elseif ($fType === 'city' && $fVal) {
                $contactsQuery->where('city', $fVal);
            } elseif ($fType === 'active_7d') {
                $contactsQuery->where('last_message_at', '>=', now()->subDays(7));
            } elseif ($fType === 'inactive_30d') {
                $contactsQuery->where('last_message_at', '<', now()->subDays(30));
            }
        } elseif ($request->filled('segment_id')) {
            $segId = $request->query('segment_id');
            if ($segId === 'sys_opt_in') {
                $contactsQuery->where('is_opted_in', true);
            } elseif ($segId === 'sys_opt_out') {
                $contactsQuery->where('is_opted_in', false);
            } elseif ($segId === 'sys_won') {
                $contactsQuery->where('pipeline_stage', 'Won');
            } elseif ($segId === 'sys_new_leads') {
                $contactsQuery->where('pipeline_stage', 'New');
            } elseif ($segId === 'sys_interested') {
                $contactsQuery->whereIn('pipeline_stage', ['Interested', 'Contacted']);
            } elseif ($segId === 'sys_active_7d') {
                $contactsQuery->where('last_message_at', '>=', now()->subDays(7));
            } else {
                $segment = \App\Modules\Crm\Models\ContactSegment::where('organization_id', $orgId)
                    ->where('id', $segId)
                    ->first();
                if ($segment) {
                    $contactsQuery = $segment->getMatchingQuery();
                }
            }
        }

        $contacts = $contactsQuery
            ->select('id', 'contact_name', 'contact_phone', 'city', 'pipeline_stage', 'is_opted_in', 'last_message_at')
            ->orderByDesc('last_message_at')
            ->take(50)
            ->get()
            ->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->contact_name ?: ($c->contact_phone ?: 'Unknown Contact'),
                'phone' => $c->contact_phone,
                'city' => $c->city ?: '—',
                'stage' => $c->pipeline_stage ?: 'New',
                'consent' => $c->is_opted_in ? 'opted_in' : 'opted_out',
                'lastMessage' => $c->last_message_at ? $c->last_message_at->diffForHumans() : 'No messages',
            ]);

        return response()->json([
            'contacts' => $contacts,
            'total' => $contacts->count(),
        ]);
    })->name('segments.preview');

    // Broadcasts & Templates
    Route::get('campaigns', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'index'])->name('campaigns.index');
    Route::post('campaigns/estimate', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'estimate'])->name('campaigns.estimate');
    Route::post('campaigns/broadcast', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'broadcast'])->name('campaigns.broadcast');
    Route::post('campaigns/{id}/pause', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'pause'])->name('campaigns.pause');
    Route::post('campaigns/{id}/resume', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'resume'])->name('campaigns.resume');
    Route::post('campaigns/{id}/cancel', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'cancel'])->name('campaigns.cancel');
    Route::get('campaigns/{id}/analytics', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'analytics'])->name('campaigns.analytics');
    Route::get('campaigns/ads', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);
        \App\Shared\TenantContext::set($org);

        $channels = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->orderByDesc('is_default')
            ->get();

        $flows = \App\Modules\Bot\Models\BotFlow::where('organization_id', $org->id)
            ->where('status', 'active')
            ->get(['id', 'name', 'trigger_keywords']);

        return \Inertia\Inertia::render('campaigns/ads', [
            'channels' => $channels->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phoneNumber' => $c->phone_number,
                'cleanPhone' => preg_replace('/\D+/', '', $c->phone_number ?? ''),
                'isDefault' => (bool) $c->is_default,
            ])->values()->all(),
            'flows' => $flows,
        ]);
    })->name('campaigns.ads');

    Route::get('help', function () {
        return \Inertia\Inertia::render('help/index');
    })->name('help.index');
    // Templates Management (Live Meta Templates)
    Route::get('templates', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);
        \App\Shared\TenantContext::set($org);

        $channels = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->orderByDesc('is_default')
            ->get();

        $selectedChannelId = $request->query('channel_id');
        $channel = ($selectedChannelId ? $channels->firstWhere('id', $selectedChannelId) : null)
            ?? $channels->firstWhere('is_default', true)
            ?? $channels->first();

        $templates = app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class)->getMetaTemplates($channel);

        return \Inertia\Inertia::render('campaigns/templates', [
            'initialTemplates' => $templates,
            'channel' => $channel ? [
                'id' => $channel->id,
                'name' => $channel->name,
                'phoneNumber' => $channel->phone_number,
                'status' => $channel->status,
                'wabaId' => $channel->waba_id,
            ] : null,
            'channels' => $channels->map(fn ($c) => [
                'id' => (string) $c->id,
                'name' => $c->name,
                'phoneNumber' => $c->phone_number,
                'wabaId' => $c->waba_id,
                'isDefault' => (bool) $c->is_default,
            ])->values()->all(),
        ]);
    })->name('templates.index');

    Route::post('templates', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'channel_id' => 'nullable|uuid',
            'name' => 'required|string|regex:/^[a-z0-9_]+$/|max:100',
            'category' => 'required|string|in:UTILITY,MARKETING,AUTHENTICATION',
            'language' => 'required|string|max:10',
            'body' => 'required|string|max:1024',
            'header_type' => 'nullable|string|in:NONE,TEXT,VIDEO,IMAGE,DOCUMENT',
            'header_text' => 'nullable|string|max:60',
            'header_file' => 'nullable|file|max:16384',
            'footer' => 'nullable|string|max:60',
            'button_type' => 'nullable|string|in:NONE,URL,QUICK_REPLY',
            'button_url_text' => 'nullable|string|max:25',
            'button_url_link' => 'nullable|url|max:500',
            'button_qr_text' => 'nullable|string|max:25',
        ], [
            'name.regex' => 'Template name must contain only lowercase letters, numbers, and underscores (e.g. order_alert_v1).',
            'header_file.max' => 'Header media file must not exceed 16 MB.',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $targetChannelId = $request->input('channel_id');
        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
            ->when($targetChannelId, fn ($q) => $q->where('id', $targetChannelId))
            ->orderByDesc('is_default')
            ->first();

        if (! $channel || empty($channel->access_token) || empty($channel->waba_id)) {
            return back()->withErrors(['message' => 'Connected WhatsApp Channel with active WABA ID is required to create templates.']);
        }

        // 1. Build Body Component
        preg_match_all('/\{\{(\d+)\}\}/', $validated['body'], $matches);
        $bodyComponent = [
            'type' => 'BODY',
            'text' => $validated['body'],
        ];

        if (! empty($matches[1])) {
            $sampleValues = array_map(fn ($n) => "Sample {$n}", $matches[1]);
            $bodyComponent['example'] = [
                'body_text' => [$sampleValues],
            ];
        }

        $components = [$bodyComponent];

        // 2. Build Header Component
        $headerType = strtoupper($request->input('header_type', 'NONE'));
        if ($headerType === 'TEXT' && ! empty($request->input('header_text'))) {
            $components[] = [
                'type' => 'HEADER',
                'format' => 'TEXT',
                'text' => trim($request->input('header_text')),
            ];
        } elseif (in_array($headerType, ['VIDEO', 'IMAGE', 'DOCUMENT'])) {
            $uploadedHeaderFile = $request->file('header_file');
            $headerHandle = null;

            if ($uploadedHeaderFile && $uploadedHeaderFile->isValid()) {
                // 1. Store locally in public storage
                $ext = $uploadedHeaderFile->getClientOriginalExtension();
                $path = $uploadedHeaderFile->storeAs('template_media', $validated['name'] . '_' . time() . '.' . $ext, 'public');
                $localUrl = url('storage/' . $path);

                // 2. Upload to Meta Resumable Upload API for review handle
                $appId = config('services.meta.app_id', env('META_APP_ID', '2627607561020985'));
                $fileContents = file_get_contents($uploadedHeaderFile->getRealPath());
                $fileSize = strlen($fileContents);
                $mimeType = $uploadedHeaderFile->getMimeType() ?: ($headerType === 'VIDEO' ? 'video/mp4' : ($headerType === 'IMAGE' ? 'image/jpeg' : 'application/pdf'));

                $sessionResp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                    ->post("https://graph.facebook.com/v22.0/{$appId}/uploads", [
                        'file_length' => $fileSize,
                        'file_type' => $mimeType,
                    ]);

                $uploadId = $sessionResp->json('id');
                if ($uploadId) {
                    $uploadResp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                        ->withHeaders([
                            'file_offset' => 0,
                            'Content-Type' => 'application/octet-stream',
                        ])
                        ->withBody($fileContents, 'application/octet-stream')
                        ->post("https://graph.facebook.com/v22.0/{$uploadId}");

                    $headerHandle = $uploadResp->json('h');
                }

                // 3. Upload to WhatsApp Media API so media_id is ready for live dispatch
                $mediaResp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                    ->attach('file', $fileContents, $uploadedHeaderFile->getClientOriginalName(), ['Content-Type' => $mimeType])
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/media", [
                        'messaging_product' => 'whatsapp',
                        'type' => $mimeType,
                    ]);

                $mediaId = $mediaResp->successful() ? $mediaResp->json('id') : null;

                // Save in channel metadata
                $meta = $channel->metadata ?? [];
                if (! isset($meta['template_media_urls'])) {
                    $meta['template_media_urls'] = [];
                }
                if (! isset($meta['template_media_ids'])) {
                    $meta['template_media_ids'] = [];
                }
                $meta['template_media_urls'][$validated['name']] = $localUrl;
                if ($mediaId) {
                    $meta['template_media_ids'][$validated['name']] = $mediaId;
                }
                $channel->update(['metadata' => $meta]);
            }

            if ($headerHandle) {
                $components[] = [
                    'type' => 'HEADER',
                    'format' => $headerType,
                    'example' => [
                        'header_handle' => [$headerHandle],
                    ],
                ];
            } else {
                return back()->withErrors(['message' => "Uploading sample {$headerType} to Meta failed. Please ensure file is valid and under 16 MB."]);
            }
        }

        // 3. Build Footer Component
        if (! empty($validated['footer'])) {
            $components[] = [
                'type' => 'FOOTER',
                'text' => $validated['footer'],
            ];
        }

        // 4. Build Buttons Component
        $buttonType = $request->input('button_type', 'NONE');
        if ($buttonType === 'URL' && ! empty($request->input('button_url_text')) && ! empty($request->input('button_url_link'))) {
            $components[] = [
                'type' => 'BUTTONS',
                'buttons' => [
                    [
                        'type' => 'URL',
                        'text' => trim($request->input('button_url_text')),
                        'url' => trim($request->input('button_url_link')),
                    ],
                ],
            ];
        } elseif ($buttonType === 'QUICK_REPLY' && ! empty($request->input('button_qr_text'))) {
            $components[] = [
                'type' => 'BUTTONS',
                'buttons' => [
                    [
                        'type' => 'QUICK_REPLY',
                        'text' => trim($request->input('button_qr_text')),
                    ],
                ],
            ];
        }

        $payload = [
            'name' => $validated['name'],
            'language' => $validated['language'],
            'category' => $validated['category'],
            'components' => $components,
        ];

        try {
            $resp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                ->timeout(25)
                ->post("https://graph.facebook.com/v22.0/{$channel->waba_id}/message_templates", $payload);

            if ($resp->successful()) {
                $meta = $channel->metadata ?? [];
                $hidden = $meta['hidden_templates'] ?? [];
                if (in_array($validated['name'], $hidden)) {
                    $meta['hidden_templates'] = array_values(array_filter($hidden, fn ($n) => $n !== $validated['name']));
                    $channel->update(['metadata' => $meta]);
                }
                \Illuminate\Support\Facades\Cache::forget("meta_templates_{$channel->waba_id}");
                $status = $resp->json('status') ?? 'PENDING';
                return back()->with('success', "Template '{$validated['name']}' submitted to Meta successfully! Status: {$status}. Meta usually approves within 1-5 minutes.");
            }

            $errMsg = $resp->json('error.error_user_msg')
                ?? $resp->json('error.message')
                ?? 'Meta rejected the template submission.';
            return back()->withErrors(['message' => $errMsg]);
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Connection error: ' . $e->getMessage()]);
        }
    })->name('templates.store');

    Route::post('templates/sync', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $targetChannelId = $request->input('channel_id');
        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
            ->when($targetChannelId, fn ($q) => $q->where('id', $targetChannelId))
            ->orderByDesc('is_default')
            ->first();

        if ($channel) {
            \Illuminate\Support\Facades\Cache::forget("meta_templates_{$channel->waba_id}");
            $templates = app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class)->getMetaTemplates($channel);
            return back()->with('success', count($templates) . ' templates synchronized from Meta for ' . ($channel->name ?: $channel->phone_number) . '.');
        }

        return back()->with('success', 'Templates cache refreshed.');
    })->name('templates.sync');

    Route::match(['PUT', 'POST'], 'templates/{id}', function (\Illuminate\Http\Request $request, string $id) {
        $validated = $request->validate([
            'body' => 'required|string|max:1024',
            'header' => 'nullable|string|max:60',
            'footer' => 'nullable|string|max:60',
            'template_name' => 'nullable|string',
            'header_url' => 'nullable|string',
            'video_file' => 'nullable|file|mimes:mp4,3gp|max:16384',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
            ->first();

        if (! $channel || empty($channel->access_token) || empty($channel->waba_id)) {
            return back()->withErrors(['message' => 'Connected WhatsApp Channel is required.']);
        }

        $templateName = $validated['template_name'] ?? $id;
        $meta = $channel->metadata ?? [];
        $mediaUpdated = false;

        // 1. Process Video File Upload directly to Meta Media API and public storage
        if ($request->hasFile('video_file')) {
            $file = $request->file('video_file');

            try {
                // Upload directly to Meta WhatsApp Media API
                $metaResp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                    ->timeout(60)
                    ->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName(), ['Content-Type' => $file->getMimeType()])
                    ->post("https://graph.facebook.com/v22.0/{$channel->phone_number_id}/media", [
                        'messaging_product' => 'whatsapp',
                        'type' => $file->getMimeType(),
                    ]);

                if ($metaResp->successful() && $metaResp->json('id')) {
                    $meta['template_media_ids'][$templateName] = $metaResp->json('id');
                } else {
                    $err = $metaResp->json('error.error_data.details') ?? $metaResp->json('error.message') ?? 'Meta Media upload failed';
                    return back()->withErrors(['message' => "Meta Media API Error: {$err}"]);
                }
            } catch (\Throwable $e) {
                return back()->withErrors(['message' => 'Could not upload video to Meta: ' . $e->getMessage()]);
            }

            // Also save locally in public storage
            $localPath = $file->store('template_media', 'public');
            $meta['template_media_urls'][$templateName] = url(\Illuminate\Support\Facades\Storage::url($localPath));
            $mediaUpdated = true;
        } elseif (! empty($validated['header_url'])) {
            $meta['template_media_urls'][$templateName] = trim($validated['header_url']);
            unset($meta['template_media_ids'][$templateName]);
            $mediaUpdated = true;
        }

        if ($mediaUpdated) {
            $channel->update(['metadata' => $meta]);
            \Illuminate\Support\Facades\Cache::forget("meta_templates_{$channel->waba_id}");
        }

        // Parse body variables ({{1}}, {{2}}...)
        preg_match_all('/\{\{(\d+)\}\}/', $validated['body'], $matches);
        $bodyComponent = [
            'type' => 'BODY',
            'text' => $validated['body'],
        ];

        if (! empty($matches[1])) {
            $sampleValues = array_map(fn ($n) => "Sample {$n}", $matches[1]);
            $bodyComponent['example'] = [
                'body_text' => [$sampleValues],
            ];
        }

        $components = [$bodyComponent];

        if (! empty($validated['header'])) {
            $components[] = [
                'type' => 'HEADER',
                'format' => 'TEXT',
                'text' => $validated['header'],
            ];
        }

        if (! empty($validated['footer'])) {
            $components[] = [
                'type' => 'FOOTER',
                'text' => $validated['footer'],
            ];
        }

        try {
            $resp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                ->timeout(15)
                ->post("https://graph.facebook.com/v22.0/{$id}", [
                    'components' => $components,
                ]);

            if ($resp->successful() || $resp->json('success') === true) {
                \Illuminate\Support\Facades\Cache::forget("meta_templates_{$channel->waba_id}");
                return back()->with('success', "Template updated successfully! Meta is reviewing the updated template.");
            }

            if ($mediaUpdated) {
                // Media (video/image) was updated and saved successfully even if Meta blocks approved text modification
                return back()->with('success', "Video header updated successfully for template '{$templateName}'! Messages will now send with your new video.");
            }

            $userMsg = $resp->json('error.error_user_msg');
            if ($userMsg && str_contains($userMsg, 'only be edited if they have been rejected')) {
                $errMsg = "Meta Policy: Approved templates cannot be modified directly in Meta to prevent disrupting live campaigns. To update this message, please create a new version (e.g. name_v2).";
            } else {
                $errMsg = $userMsg ?? $resp->json('error.message') ?? 'Meta rejected template update.';
            }
            return back()->withErrors(['message' => $errMsg]);
        } catch (\Throwable $e) {
            if ($mediaUpdated) {
                return back()->with('success', "Video header updated successfully for template '{$templateName}'! Messages will now send with your new video.");
            }
            return back()->withErrors(['message' => 'Connection error: ' . $e->getMessage()]);
        }
    })->name('templates.update');

    Route::delete('templates/{name}', function (\Illuminate\Http\Request $request, string $name) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
            ->first();

        if (! $channel || empty($channel->access_token) || empty($channel->waba_id)) {
            return back()->withErrors(['message' => 'Connected WhatsApp Channel is required.']);
        }

        $metaDeleted = false;
        try {
            $resp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                ->timeout(10)
                ->delete("https://graph.facebook.com/v22.0/{$channel->waba_id}/message_templates?name={$name}");

            if ($resp->successful() || $resp->json('success') === true) {
                $metaDeleted = true;
            }
        } catch (\Throwable $e) {
            // Meta delete call finished
        }

        // Always register in hidden_templates so it is instantly removed from the dashboard and campaigns
        $meta = $channel->metadata ?? [];
        $hidden = $meta['hidden_templates'] ?? [];
        if (! in_array($name, $hidden)) {
            $hidden[] = $name;
            $meta['hidden_templates'] = array_values($hidden);
            $channel->update(['metadata' => $meta]);
        }

        \Illuminate\Support\Facades\Cache::forget("meta_templates_{$channel->waba_id}");

        $msg = $metaDeleted
            ? "Template '{$name}' deleted successfully from Meta."
            : "Template '{$name}' deleted and removed from your dashboard.";

        return back()->with('success', $msg);
    })->name('templates.destroy');

    // WhatsApp Analytics & Meta Template Costs
    Route::get('reports', [\App\Modules\Analytics\Http\Controllers\MetaCostAnalyticsController::class, 'index'])->name('reports.index');
    Route::post('reports/sync', [\App\Modules\Analytics\Http\Controllers\MetaCostAnalyticsController::class, 'syncMeta'])->name('reports.sync');
    Route::get('analytics/meta-costs', [\App\Modules\Analytics\Http\Controllers\MetaCostAnalyticsController::class, 'index'])->name('analytics.meta-costs');

    // WhatsApp Commerce & Meta Catalog
    Route::get('commerce', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'index'])->name('commerce.index');
    Route::post('commerce/products', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'storeProduct'])->name('commerce.products.store');
    Route::put('commerce/products/{id}', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'updateProduct'])->name('commerce.products.update');
    Route::delete('commerce/products/{id}', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'deleteProduct'])->name('commerce.products.destroy');
    Route::patch('commerce/orders/{id}/status', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'updateOrderStatus'])->name('commerce.orders.status');
    Route::post('commerce/sync', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'syncCatalog'])->name('commerce.sync');
    Route::get('commerce/export-csv', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'exportMetaCsv'])->name('commerce.export.csv');
    Route::post('commerce/settings', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'updateSettings'])->name('commerce.settings.update');
    Route::post('commerce/link-catalog', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'linkCatalogToMeta'])->name('commerce.catalog.link');
    Route::post('commerce/send-catalog', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'sendCatalogMessage'])->name('commerce.send.catalog');
    Route::post('commerce/send-product', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'sendProductMessage'])->name('commerce.send.product');
    Route::post('commerce/simulate-order', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'simulateOrder'])->name('commerce.simulate.order');

    // ==========================================
    // 1. CRM Lead Pipeline (Kanban & Deal Values)
    // ==========================================
    Route::get('crm/pipeline', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);
        \App\Shared\TenantContext::set($org);

        $stages = ['New', 'Contacted', 'Interested', 'Qualified', 'Negotiation', 'Won', 'Lost'];

        $conversations = \App\Modules\Crm\Models\Contact::where('organization_id', $org->id)
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($c) {
                return [
                    'id' => (string) $c->id,
                    'contact_name' => $c->contact_name ?: ($c->contact_phone ?: 'Unknown Lead'),
                    'contact_phone' => $c->contact_phone,
                    'stage' => $c->pipeline_stage ?: 'New',
                    'deal_value' => (float) ($c->deal_value ?? 0),
                    'followup_date' => $c->followup_date ? $c->followup_date->format('Y-m-d H:i') : null,
                    'lead_source' => $c->lead_source ?: 'WhatsApp Inbound',
                    'city' => $c->city ?: '',
                    'email' => $c->email ?: '',
                    'last_message_at' => $c->last_message_at ? $c->last_message_at->diffForHumans() : 'Recently',
                ];
            });

        // Stage statistics
        $stageStats = [];
        foreach ($stages as $stage) {
            $matching = $conversations->where('stage', $stage);
            $stageStats[$stage] = [
                'count' => $matching->count(),
                'total_value' => $matching->sum('deal_value'),
            ];
        }

        $teamUsers = $org->users()->get(['users.id', 'users.name', 'users.email']);

        return \Inertia\Inertia::render('crm/pipeline', [
            'leads' => $conversations->values(),
            'stages' => $stages,
            'stageStats' => $stageStats,
            'teamUsers' => $teamUsers,
            'totalPipelineValue' => $conversations->sum('deal_value'),
        ]);
    })->name('crm.pipeline');

    Route::post('crm/pipeline/move', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'stage' => 'required|string',
            'deal_value' => 'nullable|numeric|min:0',
            'followup_date' => 'nullable|string',
        ]);

        $conv = \App\Modules\Crm\Models\Contact::findOrFail($validated['conversation_id']);
        $updateData = ['pipeline_stage' => $validated['stage']];
        if (isset($validated['deal_value'])) {
            $updateData['deal_value'] = $validated['deal_value'];
        }
        if (!empty($validated['followup_date'])) {
            $updateData['followup_date'] = \Carbon\Carbon::parse($validated['followup_date']);
        }

        $conv->update($updateData);

        // Record in audit log
        \App\Modules\Foundation\Models\AuditLog::record('lead_stage_updated', $conv, [
            'stage' => $validated['stage'],
            'deal_value' => $validated['deal_value'] ?? $conv->deal_value,
        ]);

        return back()->with('success', "Lead moved to '{$validated['stage']}' successfully.");
    })->name('crm.pipeline.move');

    Route::post('crm/pipeline/lead', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'phone' => 'required|string|max:30',
            'stage' => 'required|string',
            'deal_value' => 'nullable|numeric|min:0',
            'followup_date' => 'nullable|date',
            'lead_source' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:100',
        ]);

        $phone = preg_replace('/[^\d+]/', '', $validated['phone']);
        if (!str_starts_with($phone, '+')) {
            $phone = '+' . ltrim($phone, '0');
        }

        $lead = \App\Modules\Crm\Models\Contact::updateOrCreate(
            [
                'organization_id' => $orgId,
                'contact_phone' => $phone,
            ],
            [
                'contact_name' => $validated['name'],
                'pipeline_stage' => $validated['stage'],
                'deal_value' => $validated['deal_value'] ?? 0,
                'followup_date' => !empty($validated['followup_date']) ? \Carbon\Carbon::parse($validated['followup_date']) : null,
                'lead_source' => $validated['lead_source'] ?? 'Direct WhatsApp',
                'city' => $validated['city'] ?? null,
                'email' => $validated['email'] ?? null,
                'is_opted_in' => true,
                'status' => 'active',
                'last_message_at' => now(),
            ]
        );

        \App\Modules\Foundation\Models\AuditLog::record('lead_created', $lead, ['phone' => $phone]);

        return back()->with('success', "Lead '{$validated['name']}' saved to pipeline.");
    })->name('crm.pipeline.lead.store');

    Route::delete('crm/pipeline/lead/{id}', function (\Illuminate\Http\Request $request, string $id) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $conv = \App\Modules\Crm\Models\Contact::where('organization_id', $orgId)->where('id', $id)->first();
        if ($conv) {
            $conv->delete();
            \App\Modules\Foundation\Models\AuditLog::record('lead_deleted', null, ['id' => $id]);
        }

        return back()->with('success', 'Lead removed from pipeline.');
    })->name('crm.pipeline.lead.destroy');

    // ==========================================
    // 2. Team Management & Granular Permissions
    // ==========================================
    Route::get('management/team', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);
        \App\Shared\TenantContext::set($org);

        $channels = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $org->id)
            ->get(['id', 'name', 'phone_number', 'status']);

        $members = $org->users()->get()->map(function ($u) {
            $channelAccess = $u->pivot->channel_access ? (is_string($u->pivot->channel_access) ? json_decode($u->pivot->channel_access, true) : $u->pivot->channel_access) : [];
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->pivot->role ?: 'Agent',
                'channel_access' => $channelAccess ?: [],
                'status' => 'active',
                'joined_at' => $u->pivot->created_at ? $u->pivot->created_at->format('M d, Y') : 'Active',
            ];
        });

        // Invitations
        $invitations = $org->invitations()->latest()->get()->map(function ($inv) {
            return [
                'id' => $inv->id,
                'email' => $inv->email,
                'role' => $inv->role,
                'created_at' => $inv->created_at ? $inv->created_at->diffForHumans() : 'Recently',
                'expires_at' => $inv->expires_at ? $inv->expires_at->format('M d, Y') : null,
                'status' => $inv->accepted_at ? 'Accepted' : 'Pending',
            ];
        });

        // Default Granular Permission Matrix for the 5 Roles
        $defaultMatrix = [
            'Owner' => [
                'organizations' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'whatsapp_accounts' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'inbox' => ['view' => true, 'reply' => true, 'assign' => true, 'delete' => true],
                'campaigns' => ['view' => true, 'create' => true, 'send' => true, 'delete' => true],
                'templates' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'automation' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'crm' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'billing' => ['view' => true, 'edit' => true, 'manage_plan' => true],
            ],
            'Admin' => [
                'organizations' => ['view' => true, 'create' => false, 'edit' => true, 'delete' => false],
                'whatsapp_accounts' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => false],
                'inbox' => ['view' => true, 'reply' => true, 'assign' => true, 'delete' => true],
                'campaigns' => ['view' => true, 'create' => true, 'send' => true, 'delete' => true],
                'templates' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'automation' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'crm' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => true],
                'billing' => ['view' => true, 'edit' => false, 'manage_plan' => false],
            ],
            'Manager' => [
                'organizations' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'whatsapp_accounts' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'inbox' => ['view' => true, 'reply' => true, 'assign' => true, 'delete' => false],
                'campaigns' => ['view' => true, 'create' => true, 'send' => true, 'delete' => false],
                'templates' => ['view' => true, 'create' => true, 'edit' => false, 'delete' => false],
                'automation' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'crm' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => false],
                'billing' => ['view' => false, 'edit' => false, 'manage_plan' => false],
            ],
            'Agent' => [
                'organizations' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
                'whatsapp_accounts' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'inbox' => ['view' => true, 'reply' => true, 'assign' => false, 'delete' => false],
                'campaigns' => ['view' => false, 'create' => false, 'send' => false, 'delete' => false],
                'templates' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'automation' => ['view' => false, 'create' => false, 'edit' => false, 'delete' => false],
                'crm' => ['view' => true, 'create' => true, 'edit' => true, 'delete' => false],
                'billing' => ['view' => false, 'edit' => false, 'manage_plan' => false],
            ],
            'Viewer' => [
                'organizations' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'whatsapp_accounts' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'inbox' => ['view' => true, 'reply' => false, 'assign' => false, 'delete' => false],
                'campaigns' => ['view' => true, 'create' => false, 'send' => false, 'delete' => false],
                'templates' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'automation' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'crm' => ['view' => true, 'create' => false, 'edit' => false, 'delete' => false],
                'billing' => ['view' => false, 'edit' => false, 'manage_plan' => false],
            ],
        ];

        $savedMatrix = $org->metadata['role_permissions'] ?? $defaultMatrix;

        return \Inertia\Inertia::render('management/team', [
            'members' => $members,
            'invitations' => $invitations,
            'channels' => $channels,
            'roles' => ['Owner', 'Admin', 'Manager', 'Agent', 'Viewer'],
            'permissionMatrix' => $savedMatrix,
            'currentUserId' => $request->user()->id,
        ]);
    })->name('management.team');

    Route::post('management/team/invite', [\App\Modules\Foundation\Http\Controllers\TeamController::class, 'invite'])->name('management.team.invite');
    Route::post('management/team/update-member', [\App\Modules\Foundation\Http\Controllers\TeamController::class, 'update'])->name('management.team.update-member');
    Route::delete('management/team/member/{id}', [\App\Modules\Foundation\Http\Controllers\TeamController::class, 'remove'])->name('management.team.remove-member');
    Route::post('management/team/permissions', [\App\Modules\Foundation\Http\Controllers\TeamController::class, 'permissions'])->name('management.team.permissions');

    // ==========================================
    // 3. System Logs & Webhook Inspector
    // ==========================================
    Route::get('insights/system-logs', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId);
        \App\Shared\TenantContext::set($org);

        // Webhook Logs
        $statusFilter = $request->input('status', 'all');
        $webhookQuery = \App\Modules\Messaging\Models\WebhookInbox::where('organization_id', $org->id)->latest();
        if ($statusFilter !== 'all') {
            $webhookQuery->where('status', $statusFilter);
        }
        $webhooks = $webhookQuery->limit(50)->get()->map(function ($w) {
            return [
                'id' => $w->id,
                'provider' => $w->provider ?: 'meta_whatsapp',
                'event_id' => $w->event_id ?: ('evt_' . $w->id),
                'status' => $w->status ?: 'processed',
                'error' => $w->error,
                'payload' => $w->payload,
                'created_at' => $w->created_at ? $w->created_at->format('Y-m-d H:i:s') : 'N/A',
                'time_ago' => $w->created_at ? $w->created_at->diffForHumans() : 'Recently',
            ];
        });

        // Audit Logs
        $auditLogs = \App\Modules\Foundation\Models\AuditLog::where('organization_id', $org->id)
            ->with('user:id,name,email')
            ->latest('created_at')
            ->limit(50)
            ->get()
            ->map(function ($a) {
                return [
                    'id' => $a->id,
                    'user_name' => $a->user?->name ?: 'System / Webhook',
                    'user_email' => $a->user?->email ?: 'system@meta.com',
                    'action' => $a->action,
                    'entity_type' => $a->entity_type ? class_basename($a->entity_type) : 'System',
                    'entity_id' => $a->entity_id,
                    'diff' => $a->diff,
                    'ip_address' => $a->ip_address ?: '127.0.0.1',
                    'created_at' => $a->created_at ? $a->created_at->format('Y-m-d H:i:s') : 'N/A',
                    'time_ago' => $a->created_at ? $a->created_at->diffForHumans() : 'Recently',
                ];
            });

        return \Inertia\Inertia::render('insights/system-logs', [
            'webhooks' => $webhooks,
            'auditLogs' => $auditLogs,
            'currentFilter' => $statusFilter,
        ]);
    })->name('insights.system-logs');

    Route::post('insights/system-logs/simulate-webhook', function (\Illuminate\Http\Request $request) {
        $type = $request->input('type', 'message'); // message, status, template
        $samplePayload = [
            'object' => 'whatsapp_business_account',
            'entry' => [
                [
                    'id' => '2627607561020985',
                    'changes' => [
                        [
                            'value' => [
                                'messaging_product' => 'whatsapp',
                                'metadata' => [
                                    'display_phone_number' => '+916352709531',
                                    'phone_number_id' => '1048698124991196',
                                ],
                                'contacts' => [
                                    ['profile' => ['name' => 'Test Customer'], 'wa_id' => '919825012345'],
                                ],
                                'messages' => [
                                    [
                                        'from' => '919825012345',
                                        'id' => 'wamid.HBgLOTE5ODI1MDEyMzQ1FQIAEhgWM' . uniqid(),
                                        'timestamp' => time(),
                                        'text' => ['body' => 'Hello! I need pricing for WhatsApp SaaS API integration.'],
                                        'type' => 'text',
                                    ],
                                ],
                            ],
                            'field' => 'messages',
                        ],
                    ],
                ],
            ],
        ];

        \App\Modules\Messaging\Models\WebhookInbox::create([
            'provider' => 'meta_whatsapp',
            'event_id' => 'evt_' . uniqid(),
            'payload' => $samplePayload,
            'status' => 'processed',
        ]);

        return back()->with('success', 'Simulated Meta Webhook event captured successfully.');
    })->name('insights.system-logs.simulate');

    Route::post('insights/system-logs/clear', function () {
        \App\Modules\Messaging\Models\WebhookInbox::where('organization_id', \App\Shared\TenantContext::id())->delete();
        return back()->with('success', 'Webhook logs cleared.');
    })->name('insights.system-logs.clear');

    // ==========================================
    // 4. Contact Deduplication & Merge
    // ==========================================
    Route::get('contacts/duplicates', [\App\Modules\Crm\Http\Controllers\ContactController::class, 'duplicates'])->name('contacts.duplicates');
    Route::post('contacts/merge', [\App\Modules\Crm\Http\Controllers\ContactController::class, 'merge'])->name('contacts.merge');

    Route::get('settings/billing', [\App\Modules\Billing\Http\Controllers\BillingController::class, 'index'])->name('settings.billing');
    Route::post('settings/billing/checkout', [\App\Modules\Billing\Http\Controllers\BillingController::class, 'checkout'])->middleware('throttle:10,1');
    Route::post('settings/billing/verify', [\App\Modules\Billing\Http\Controllers\BillingController::class, 'verify']);
    Route::put('settings/billing/profile', [\App\Modules\Billing\Http\Controllers\BillingController::class, 'profile']);
    Route::get('settings/billing/invoices/{id}', [\App\Modules\Billing\Http\Controllers\BillingController::class, 'download']);

    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
    Route::post('/workspace/store', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'store'])->name('workspace.store');
});

require __DIR__.'/settings.php';
