<?php

namespace Tests\Feature\Messaging;

use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\Messaging\Models\WebhookInbox;
use App\Modules\MetaConnection\Http\Controllers\MetaWebhookController;
use App\Modules\MetaConnection\Models\WhatsAppChannel;
use App\Services\MetaApi;
use App\Shared\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class InboxSendTest extends TestCase
{
    use RefreshDatabase;

    private Organization $org;

    private WhatsAppChannel $channel;

    private Conversation $conversation;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        $user = User::factory()->create();
        $this->org = Organization::create(['name' => 'Inbox Workspace', 'slug' => 'inbox-send', 'status' => 'active', 'subscription_plan' => 'annual']);
        $user->organizations()->attach($this->org->id, ['role' => 'Owner']);
        $user->update(['current_organization_id' => $this->org->id]);
        $this->actingAs($user);
        $this->channel = WhatsAppChannel::create([
            'organization_id' => $this->org->id, 'name' => 'Inbox Sender', 'phone_number' => '+919898696798',
            'phone_number_id' => '123456', 'waba_id' => '654321', 'access_token' => 'test-token', 'status' => 'connected',
        ]);
        $this->conversation = Conversation::create([
            'organization_id' => $this->org->id, 'channel_id' => $this->channel->id,
            'channel_phone_number_id' => '123456', 'contact_phone' => '+919999900001', 'contact_name' => 'Alice',
            'status' => 'open', 'is_opted_in' => true, 'window_expires_at' => now()->addHours(24),
        ]);
    }

    protected function tearDown(): void
    {
        TenantContext::clear();
        parent::tearDown();
    }

    private function template(string $format): void
    {
        Cache::put('meta_templates_654321', [[
            'name' => 'offer', 'language' => 'en_US', 'status' => 'APPROVED', 'body' => 'Hello {{1}}',
            'headerFormat' => $format, 'headerMediaId' => 'saved-media',
            'components' => [['type' => 'HEADER', 'format' => $format, 'text' => 'For {{1}}']],
        ]], 300);
    }

    private function templateData(array $extra = []): array
    {
        return array_replace([
            'conversation_id' => $this->conversation->id, 'type' => 'template',
            'template_name' => 'offer', 'template_language' => 'en_US', 'parameters' => ['Alice'],
        ], $extra);
    }

    public function test_text_failure_keeps_message_with_actual_meta_details_and_sync_reason(): void
    {
        Http::fake([MetaApi::base().'/123456/messages' => Http::response(['error' => [
            'code' => 131026, 'message' => 'Message undeliverable', 'error_data' => ['details' => 'Recipient is not on WhatsApp.'],
        ]], 400)]);
        $response = $this->postJson('/inbox/reply', ['conversation_id' => $this->conversation->id, 'message' => 'Hello Alice']);
        $response->assertUnprocessable()->assertJsonPath('success', false)->assertJsonPath('chat_message.status', 'failed');
        $reason = $response->json('chat_message.failureReason');
        $this->assertStringContainsString('[Meta #131026]', $reason);
        $this->assertStringContainsString('Recipient is not on WhatsApp.', $reason);
        $message = Message::firstOrFail();
        $this->assertEquals('Hello Alice', $message->content);
        $this->assertEquals($reason, $message->metadata['failure_reason']);
        $this->getJson('/inbox/sync')->assertOk()->assertJsonPath('threads.0.messages.0.failureReason', $reason);
    }

    public function test_closed_window_rejection_stays_in_chat_without_sending(): void
    {
        $this->conversation->update(['window_expires_at' => now()->subHour()]);
        $this->postJson('/inbox/reply', ['conversation_id' => $this->conversation->id, 'message' => 'Hello'])
            ->assertUnprocessable()->assertJsonPath('chat_message.status', 'failed')
            ->assertJsonPath('chat_message.failureReason', 'The customer-service window is closed. Send an approved template.');
        Http::assertNothingSent();
        $this->assertDatabaseHas('messages', ['content' => 'Hello', 'status' => 'failed']);
    }

    public function test_success_returns_sent_message(): void
    {
        Http::fake([MetaApi::base().'/123456/messages' => Http::response(['messages' => [['id' => 'wamid.text']]])]);
        $this->postJson('/inbox/reply', ['conversation_id' => $this->conversation->id, 'message' => 'Hello'])
            ->assertOk()->assertJsonPath('message.status', 'sent')->assertJsonPath('message.failureReason', null);
        $this->assertDatabaseHas('messages', ['content' => 'Hello', 'status' => 'sent', 'wamid' => 'wamid.text']);
    }

    public static function headerFormats(): array
    {
        return [
            ['IMAGE', 'offer.png', 'image/png'],
            ['VIDEO', 'offer.mp4', 'video/mp4'],
            ['DOCUMENT', 'offer.pdf', 'application/pdf'],
        ];
    }

    #[DataProvider('headerFormats')]
    public function test_media_headers_are_uploaded_and_used(string $format, string $filename, string $mime): void
    {
        $this->template($format);
        Http::fake([
            MetaApi::base().'/123456/media' => Http::response(['id' => 'new-'.$format]),
            MetaApi::base().'/123456/messages' => Http::response(['messages' => [['id' => 'wamid.'.$format]]]),
        ]);
        $file = $format === 'IMAGE' ? UploadedFile::fake()->image($filename) : UploadedFile::fake()->create($filename, 10, $mime);
        $this->post('/inbox/reply', $this->templateData(['header_file' => $file]), ['Accept' => 'application/json'])
            ->assertOk()->assertJsonPath('message.text', 'Hello Alice');
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/messages')
            && collect($request['template']['components'])->firstWhere('type', 'header')['parameters'][0][strtolower($format)]['id'] === 'new-'.$format);
    }

    public function test_header_upload_failure_is_saved_with_meta_error(): void
    {
        $this->template('IMAGE');
        Http::fake([MetaApi::base().'/123456/media' => Http::response(['error' => [
            'code' => 100, 'message' => 'Invalid media', 'error_data' => ['details' => 'Image is corrupted.'],
        ]], 400)]);
        $response = $this->post('/inbox/reply', $this->templateData(['header_file' => UploadedFile::fake()->image('offer.png')]), ['Accept' => 'application/json']);
        $response->assertUnprocessable()->assertJsonPath('chat_message.status', 'failed');
        $this->assertStringContainsString('Image is corrupted.', $response->json('chat_message.failureReason'));
        $this->assertDatabaseHas('messages', ['status' => 'failed', 'content' => 'Hello Alice']);
        Http::assertSentCount(1);
    }

    public function test_wrong_header_file_type_is_saved_as_failed_without_upload(): void
    {
        $this->template('IMAGE');
        $this->post('/inbox/reply', $this->templateData(['header_file' => UploadedFile::fake()->create('offer.pdf', 10, 'application/pdf')]), ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonPath('chat_message.status', 'failed');
        Http::assertNothingSent();
    }

    public function test_text_header_variables_are_used(): void
    {
        $this->template('TEXT');
        Http::fake([MetaApi::base().'/123456/messages' => Http::response(['messages' => [['id' => 'wamid.header']]])]);
        $this->postJson('/inbox/reply', $this->templateData(['header_parameters' => ['Customer']]))->assertOk();
        Http::assertSent(fn ($request) => collect($request['template']['components'])->firstWhere('type', 'header')['parameters'][0]['text'] === 'Customer');
    }

    public function test_later_delivery_failure_preserves_actual_provider_details(): void
    {
        $message = Message::create([
            'organization_id' => $this->org->id, 'conversation_id' => $this->conversation->id,
            'direction' => 'outbound', 'sender_type' => 'agent', 'type' => 'text', 'content' => 'Hello',
            'status' => 'sent', 'wamid' => 'wamid.later',
        ]);
        $record = WebhookInbox::create([
            'provider' => 'meta', 'organization_id' => $this->org->id, 'phone_number_id' => '123456', 'status' => 'pending',
            'payload' => ['value' => ['statuses' => [[
                'id' => 'wamid.later', 'status' => 'failed',
                'errors' => [['code' => 131026, 'message' => 'Message undeliverable', 'error_data' => ['details' => 'Provider-specific failure detail.']]],
            ]]]],
        ]);
        app(MetaWebhookController::class)->process($record->id);
        $this->assertEquals('failed', $message->fresh()->status);
        $this->assertStringContainsString('Provider-specific failure detail.', $message->fresh()->metadata['failure_reason']);
        $this->getJson('/inbox/sync')->assertOk()->assertJsonPath('threads.0.messages.0.status', 'failed');
    }

    public function test_connection_failure_keeps_the_attempted_message(): void
    {
        Http::fake(fn () => throw new ConnectionException('Connection timed out'));
        $response = $this->postJson('/inbox/reply', ['conversation_id' => $this->conversation->id, 'message' => 'Hello']);
        $response->assertUnprocessable()->assertJsonPath('chat_message.status', 'failed');
        $this->assertStringContainsString('Connection timed out', $response->json('chat_message.failureReason'));
    }

    public function test_new_conversation_does_not_report_success_after_send_failure(): void
    {
        Http::fake([MetaApi::base().'/123456/messages' => Http::response(['error' => ['code' => 100, 'message' => 'Template rejected']], 400)]);
        $this->template('IMAGE');
        $this->postJson('/inbox/new-chat', [
            'channel_id' => $this->channel->id, 'phone' => '+919999900002', 'name' => 'Bob', 'consent_confirmed' => true,
            'type' => 'template', 'template_name' => 'offer', 'template_language' => 'en_US', 'parameters' => ['Bob'],
        ])->assertUnprocessable()->assertJsonPath('success', false)->assertJsonPath('chat_message.status', 'failed');
    }
}
