<?php

namespace Tests\Feature;

use App\Jobs\SendCampaignRecipient;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Modules\Campaigns\Models\BroadcastCampaign;
use App\Modules\Foundation\Models\Organization;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\MetaApi;
use App\Services\WalletService;
use App\Shared\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class CampaignBatchingTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;

    private WhatsAppChannel $channel;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(now()->startOfSecond());
        Queue::fake();
        Http::preventStrayRequests();
        $user = User::factory()->create();
        $this->org = Organization::create(['name' => 'Batch Workspace', 'slug' => 'batch-tests', 'status' => 'active', 'subscription_plan' => 'annual']);
        $user->organizations()->attach($this->org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $this->org->id]);
        $this->actingAs($user);
        $this->channel = WhatsAppChannel::create([
            'organization_id' => $this->org->id, 'name' => 'Batch Sender', 'phone_number' => '+919898696798',
            'phone_number_id' => '123456', 'waba_id' => '654321', 'access_token' => 'test-token', 'status' => 'connected',
        ]);
        app(WalletService::class)->credit($this->org, 1000000, 'recharge', 'paid', 'Test balance');
        PlatformSetting::write('campaign_max_contacts', '2000');
        Cache::put('meta_templates_654321', [[
            'name' => 'offer', 'language' => 'en_US', 'status' => 'APPROVED', 'category' => 'MARKETING',
            'body' => 'Hello {{1}}', 'headerFormat' => 'IMAGE', 'headerMediaId' => 'saved-media',
        ]], 300);
        $this->tier('TIER_2K');
    }

    protected function tearDown(): void
    {
        TenantContext::clear();
        parent::tearDown();
    }

    private function tier(string $tier): void
    {
        Cache::put('campaign_tier_'.$this->channel->id, ['tier' => $tier, 'checked_at' => now()->toIso8601String()], 300);
    }

    private function data(int $count, int $start = 1): array
    {
        return [
            'channel_id' => $this->channel->id, 'template_name' => 'offer', 'template_language' => 'en_US',
            'campaign_name' => 'Summer Offer', 'parameters' => ['Customer'], 'header_url' => 'https://example.com/offer.png',
            'recipients' => array_map(fn ($i) => ['phone' => sprintf('+9199%08d', $i), 'name' => 'Customer '.$i], range($start, $start + $count - 1)),
        ];
    }

    public function test_3000_recipients_create_2000_and_1000_with_same_details_and_separate_wallet_charges(): void
    {
        $response = $this->postJson('/campaigns/broadcast', $this->data(3000));
        $response->assertOk()->assertJsonPath('campaigns_count', 2);
        $first = BroadcastCampaign::findOrFail($response->json('campaigns.0.id'));
        $second = BroadcastCampaign::findOrFail($response->json('campaigns.1.id'));
        $this->assertEquals([2000, 1000], [$first->recipients_count, $second->recipients_count]);
        $this->assertEquals(['Summer Offer (1/2)', 'Summer Offer (2/2)'], [$first->name, $second->name]);
        $this->assertEquals($first->payload['template'], $second->payload['template']);
        $this->assertEquals($first->parameters, $second->parameters);
        $this->assertEquals($first->channel_id, $second->channel_id);
        $this->assertEquals([176000, 88000], [$first->cost_paise, $second->cost_paise]);
        $this->assertEquals(736000, $this->org->wallet()->first()->totalBalancePaise());
        $this->assertEquals('scheduled', $second->status);
        $this->assertTrue($second->scheduled_at->gte(now()->addDay()));
        $this->assertDatabaseCount('campaign_recipients', 3000);
        Queue::assertPushed(SendCampaignRecipient::class, 3000);
        Queue::assertPushed(SendCampaignRecipient::class, fn ($job) => $job->delay?->equalTo($second->scheduled_at));
    }

    public function test_app_batch_limit_does_not_add_a_day_when_meta_tier_has_room(): void
    {
        $this->tier('TIER_10K');
        $response = $this->postJson('/campaigns/broadcast', $this->data(3000));
        $response->assertOk()->assertJsonPath('campaigns_count', 2);
        foreach ($response->json('campaigns') as $batch) {
            $this->assertEquals('queued', $batch['status']);
            $this->assertTrue(BroadcastCampaign::findOrFail($batch['id'])->scheduled_at->equalTo(now()));
        }
    }

    public function test_current_meta_field_controls_batch_size(): void
    {
        Cache::forget('campaign_tier_'.$this->channel->id);
        Http::fake([MetaApi::base().'/123456*' => Http::response(['whatsapp_business_manager_messaging_limit' => 'TIER_250'])]);
        $this->postJson('/campaigns/broadcast', $this->data(600))->assertOk()
            ->assertJsonPath('campaigns_count', 3)->assertJsonPath('messaging_limits.batchLimit', 250)
            ->assertJsonPath('messaging_limits.source', 'meta');
        Http::assertSent(fn ($request) => $request['fields'] === 'whatsapp_business_manager_messaging_limit');
        $this->assertEquals('TIER_250', $this->channel->fresh()->messaging_limit);
    }

    public function test_separate_submissions_reserve_shared_workspace_allowance(): void
    {
        $this->postJson('/campaigns/broadcast', $this->data(2000))->assertOk();
        $response = $this->postJson('/campaigns/broadcast', $this->data(1000, 2001));
        $response->assertOk()->assertJsonPath('campaigns.0.status', 'scheduled');
        $this->assertTrue(BroadcastCampaign::findOrFail($response->json('campaign_id'))->scheduled_at->gte(now()->addDay()));
    }

    public function test_future_batch_cannot_be_sent_early_by_resume_or_direct_job_execution(): void
    {
        $response = $this->postJson('/campaigns/broadcast', $this->data(3000));
        $id = $response->json('campaigns.1.id');
        $this->postJson('/campaigns/'.$id.'/pause')->assertOk();
        $this->postJson('/campaigns/'.$id.'/resume')->assertOk();
        $recipientId = DB::table('campaign_recipients')->where('campaign_id', $id)->value('id');
        (new SendCampaignRecipient($recipientId))->handle(app(MetaApi::class));
        Http::assertNothingSent();
        $this->assertEquals('queued', DB::table('campaign_recipients')->where('id', $recipientId)->value('status'));
        $this->assertEquals('scheduled', BroadcastCampaign::findOrFail($id)->status);
    }

    public function test_insufficient_total_balance_creates_no_batches(): void
    {
        $this->org->wallet()->first()->update(['paid_balance_paise' => 200000, 'promotional_balance_paise' => 0]);
        $this->postJson('/campaigns/broadcast', $this->data(3000))->assertUnprocessable();
        $this->assertDatabaseCount('broadcast_campaigns', 0);
        $this->assertDatabaseCount('campaign_recipients', 0);
        Queue::assertNothingPushed();
    }

    public function test_duplicate_numbers_do_not_create_extra_batches_or_charges(): void
    {
        $data = $this->data(2000);
        $data['recipients'][] = $data['recipients'][0];
        $this->postJson('/campaigns/broadcast', $data)->assertOk()->assertJsonPath('campaigns_count', 1);
        $this->assertDatabaseCount('campaign_recipients', 2000);
        $this->assertEquals(824000, $this->org->wallet()->first()->totalBalancePaise());
    }

    public function test_media_is_uploaded_once_and_reused_in_all_batches(): void
    {
        Http::fake([MetaApi::base().'/123456/media' => Http::response(['id' => 'new-media'])]);
        $data = $this->data(3000);
        unset($data['header_url']);
        $response = $this->post('/campaigns/broadcast', ['campaign_data' => json_encode($data), 'header_file' => UploadedFile::fake()->image('offer.png')], ['Accept' => 'application/json']);
        $response->assertOk()->assertJsonPath('campaigns_count', 2);
        foreach ($response->json('campaigns') as $batch) {
            $components = collect(BroadcastCampaign::findOrFail($batch['id'])->payload['template']['components']);
            $this->assertEquals('new-media', $components->firstWhere('type', 'header')['parameters'][0]['image']['id']);
        }
        Http::assertSentCount(1);
    }

    public function test_late_first_batch_delays_next_batch_using_actual_activity(): void
    {
        $response = $this->postJson('/campaigns/broadcast', $this->data(3000));
        $firstId = $response->json('campaigns.0.id');
        $secondId = $response->json('campaigns.1.id');
        $actualSend = now()->addHours(4);
        DB::table('campaign_recipients')->where('campaign_id', $firstId)->update(['status' => 'sent', 'updated_at' => $actualSend]);
        $this->travelTo(now()->addDay()->addMinute());
        $recipientId = DB::table('campaign_recipients')->where('campaign_id', $secondId)->value('id');
        (new SendCampaignRecipient($recipientId))->handle(app(MetaApi::class));
        Http::assertNothingSent();
        $second = BroadcastCampaign::findOrFail($secondId);
        $this->assertTrue($second->scheduled_at->gt($actualSend->addDay()));
        $this->assertEquals('queued', DB::table('campaign_recipients')->where('id', $recipientId)->value('status'));
    }

    public function test_cancelling_scheduled_batch_refunds_only_its_recipients(): void
    {
        $response = $this->postJson('/campaigns/broadcast', $this->data(3000));
        $firstId = $response->json('campaigns.0.id');
        $secondId = $response->json('campaigns.1.id');
        $this->postJson('/campaigns/'.$secondId.'/cancel')->assertOk();
        $this->assertEquals(824000, $this->org->wallet()->first()->totalBalancePaise());
        $this->assertEquals(1000, DB::table('campaign_recipients')->where('campaign_id', $secondId)->where('status', 'cancelled')->count());
        $this->assertEquals('queued', BroadcastCampaign::findOrFail($firstId)->status);
    }

    public function test_failed_second_charge_rolls_back_all_batches_and_first_charge(): void
    {
        $realService = app(WalletService::class);
        $calls = 0;
        $this->partialMock(WalletService::class, function ($mock) use ($realService, &$calls) {
            $mock->shouldReceive('debit')->twice()->andReturnUsing(function (...$arguments) use ($realService, &$calls) {
                if (++$calls === 2) {
                    throw new \RuntimeException('Simulated billing failure');
                }

                return $realService->debit(...$arguments);
            });
        });
        $this->postJson('/campaigns/broadcast', $this->data(3000))->assertServerError();
        $this->assertDatabaseCount('broadcast_campaigns', 0);
        $this->assertEquals(1000000, $this->org->wallet()->first()->totalBalancePaise());
        Queue::assertNothingPushed();
    }
}
