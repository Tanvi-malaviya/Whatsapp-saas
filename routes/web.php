<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

// Meta WhatsApp Cloud API Webhook Endpoints
Route::get('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'verify']);
Route::post('/webhooks/meta', [\App\Modules\MetaConnection\Http\Controllers\MetaWebhookController::class, 'receive']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    
    // WhatsApp Channels & Number Connection (Like Xobito Channels)
    Route::get('whatsapp/connect', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'index'])->name('whatsapp.connect');
    Route::get('whatsapp/connect/setup', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'wizard'])->name('whatsapp.connect.wizard');
    Route::get('channels/connect', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'wizard'])->name('channels.connect');
    Route::get('channels', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'index'])->name('channels.index');
    Route::post('channels', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'store'])->name('channels.store');
    Route::post('channels/quick-connect', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'quickConnect'])->name('channels.quick-connect');
    Route::delete('channels/{id}', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'destroy'])->name('channels.destroy');
    Route::post('channels/{id}/test', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'testConnection'])->name('channels.test');
    Route::get('channels/{id}', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'show'])->name('channels.show');
    Route::get('whatsapp/channels/{id}', [\App\Modules\MetaConnection\Http\Controllers\WhatsAppChannelController::class, 'show'])->name('whatsapp.channels.show');

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
    Route::get('flows', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        \App\Shared\TenantContext::set($org);

        // Check if any flows exist, if not seed 1 clean real starter flow for Sathwara InfoTech
        $count = \App\Modules\Bot\Models\BotFlow::where('organization_id', $org->id)->count();
        if ($count === 0) {
            \App\Modules\Bot\Models\BotFlow::create([
                'organization_id' => $org->id,
                'name' => 'Inbound Inquiries & Services Menu',
                'description' => 'Greets incoming WhatsApp contacts, offers interactive IT services menu, and collects project requirements.',
                'trigger_keywords' => 'hi, hello, hey, inquiry, services, info',
                'status' => 'active',
                'greeting_message' => "👋 Welcome to Sathwara InfoTech!\nHow can we help you grow your business today?\n\n1️⃣ Web & Software Development\n2️⃣ WhatsApp Cloud API & Automation\n3️⃣ Talk to Support / Sales Agent\n\nReply with 1, 2, or 3.",
                'options' => [
                    [
                        'id' => '1',
                        'label' => 'Web Development',
                        'reply_text' => '🌐 We design and develop custom Laravel & React web applications, portals, and SaaS platforms tailored to your business needs! Would you like to schedule a consultation?',
                        'action_type' => 'reply',
                    ],
                    [
                        'id' => '2',
                        'label' => 'WhatsApp Automation',
                        'reply_text' => '🚀 With our WhatsApp Cloud API solution, you can send broadcasts to 10,000+ contacts, manage multi-agent shared inbox, and automate customer replies with 98% open rates!',
                        'action_type' => 'reply',
                    ],
                    [
                        'id' => '3',
                        'label' => 'Human Agent Handoff',
                        'reply_text' => '👨‍💼 Notifying our team at Sathwara InfoTech! A representative will connect with you here shortly.',
                        'action_type' => 'human_handoff',
                    ],
                ],
                'execution_count' => 0,
            ]);
        }

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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

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
                    'email' => $c->email ?: '—',
                    'city' => $c->city ?: '—',
                    'stage' => $c->pipeline_stage ?: 'New',
                    'consent' => $c->is_opted_in ? 'opted_in' : 'opted_out',
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
            'email' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'stage' => 'nullable|string|in:New,Contacted,Interested,Won',
            'opt_in' => 'nullable|boolean',
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
                'email' => $request->email,
                'city' => $request->city,
                'pipeline_stage' => $request->stage ?? 'New',
                'is_opted_in' => $request->has('opt_in') ? $request->boolean('opt_in') : true,
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
                    'is_opted_in' => true,
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
            'email' => 'nullable|string|max:100',
            'city' => 'nullable|string|max:100',
            'stage' => 'nullable|string|in:New,Contacted,Interested,Won',
            'opt_in' => 'nullable|boolean',
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
                'email' => $validated['email'] ?? null,
                'city' => $validated['city'] ?? null,
                'pipeline_stage' => $validated['stage'] ?? $conv->pipeline_stage,
                'is_opted_in' => $request->has('opt_in') ? $request->boolean('opt_in') : ($conv->is_opted_in ?? true),
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

    Route::get('segments', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        $totalContacts = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->count();

        // 1. Built-in Real Dynamic System Segments (computed from live contacts in DB)
        $optInCount = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->where('is_opted_in', true)->count();
        $optOutCount = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->where('is_opted_in', false)->count();
        $newLeadsCount = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->where('pipeline_stage', 'New')->count();
        $interestedCount = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->whereIn('pipeline_stage', ['Interested', 'Contacted'])->count();
        $wonCount = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->where('pipeline_stage', 'Won')->count();
        $active7dCount = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->where('last_message_at', '>=', now()->subDays(7))->count();

        // Check if there are any broadcast campaigns for last sent info
        $lastCampaign = \App\Modules\Campaigns\Models\BroadcastCampaign::where('organization_id', $org->id)->latest()->first();
        $lastBroadcastStr = $lastCampaign ? $lastCampaign->created_at->diffForHumans() : 'Never';

        $systemSegments = [
            [
                'id' => 'sys_opt_in',
                'name' => 'All Opted-In Contacts',
                'description' => 'Contacts who gave permission to receive WhatsApp messages. 100% compliant and safe for marketing & updates.',
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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        \App\Modules\Crm\Models\ContactSegment::where('organization_id', $orgId)
            ->where('id', $id)
            ->delete();

        return back()->with('success', 'Segment deleted successfully.');
    })->name('segments.destroy');

    Route::get('segments/preview', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $contactsQuery = \App\Modules\Messaging\Models\Conversation::where('organization_id', $orgId);

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
    Route::post('campaigns/broadcast', [\App\Modules\Campaigns\Http\Controllers\CampaignController::class, 'broadcast'])->name('campaigns.broadcast');
    // Templates Management (Live Meta Templates)
    Route::get('templates', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        \App\Shared\TenantContext::set($org);

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->first();

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
        ]);
    })->name('templates.index');

    Route::post('templates', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|regex:/^[a-z0-9_]+$/|max:100',
            'category' => 'required|string|in:UTILITY,MARKETING,AUTHENTICATION',
            'language' => 'required|string|max:10',
            'body' => 'required|string|max:1024',
            'header' => 'nullable|string|max:60',
            'footer' => 'nullable|string|max:60',
        ], [
            'name.regex' => 'Template name must contain only lowercase letters, numbers, and underscores (e.g. order_alert_v1).',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
            ->first();

        if (! $channel || empty($channel->access_token) || empty($channel->waba_id)) {
            return back()->withErrors(['message' => 'Connected WhatsApp Channel with active WABA ID is required to create templates.']);
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

        $payload = [
            'name' => $validated['name'],
            'language' => $validated['language'],
            'category' => $validated['category'],
            'components' => $components,
        ];

        try {
            $resp = \Illuminate\Support\Facades\Http::withToken($channel->access_token)
                ->timeout(15)
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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
            ->first();

        if ($channel) {
            \Illuminate\Support\Facades\Cache::forget("meta_templates_{$channel->waba_id}");
            $templates = app(\App\Modules\Campaigns\Http\Controllers\CampaignController::class)->getMetaTemplates($channel);
            return back()->with('success', count($templates) . ' templates synchronized from Meta WhatsApp Business Account.');
        }

        return back()->with('success', 'Templates cache refreshed.');
    })->name('templates.sync');

    Route::put('templates/{id}', function (\Illuminate\Http\Request $request, string $id) {
        $validated = $request->validate([
            'body' => 'required|string|max:1024',
            'header' => 'nullable|string|max:60',
            'footer' => 'nullable|string|max:60',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
            ->first();

        if (! $channel || empty($channel->access_token) || empty($channel->waba_id)) {
            return back()->withErrors(['message' => 'Connected WhatsApp Channel is required.']);
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

            $userMsg = $resp->json('error.error_user_msg');
            if ($userMsg && str_contains($userMsg, 'only be edited if they have been rejected')) {
                $errMsg = "Meta Policy: Approved templates cannot be modified directly in Meta to prevent disrupting live campaigns. To update this message, please create a new version (e.g. name_v2).";
            } else {
                $errMsg = $userMsg ?? $resp->json('error.message') ?? 'Meta rejected template update.';
            }
            return back()->withErrors(['message' => $errMsg]);
        } catch (\Throwable $e) {
            return back()->withErrors(['message' => 'Connection error: ' . $e->getMessage()]);
        }
    })->name('templates.update');

    Route::delete('templates/{name}', function (\Illuminate\Http\Request $request, string $name) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

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
    Route::get('analytics/meta-costs', [\App\Modules\Analytics\Http\Controllers\MetaCostAnalyticsController::class, 'index'])->name('analytics.meta-costs');

    // WhatsApp Commerce & Meta Catalog
    Route::get('commerce', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'index'])->name('commerce.index');
    Route::post('commerce/products', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'storeProduct'])->name('commerce.products.store');
    Route::put('commerce/products/{id}', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'updateProduct'])->name('commerce.products.update');
    Route::delete('commerce/products/{id}', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'deleteProduct'])->name('commerce.products.destroy');
    Route::patch('commerce/orders/{id}/status', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'updateOrderStatus'])->name('commerce.orders.status');
    Route::post('commerce/sync', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'syncCatalog'])->name('commerce.sync');
    Route::post('commerce/send-catalog', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'sendCatalogMessage'])->name('commerce.send.catalog');
    Route::post('commerce/send-product', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'sendProductMessage'])->name('commerce.send.product');
    Route::post('commerce/simulate-order', [\App\Modules\Commerce\Http\Controllers\CommerceController::class, 'simulateOrder'])->name('commerce.simulate.order');

    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
    Route::post('/workspace/store', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'store'])->name('workspace.store');
});

require __DIR__.'/settings.php';
