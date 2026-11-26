<?php

namespace Tests\Feature;

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
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class BroadcastTemplateMediaTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;

    private WhatsAppChannel $channel;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $user = User::factory()->create();
        $this->org = Organization::create([
            'name' => 'Media Workspace', 'slug' => 'media-workspace',
            'subscription_plan' => 'annual', 'status' => 'active',
        ]);
        $user->organizations()->attach($this->org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $this->org->id]);
        $this->actingAs($user);
        $this->channel = WhatsAppChannel::create([
            'organization_id' => $this->org->id, 'name' => 'Media Sender',
            'phone_number' => '+919898696798', 'phone_number_id' => '123456',
            'waba_id' => '654321', 'access_token' => 'test-token',
            'status' => 'connected', 'is_default' => true,
        ]);
        app(WalletService::class)->credit($this->org, 100000, 'recharge', 'paid', 'Test balance');
    }

    protected function tearDown(): void
    {
        TenantContext::clear();
        parent::tearDown();
    }

    private function template(string $format = 'IMAGE'): void
    {
        Cache::put('meta_templates_'.$this->channel->waba_id, [[
            'name' => 'media_campaign', 'language' => 'en_US', 'status' => 'APPROVED',
            'category' => 'MARKETING', 'body' => 'Hello {{1}}, offer {{2}}',
            'headerFormat' => $format, 'headerMediaId' => 'old-media',
            'components' => [
                ['type' => 'HEADER', 'format' => $format, 'text' => 'For {{1}}'],
                ['type' => 'BUTTONS', 'buttons' => [['type' => 'URL', 'text' => 'Shop', 'url' => 'https://example.com/{{1}}']]],
            ],
        ]], 300);
    }

    private function campaignData(array $overrides = []): array
    {
        return array_replace([
            'channel_id' => $this->channel->id, 'template_name' => 'media_campaign',
            'template_language' => 'en_US', 'campaign_name' => 'Media test',
            'recipients' => [['phone' => '+919999900001', 'name' => 'Customer']],
            'parameters' => ['Customer', 'SAVE20'], 'button_parameters' => ['discount'],
            'header_file' => UploadedFile::fake()->image('offer.png'),
            'consent_confirmed' => 'yes',
        ], $overrides);
    }

    private function broadcast(array $data): TestResponse
    {
        $file = $data['header_file'] ?? null;
        unset($data['header_file']);

        return $this->post('/campaigns/broadcast', [
            'campaign_data' => json_encode($data),
            'header_file' => $file,
        ], ['Accept' => 'application/json']);
    }

    public function test_uploaded_media_and_dynamic_values_are_used_when_sending(): void
    {
        $this->template();
        Http::fake([
            MetaApi::base().'/123456/media' => Http::response(['id' => 'new-media']),
            MetaApi::base().'/123456/messages' => Http::response(['messages' => [['id' => 'wamid.test']]]),
        ]);
        $this->broadcast($this->campaignData())
            ->assertOk()->assertJson(['success' => true]);
        $campaign = BroadcastCampaign::withoutGlobalScopes()->firstOrFail();
        $this->assertEquals('Hello Customer, offer SAVE20', $campaign->payload['content']);
        $components = collect($campaign->payload['template']['components']);
        $this->assertEquals('new-media', $components->firstWhere('type', 'header')['parameters'][0]['image']['id']);
        $this->assertEquals('discount', $components->firstWhere('type', 'button')['parameters'][0]['text']);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/messages')
            && $request['to'] === '919999900001'
            && collect($request['template']['components'])->firstWhere('type', 'header')['parameters'][0]['image']['id'] === 'new-media');
    }

    public function test_document_upload_preserves_filename(): void
    {
        $this->template('DOCUMENT');
        Http::fake([
            MetaApi::base().'/123456/media' => Http::response(['id' => 'pdf-media']),
            MetaApi::base().'/123456/messages' => Http::response(['messages' => [['id' => 'wamid.pdf']]]),
        ]);
        $this->broadcast($this->campaignData([
            'header_file' => UploadedFile::fake()->create('offer.pdf', 10, 'application/pdf'),
        ]))->assertOk();
        $components = collect(BroadcastCampaign::withoutGlobalScopes()->firstOrFail()->payload['template']['components']);
        $this->assertEquals(['id' => 'pdf-media', 'filename' => 'offer.pdf'], $components->firstWhere('type', 'header')['parameters'][0]['document']);
    }

    public function test_video_upload_uses_video_header(): void
    {
        $this->template('VIDEO');
        Http::fake([
            MetaApi::base().'/123456/media' => Http::response(['id' => 'video-media']),
            MetaApi::base().'/123456/messages' => Http::response(['messages' => [['id' => 'wamid.video']]]),
        ]);
        $this->broadcast($this->campaignData([
            'header_file' => UploadedFile::fake()->create('offer.mp4', 10, 'video/mp4'),
        ]))->assertOk();
        $components = collect(BroadcastCampaign::withoutGlobalScopes()->firstOrFail()->payload['template']['components']);
        $this->assertEquals(['id' => 'video-media'], $components->firstWhere('type', 'header')['parameters'][0]['video']);
    }

    public function test_multipart_campaign_preserves_large_recipient_lists(): void
    {
        Queue::fake();
        $this->template();
        Http::fake([MetaApi::base().'/123456/media' => Http::response(['id' => 'new-media'])]);
        $recipients = array_map(fn ($i) => ['phone' => sprintf('+9199%08d', $i), 'name' => 'Customer '.$i], range(1, 600));
        $this->broadcast($this->campaignData(['recipients' => $recipients]))->assertOk();
        $this->assertDatabaseCount('campaign_recipients', 600);
        $this->assertEquals(600, BroadcastCampaign::withoutGlobalScopes()->firstOrFail()->recipients_count);
        Queue::assertPushed(\App\Jobs\SendCampaignRecipient::class, 600);
    }

    public function test_wrong_media_type_and_oversized_uploads_are_rejected_before_charging(): void
    {
        $this->template();
        $before = $this->org->wallet()->first()->totalBalancePaise();
        foreach ([UploadedFile::fake()->create('offer.pdf', 10, 'application/pdf'), UploadedFile::fake()->image('large.png')->size(5121)] as $file) {
            $this->broadcast($this->campaignData(['header_file' => $file]))
                ->assertUnprocessable()->assertJsonValidationErrors('header_file');
        }
        Http::assertNothingSent();
        $this->assertDatabaseCount('broadcast_campaigns', 0);
        $this->assertEquals($before, $this->org->wallet()->first()->totalBalancePaise());
    }

    public function test_plain_text_template_rejects_attachments(): void
    {
        $this->template('TEXT');
        $this->broadcast($this->campaignData())
            ->assertUnprocessable()->assertJsonValidationErrors('header_file');
        Http::assertNothingSent();
    }

    public function test_missing_dynamic_values_are_rejected_before_upload(): void
    {
        $this->template();
        $this->broadcast($this->campaignData(['parameters' => ['Customer', '']]))
            ->assertUnprocessable()->assertJsonValidationErrors('parameters');
        Http::assertNothingSent();
        $this->assertDatabaseCount('broadcast_campaigns', 0);
    }

    public function test_failed_upload_does_not_create_campaign_or_charge_wallet(): void
    {
        $this->template();
        Http::fake([MetaApi::base().'/123456/media' => Http::response(['error' => ['message' => 'Invalid media']], 400)]);
        $before = $this->org->wallet()->first()->totalBalancePaise();
        $this->broadcast($this->campaignData())
            ->assertUnprocessable()->assertJsonValidationErrors('header_file');
        $this->assertDatabaseCount('broadcast_campaigns', 0);
        $this->assertEquals($before, $this->org->wallet()->first()->totalBalancePaise());
    }
}
