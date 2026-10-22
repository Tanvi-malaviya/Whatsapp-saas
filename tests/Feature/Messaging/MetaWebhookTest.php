<?php

use App\Modules\Bot\Models\BotRule;
use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use App\Modules\Messaging\Models\Message;
use App\Modules\Messaging\Models\WebhookInbox;

test('meta webhook verification responds with challenge code when token matches', function () {
    $challenge = 'challenge_test_code_998877';

    $response = $this->get('/webhooks/meta?' . http_build_query([
        'hub_mode' => 'subscribe',
        'hub_verify_token' => 'sathwara_secret_token_123',
        'hub_challenge' => $challenge,
    ]));

    $response->assertOk();
    $response->assertSee($challenge);
});

test('meta webhook rejects invalid verify token with 403', function () {
    $response = $this->get('/webhooks/meta?' . http_build_query([
        'hub_mode' => 'subscribe',
        'hub_verify_token' => 'wrong_token',
        'hub_challenge' => '123',
    ]));

    $response->assertForbidden();
});

test('meta incoming message creates conversation, records 24h window, and replies with bot rule', function () {
    // 1. Prepare organization
    $org = Organization::create([
        'name' => 'Sathwara InfoTech',
        'slug' => 'sathwara-test-' . uniqid(),
        'timezone' => 'Asia/Kolkata',
    ]);

    // 2. Prepare a bot rule for "fees"
    BotRule::create([
        'organization_id' => $org->id,
        'keywords' => 'fees, price, cost',
        'reply_text' => 'Our Bot Starter package is ₹2,999 one-time setup + ₹999/month.',
        'match_type' => 'contains',
        'is_enabled' => true,
    ]);

    // 3. Simulate Meta Incoming Message Webhook Payload
    $payload = [
        'object' => 'whatsapp_business_account',
        'entry' => [
            [
                'id' => '799788166562792',
                'changes' => [
                    [
                        'value' => [
                            'messaging_product' => 'whatsapp',
                            'metadata' => [
                                'display_phone_number' => '919876543210',
                                'phone_number_id' => '1431069246745536',
                            ],
                            'contacts' => [
                                [
                                    'profile' => [
                                        'name' => 'Pooja Dave',
                                    ],
                                    'wa_id' => '919825012345',
                                ],
                            ],
                            'messages' => [
                                [
                                    'from' => '919825012345',
                                    'id' => 'wamid.HBgMOTE5ODI1MDEyMzQ1FQIAEhggMjhCRTRBOTQxQzQ=',
                                    'timestamp' => '1729600000',
                                    'text' => [
                                        'body' => 'What are the course fees?',
                                    ],
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

    $response = $this->postJson('/webhooks/meta', $payload);

    $response->assertOk();
    $response->assertSee('EVENT_RECEIVED');

    // 4. Verify raw webhook recorded
    expect(WebhookInbox::where('status', 'processed')->count())->toBeGreaterThan(0);

    // 5. Verify conversation created with 24h window
    $conversation = Conversation::where('contact_phone', '+919825012345')->first();
    expect($conversation)->not->toBeNull();
    expect($conversation->contact_name)->toBe('Pooja Dave');
    expect($conversation->isWindowOpen())->toBeTrue();

    // 6. Verify inbound message stored
    $inbound = Message::where('conversation_id', $conversation->id)->where('direction', 'inbound')->first();
    expect($inbound)->not->toBeNull();
    expect($inbound->content)->toBe('What are the course fees?');
    expect($inbound->sender_type)->toBe('contact');

    // 7. Verify outbound bot auto-reply generated
    $outbound = Message::where('conversation_id', $conversation->id)->where('direction', 'outbound')->first();
    expect($outbound)->not->toBeNull();
    expect($outbound->sender_type)->toBe('bot');
    expect($outbound->content)->toContain('₹2,999 one-time setup');
});
