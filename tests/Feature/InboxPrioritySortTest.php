<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InboxPrioritySortTest extends TestCase
{
    use RefreshDatabase;

    public function test_inbox_puts_unread_and_inbound_replies_at_top(): void
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Inbox Org',
            'slug' => 'inbox-org',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        // 1. Newest outbound-only conversation (read)
        $outboundConv = Conversation::create([
            'organization_id' => $org->id,
            'contact_phone' => '+919999900001',
            'contact_name' => 'Outbound Only',
            'status' => 'open',
            'unread_count' => 0,
            'last_message_at' => now(),
        ]);
        Message::create([
            'organization_id' => $org->id,
            'conversation_id' => $outboundConv->id,
            'direction' => 'outbound',
            'sender_type' => 'agent',
            'type' => 'text',
            'content' => 'Broadcast sent',
            'status' => 'delivered',
        ]);

        // 2. Older conversation where customer replied (read, awaiting agent reply)
        $repliedReadConv = Conversation::create([
            'organization_id' => $org->id,
            'contact_phone' => '+919999900002',
            'contact_name' => 'Replied Read',
            'status' => 'open',
            'unread_count' => 0,
            'last_message_at' => now()->subMinutes(10),
        ]);
        Message::create([
            'organization_id' => $org->id,
            'conversation_id' => $repliedReadConv->id,
            'direction' => 'inbound',
            'sender_type' => 'contact',
            'type' => 'text',
            'content' => 'I have a question',
            'status' => 'received',
        ]);

        // 3. Oldest conversation with unread inbound reply
        $unreadConv = Conversation::create([
            'organization_id' => $org->id,
            'contact_phone' => '+919999900003',
            'contact_name' => 'Unread Reply',
            'status' => 'open',
            'unread_count' => 2,
            'last_message_at' => now()->subMinutes(20),
        ]);
        Message::create([
            'organization_id' => $org->id,
            'conversation_id' => $unreadConv->id,
            'direction' => 'inbound',
            'sender_type' => 'contact',
            'type' => 'text',
            'content' => 'Hello please help',
            'status' => 'received',
        ]);

        $resp = $this->actingAs($user)->getJson('/inbox/sync');
        $resp->assertOk();

        $threads = $resp->json('threads');
        $this->assertCount(3, $threads);
        $this->assertEquals('Unread Reply', $threads[0]['contactName']);
        $this->assertEquals('Replied Read', $threads[1]['contactName']);
        $this->assertEquals('Outbound Only', $threads[2]['contactName']);
    }
}
