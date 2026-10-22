<?php

use App\Models\User;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Foundation\Models\Organization;
use App\Shared\TenantContext;

test('organizations can be created with an owner and switched', function () {
    $user = User::factory()->create();

    $org1 = Organization::create([
        'name' => 'Acme Coaching Institute',
        'slug' => 'acme-coaching',
        'timezone' => 'Asia/Kolkata',
    ]);
    $org1->users()->attach($user->id, ['role' => 'Owner']);

    $org2 = Organization::create([
        'name' => 'Apex Dental Clinic',
        'slug' => 'apex-dental',
        'timezone' => 'Asia/Kolkata',
    ]);
    $org2->users()->attach($user->id, ['role' => 'Agent']);

    expect($user->organizations)->toHaveCount(2);
    expect($user->isOwnerOf($org1))->toBeTrue();
    expect($user->isAdminOf($org1))->toBeTrue();
    expect($user->isOwnerOf($org2))->toBeFalse();
    expect($user->roleIn($org2))->toBe('Agent');

    // Switch to org 1
    $user->switchOrganization($org1);
    expect(TenantContext::id())->toBe($org1->id);
    expect($user->currentOrganization->id)->toBe($org1->id);

    // Switch to org 2
    $user->switchOrganization($org2);
    expect(TenantContext::id())->toBe($org2->id);
    expect($user->currentOrganization->id)->toBe($org2->id);

    TenantContext::clear();
});

test('audit logs can be recorded and are scoped to the active tenant', function () {
    $user = User::factory()->create();
    $org = Organization::create([
        'name' => 'Sathwara Tech',
        'slug' => 'sathwara-tech',
    ]);
    $org->users()->attach($user->id, ['role' => 'Owner']);

    $user->switchOrganization($org);
    $this->actingAs($user);

    $log = AuditLog::record('bot.created', $org, ['welcome_message' => 'Hello!']);

    expect($log->organization_id)->toBe($org->id);
    expect($log->user_id)->toBe($user->id);
    expect($log->action)->toBe('bot.created');
    expect($log->diff)->toBe(['welcome_message' => 'Hello!']);

    TenantContext::clear();
});

test('authenticated user requests set tenant context and share tenant props with inertia', function () {
    $user = User::factory()->create();
    $org = Organization::create([
        'name' => 'Gujarat Electronics',
        'slug' => 'gujarat-electronics',
        'timezone' => 'Asia/Kolkata',
    ]);
    $org->users()->attach($user->id, ['role' => 'Owner']);
    $user->update(['current_organization_id' => $org->id]);

    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertOk();

    $response->assertInertia(fn ($page) => $page
        ->has('tenant.current', fn ($current) => $current
            ->where('id', $org->id)
            ->where('name', 'Gujarat Electronics')
            ->where('slug', 'gujarat-electronics')
            ->where('role', 'Owner')
            ->etc()
        )
        ->has('tenant.all', 1)
    );

    TenantContext::clear();
});
