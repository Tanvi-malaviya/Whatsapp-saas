<?php

use App\Models\KnowledgeDocument;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Shared\TenantContext;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->withoutVite();
    TenantContext::clear();
    Http::preventStrayRequests();
    config(['release.ai.api_key' => null]);
});

afterEach(fn () => TenantContext::clear());

test('AI Agent settings open with or without a configured platform key', function (?string $key) {
    if ($key !== null) {
        PlatformSetting::write('openai_api_key', $key);
    }

    $user = User::factory()->create();
    $org = Organization::create(['name' => 'AI Workspace', 'slug' => 'ai-workspace', 'status' => 'active']);
    $org->users()->attach($user->id, ['role' => 'Owner']);
    $user->update(['current_organization_id' => $org->id]);

    $this->actingAs($user)->get('/ai-agent')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bot/ai-agent')
            ->where('settings', [])
            ->where('providerReady', (bool) $key)
            ->has('initialDocs', 0));

    Http::assertNothingSent();
})->with([null, 'test-platform-api-key']);

test('AI Agent page loads saved settings and only the current workspace documents', function () {
    $user = User::factory()->create();
    $settings = ['enabled' => false, 'provider' => 'openai', 'model' => 'gpt-4o-mini'];
    $org = Organization::create(['name' => 'AI Workspace', 'slug' => 'ai-workspace', 'status' => 'active', 'metadata' => ['ai_agent' => $settings]]);
    $other = Organization::create(['name' => 'Other Workspace', 'slug' => 'other-workspace', 'status' => 'active']);
    $org->users()->attach($user->id, ['role' => 'Owner']);
    $user->update(['current_organization_id' => $org->id]);

    TenantContext::set($other);
    KnowledgeDocument::create(['organization_id' => $other->id, 'name' => 'private.txt', 'size' => 1024, 'content' => 'Other business knowledge']);
    TenantContext::set($org);
    $doc = KnowledgeDocument::create(['organization_id' => $org->id, 'name' => 'faq.txt', 'size' => 2048, 'content' => 'Business knowledge']);
    TenantContext::clear();

    $this->actingAs($user)->get('/ai-agent')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('bot/ai-agent')
            ->where('settings', $settings)
            ->has('initialDocs', 1)
            ->where('initialDocs.0.id', $doc->id)
            ->where('initialDocs.0.name', 'faq.txt')
            ->where('initialDocs.0.size', '2 KB')
            ->missing('initialDocs.0.content'));

    Http::assertNothingSent();
});
