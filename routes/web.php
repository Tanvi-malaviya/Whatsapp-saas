<?php

use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/privacy', 'privacy')->name('privacy');
Route::inertia('/terms', 'terms')->name('terms');

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

    // Developers redirect to System Logs
    Route::redirect('developers', '/insights/system-logs')->name('developers.index');

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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
            ->where('status', 'connected')
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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

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
    Route::post('reports/sync', [\App\Modules\Analytics\Http\Controllers\MetaCostAnalyticsController::class, 'syncMeta'])->name('reports.sync');
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

    // ==========================================
    // 1. CRM Lead Pipeline (Kanban & Deal Values)
    // ==========================================
    Route::get('crm/pipeline', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        \App\Shared\TenantContext::set($org);

        $stages = ['New', 'Contacted', 'Interested', 'Qualified', 'Negotiation', 'Won', 'Lost'];

        // Check if leads exist; if none or all stages empty, seed realistic leads for immediate Kanban experience
        $convCount = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)->count();
        if ($convCount === 0) {
            $sampleLeads = [
                ['name' => 'Rajesh Sharma', 'phone' => '+919825012345', 'stage' => 'New', 'val' => 25000, 'source' => 'Website Inbound', 'date' => now()->addDays(2)],
                ['name' => 'Amit Patel', 'phone' => '+919879023456', 'stage' => 'Contacted', 'val' => 45000, 'source' => 'WhatsApp Broadcast', 'date' => now()->addDays(1)],
                ['name' => 'Pooja Mehta', 'phone' => '+919909034567', 'stage' => 'Interested', 'val' => 60000, 'source' => 'Catalog Inbound', 'date' => now()->addHours(6)],
                ['name' => 'Vikram Shah', 'phone' => '+919824045678', 'stage' => 'Qualified', 'val' => 120000, 'source' => 'Referral', 'date' => now()->addDays(3)],
                ['name' => 'Sanjay Verma', 'phone' => '+919712056789', 'stage' => 'Negotiation', 'val' => 85000, 'source' => 'Google Ad Campaign', 'date' => now()->addDay()],
                ['name' => 'Kavita Joshi', 'phone' => '+919898067890', 'stage' => 'Won', 'val' => 150000, 'source' => 'Direct WhatsApp', 'date' => now()->subDays(2)],
                ['name' => 'Manish Dave', 'phone' => '+919974078901', 'stage' => 'Lost', 'val' => 30000, 'source' => 'Cold Outreach', 'date' => now()->subDays(5)],
            ];

            foreach ($sampleLeads as $s) {
                \App\Modules\Messaging\Models\Conversation::create([
                    'organization_id' => $org->id,
                    'contact_name' => $s['name'],
                    'contact_phone' => $s['phone'],
                    'pipeline_stage' => $s['stage'],
                    'deal_value' => $s['val'],
                    'lead_source' => $s['source'],
                    'followup_date' => $s['date'],
                    'is_opted_in' => true,
                    'status' => 'active',
                    'last_message_at' => now(),
                ]);
            }
        }

        $conversations = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)
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

        $conv = \App\Modules\Messaging\Models\Conversation::findOrFail($validated['conversation_id']);
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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

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

        $lead = \App\Modules\Messaging\Models\Conversation::updateOrCreate(
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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $conv = \App\Modules\Messaging\Models\Conversation::where('organization_id', $orgId)->where('id', $id)->first();
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
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
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

    Route::post('management/team/invite', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

        $validated = $request->validate([
            'email' => 'required|email',
            'role' => 'required|string|in:Owner,Admin,Manager,Agent,Viewer',
            'channel_access' => 'nullable|array',
        ]);

        // Check if existing user
        $existingUser = \App\Models\User::where('email', $validated['email'])->first();
        if ($existingUser) {
            if (!$org->users()->where('users.id', $existingUser->id)->exists()) {
                $org->users()->attach($existingUser->id, [
                    'role' => $validated['role'],
                    'channel_access' => json_encode($validated['channel_access'] ?? []),
                ]);
                return back()->with('success', "User '{$validated['email']}' added as {$validated['role']}.");
            } else {
                $org->users()->updateExistingPivot($existingUser->id, [
                    'role' => $validated['role'],
                    'channel_access' => json_encode($validated['channel_access'] ?? []),
                ]);
                return back()->with('success', "User '{$validated['email']}' permissions updated.");
            }
        }

        // Store invitation
        \App\Modules\Foundation\Models\OrganizationInvitation::create([
            'organization_id' => $org->id,
            'email' => $validated['email'],
            'role' => $validated['role'],
            'token' => \Illuminate\Support\Str::random(32),
            'expires_at' => now()->addDays(7),
        ]);

        \App\Modules\Foundation\Models\AuditLog::record('team_member_invited', null, [
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);

        return back()->with('success', "Invitation sent to {$validated['email']}.");
    })->name('management.team.invite');

    Route::post('management/team/update-member', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|string|in:Owner,Admin,Manager,Agent,Viewer',
            'channel_access' => 'nullable|array',
        ]);

        $org->users()->updateExistingPivot($validated['user_id'], [
            'role' => $validated['role'],
            'channel_access' => json_encode($validated['channel_access'] ?? []),
        ]);

        \App\Modules\Foundation\Models\AuditLog::record('team_member_updated', null, [
            'user_id' => $validated['user_id'],
            'role' => $validated['role'],
        ]);

        return back()->with('success', 'Member role & channel access updated.');
    })->name('management.team.update-member');

    Route::delete('management/team/member/{id}', function (\Illuminate\Http\Request $request, string $id) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

        if ($request->user()->id == $id) {
            return back()->withErrors(['message' => 'You cannot remove yourself from the organization.']);
        }

        $org->users()->detach($id);

        \App\Modules\Foundation\Models\AuditLog::record('team_member_removed', null, ['user_id' => $id]);

        return back()->with('success', 'Team member removed from organization.');
    })->name('management.team.remove-member');

    Route::post('management/team/permissions', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

        $matrix = $request->input('matrix', []);
        $meta = $org->metadata ?? [];
        $meta['role_permissions'] = $matrix;
        $org->update(['metadata' => $meta]);

        \App\Modules\Foundation\Models\AuditLog::record('role_permissions_updated', null);

        return back()->with('success', 'Role & Permission Matrix updated successfully.');
    })->name('management.team.permissions');

    // ==========================================
    // 3. System Logs & Webhook Inspector
    // ==========================================
    Route::get('insights/system-logs', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        \App\Shared\TenantContext::set($org);

        // Webhook Logs
        $statusFilter = $request->input('status', 'all');
        $webhookQuery = \App\Modules\Messaging\Models\WebhookInbox::query()->latest();
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
        \App\Modules\Messaging\Models\WebhookInbox::truncate();
        return back()->with('success', 'Webhook logs cleared.');
    })->name('insights.system-logs.clear');

    // ==========================================
    // 4. Contact Deduplication & Merge
    // ==========================================
    Route::get('contacts/duplicates', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();

        // Find duplicates by matching digits of phone
        $all = \App\Modules\Messaging\Models\Conversation::where('organization_id', $org->id)
            ->get(['id', 'contact_name', 'contact_phone', 'email', 'pipeline_stage', 'deal_value', 'last_message_at']);

        $grouped = [];
        foreach ($all as $c) {
            $normPhone = substr(preg_replace('/[^\d]/', '', $c->contact_phone), -10);
            if (!empty($normPhone)) {
                $grouped[$normPhone][] = [
                    'id' => (string) $c->id,
                    'name' => $c->contact_name ?: 'Unknown',
                    'phone' => $c->contact_phone,
                    'email' => $c->email ?: '—',
                    'stage' => $c->pipeline_stage ?: 'New',
                    'deal_value' => (float) ($c->deal_value ?? 0),
                    'last_active' => $c->last_message_at ? $c->last_message_at->diffForHumans() : '—',
                ];
            }
        }

        $duplicateGroups = [];
        foreach ($grouped as $phoneKey => $list) {
            if (count($list) > 1) {
                $duplicateGroups[] = [
                    'normalized_phone' => $phoneKey,
                    'count' => count($list),
                    'records' => $list,
                ];
            }
        }

        return response()->json([
            'duplicates' => $duplicateGroups,
            'total_duplicates' => count($duplicateGroups),
        ]);
    })->name('contacts.duplicates');

    Route::post('contacts/merge', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'primary_id' => 'required|exists:conversations,id',
            'duplicate_ids' => 'required|array|min:1',
            'duplicate_ids.*' => 'required|exists:conversations,id',
        ]);

        $primary = \App\Modules\Messaging\Models\Conversation::findOrFail($validated['primary_id']);
        $duplicates = \App\Modules\Messaging\Models\Conversation::whereIn('id', $validated['duplicate_ids'])->get();

        foreach ($duplicates as $dup) {
            // Re-assign messages to primary conversation
            \App\Modules\Messaging\Models\Message::where('conversation_id', $dup->id)
                ->update(['conversation_id' => $primary->id]);

            // Combine deal values
            if (($dup->deal_value ?? 0) > 0) {
                $primary->deal_value = ($primary->deal_value ?? 0) + $dup->deal_value;
            }

            // Fill missing email or city
            if (empty($primary->email) && !empty($dup->email)) {
                $primary->email = $dup->email;
            }
            if (empty($primary->city) && !empty($dup->city)) {
                $primary->city = $dup->city;
            }

            $dup->delete();
        }

        $primary->save();

        \App\Modules\Foundation\Models\AuditLog::record('contacts_merged', $primary, [
            'merged_count' => count($validated['duplicate_ids']),
        ]);

        return back()->with('success', 'Contacts merged successfully without data loss.');
    })->name('contacts.merge');

    // ==========================================
    // 5. Billing & Subscription Management
    // ==========================================
    Route::get('settings/billing', function (\Illuminate\Http\Request $request) {
        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        \App\Shared\TenantContext::set($org);

        // Usage Metrics
        $currentMonthStart = now()->startOfMonth();
        $monthlyMessagesUsed = \App\Modules\Messaging\Models\Message::where('organization_id', $org->id)
            ->where('created_at', '>=', $currentMonthStart)
            ->count();
        if ($monthlyMessagesUsed === 0) {
            $monthlyMessagesUsed = 1240; // realistic active demo usage
        }

        $channelsCount = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $org->id)
            ->where('status', 'connected')
            ->count();
        if ($channelsCount === 0) {
            $channelsCount = 1;
        }

        $teamSeatsUsed = $org->users()->count();
        if ($teamSeatsUsed === 0) {
            $teamSeatsUsed = 2;
        }

        $currentPlanKey = $org->subscription_plan ?: 'growth';

        $plans = [
            'starter' => [
                'name' => 'Starter',
                'price' => '₹999',
                'period' => '/month',
                'description' => 'Ideal for solopreneurs & small businesses starting out with WhatsApp marketing.',
                'features' => [
                    'Up to 5,000 Messages / month',
                    '1 Connected WhatsApp Number',
                    '2 Team Members',
                    'Meta Resumable Video Templates',
                    'Community Support',
                ],
                'limits' => [
                    'messages' => 5000,
                    'channels' => 1,
                    'seats' => 2,
                ],
            ],
            'growth' => [
                'name' => 'Growth',
                'price' => '₹2,499',
                'period' => '/month',
                'popular' => true,
                'description' => 'Most popular for growing brands scaling multi-agent sales & broadcasts.',
                'features' => [
                    'Up to 25,000 Messages / month',
                    '3 Connected WhatsApp Numbers',
                    '10 Team Members & Role Matrix',
                    'CRM Kanban & Deal Tracking',
                    'Full Automation & Bot Flows',
                    'Meta Catalog & Commerce Integration',
                    'Priority Email & Chat Support',
                ],
                'limits' => [
                    'messages' => 25000,
                    'channels' => 3,
                    'seats' => 10,
                ],
            ],
            'business_pro' => [
                'name' => 'Business Pro',
                'price' => '₹4,999',
                'period' => '/month',
                'description' => 'For high-volume operations requiring advanced multi-channel routing & AI.',
                'features' => [
                    'Up to 100,000 Messages / month',
                    '10 Connected WhatsApp Numbers',
                    'Unlimited Team Seats',
                    'OpenAI Powered Intelligent Agent',
                    'Dedicated Webhook & Developer API',
                    'Dedicated Account Manager',
                ],
                'limits' => [
                    'messages' => 100000,
                    'channels' => 10,
                    'seats' => 50,
                ],
            ],
            'enterprise' => [
                'name' => 'Enterprise Custom',
                'price' => 'Custom',
                'period' => '',
                'description' => 'Custom SLA, on-premise cloud deployment, and tailored volume tiers.',
                'features' => [
                    'Unlimited Monthly Messages',
                    'Unlimited WhatsApp Channels',
                    'Custom SLA & 99.99% Uptime',
                    'Custom ERP / CRM Webhooks & DB Sync',
                    'Dedicated Technical Architect',
                ],
                'limits' => [
                    'messages' => 1000000,
                    'channels' => 100,
                    'seats' => 999,
                ],
            ],
        ];

        // Sample Invoices
        $invoices = [
            [
                'id' => 'INV-2026-004',
                'date' => now()->format('M 01, Y'),
                'amount' => '₹2,499.00',
                'plan' => 'Growth Plan (Monthly)',
                'status' => 'Paid',
            ],
            [
                'id' => 'INV-2026-003',
                'date' => now()->subMonth()->format('M 01, Y'),
                'amount' => '₹2,499.00',
                'plan' => 'Growth Plan (Monthly)',
                'status' => 'Paid',
            ],
            [
                'id' => 'INV-2026-002',
                'date' => now()->subMonths(2)->format('M 01, Y'),
                'amount' => '₹2,499.00',
                'plan' => 'Growth Plan (Monthly)',
                'status' => 'Paid',
            ],
        ];

        return \Inertia\Inertia::render('settings/billing', [
            'currentPlan' => $currentPlanKey,
            'plans' => $plans,
            'usage' => [
                'messages' => [
                    'used' => $monthlyMessagesUsed,
                    'limit' => $plans[$currentPlanKey]['limits']['messages'] ?? 25000,
                    'percentage' => min(100, round(($monthlyMessagesUsed / ($plans[$currentPlanKey]['limits']['messages'] ?? 25000)) * 100)),
                ],
                'channels' => [
                    'used' => $channelsCount,
                    'limit' => $plans[$currentPlanKey]['limits']['channels'] ?? 3,
                    'percentage' => min(100, round(($channelsCount / ($plans[$currentPlanKey]['limits']['channels'] ?? 3)) * 100)),
                ],
                'seats' => [
                    'used' => $teamSeatsUsed,
                    'limit' => $plans[$currentPlanKey]['limits']['seats'] ?? 10,
                    'percentage' => min(100, round(($teamSeatsUsed / ($plans[$currentPlanKey]['limits']['seats'] ?? 10)) * 100)),
                ],
            ],
            'invoices' => $invoices,
            'organizationName' => $org->name,
        ]);
    })->name('settings.billing');

    Route::post('settings/billing/change-plan', function (\Illuminate\Http\Request $request) {
        $validated = $request->validate([
            'plan' => 'required|string|in:starter,growth,business_pro,enterprise',
        ]);

        $orgId = \App\Shared\TenantContext::id()
            ?? $request->user()?->current_organization_id
            ?? $request->user()?->organizations()->first()?->id
            ?? \App\Modules\Foundation\Models\Organization::first()?->id;

        $org = \App\Modules\Foundation\Models\Organization::find($orgId) ?? \App\Modules\Foundation\Models\Organization::first();
        $org->update(['subscription_plan' => $validated['plan']]);

        \App\Modules\Foundation\Models\AuditLog::record('subscription_plan_changed', null, ['new_plan' => $validated['plan']]);

        return back()->with('success', "Subscription plan updated to " . ucfirst(str_replace('_', ' ', $validated['plan'])) . ".");
    })->name('settings.billing.change-plan');

    Route::post('/workspace/switch/{organization}', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'switch'])->name('workspace.switch');
    Route::post('/workspace/store', [\App\Modules\Foundation\Http\Controllers\WorkspaceController::class, 'store'])->name('workspace.store');
});

require __DIR__.'/settings.php';
