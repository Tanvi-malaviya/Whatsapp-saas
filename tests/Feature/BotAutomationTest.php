<?php

namespace Tests\Feature;

use App\Models\KnowledgeDocument;
use App\Models\User;
use App\Modules\Bot\Models\BotFlow;
use App\Modules\Bot\Models\BotRule;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BotAutomationTest extends TestCase
{
    use RefreshDatabase;

    private function createOrgUser(): array
    {
        $user = User::factory()->create();
        $org = Organization::create([
            'name' => 'Bot Test Org',
            'slug' => 'bot-test-org',
            'subscription_plan' => 'annual',
            'status' => 'active',
        ]);
        $user->organizations()->attach($org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $org->id]);

        return [$user, $org];
    }

    public function test_bot_flow_toggle_update_delete_and_clear_all(): void
    {
        [$user, $org] = $this->createOrgUser();

        $flow = BotFlow::create([
            'organization_id' => $org->id,
            'name' => 'Welcome Menu',
            'trigger_keywords' => 'hi, menu',
            'status' => 'active',
            'greeting_message' => 'Hello! Pick an option:',
            'options' => [
                ['id' => '1', 'label' => 'Pricing', 'reply_text' => 'Starts at Rs 499', 'action_type' => 'reply'],
            ],
        ]);

        // Toggle (pause) should succeed, not 404
        $toggleResp = $this->actingAs($user)->patch("/flows/{$flow->id}/toggle");
        $toggleResp->assertRedirect();
        $this->assertEquals('draft', $flow->fresh()->status);

        // Update should succeed, not 404
        $updateResp = $this->actingAs($user)->put("/flows/{$flow->id}", [
            'name' => 'Updated Menu',
            'trigger_keywords' => 'hi, help',
            'status' => 'active',
            'greeting_message' => 'Updated greeting',
            'options' => [
                ['id' => '1', 'label' => 'Support', 'reply_text' => 'We are here', 'action_type' => 'reply'],
            ],
        ]);
        $updateResp->assertRedirect();
        $this->assertEquals('Updated Menu', $flow->fresh()->name);

        // Delete should succeed, not 404
        $deleteResp = $this->actingAs($user)->delete("/flows/{$flow->id}");
        $deleteResp->assertRedirect();
        $this->assertDatabaseMissing('bot_flows', ['id' => $flow->id]);

        // Create two flows and clear all
        BotFlow::create([
            'organization_id' => $org->id,
            'name' => 'Flow A',
            'trigger_keywords' => 'a',
            'status' => 'active',
            'greeting_message' => 'Hi A',
            'options' => [['id' => '1', 'label' => 'One', 'reply_text' => '1']],
        ]);
        BotFlow::create([
            'organization_id' => $org->id,
            'name' => 'Flow B',
            'trigger_keywords' => 'b',
            'status' => 'draft',
            'greeting_message' => 'Hi B',
            'options' => [['id' => '1', 'label' => 'Two', 'reply_text' => '2']],
        ]);

        $clearResp = $this->actingAs($user)->delete('/flows/clear-all');
        $clearResp->assertRedirect();
        $this->assertEquals(0, BotFlow::withoutGlobalScopes()->where('organization_id', $org->id)->count());
    }

    public function test_auto_responder_and_ai_agent_clear_endpoints(): void
    {
        [$user, $org] = $this->createOrgUser();

        $org->update([
            'metadata' => [
                'auto_responder' => ['welcome_enabled' => true],
                'ai_agent' => ['enabled' => true, 'model' => 'gpt-4o-mini'],
            ],
        ]);

        BotRule::create([
            'organization_id' => $org->id,
            'keywords' => 'price',
            'match_type' => 'contains',
            'reply_text' => 'Rs 999',
            'is_enabled' => true,
            'priority' => 0,
        ]);

        KnowledgeDocument::create([
            'organization_id' => $org->id,
            'name' => 'brochure.pdf',
            'size' => 1024,
            'content' => 'Sample content',
        ]);

        $this->actingAs($user)->postJson('/auto-responder/clear')->assertOk();
        $this->actingAs($user)->postJson('/ai-agent/clear')->assertOk();

        $org->refresh();
        $user->refresh();
        $this->assertArrayNotHasKey('auto_responder', $org->metadata ?? []);
        $this->assertArrayNotHasKey('ai_agent', $org->metadata ?? []);
        $this->assertEquals(0, BotRule::withoutGlobalScopes()->where('organization_id', $org->id)->count());
        $this->assertEquals(0, KnowledgeDocument::withoutGlobalScopes()->where('organization_id', $org->id)->count());

        $this->actingAs($user)->get('/auto-responder')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('hasSavedData', false));

        $this->actingAs($user)->get('/ai-agent')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('hasSavedData', false));
    }
}
