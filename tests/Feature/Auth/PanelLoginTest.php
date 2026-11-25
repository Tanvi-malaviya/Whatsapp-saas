<?php

use App\Models\User;
use App\Shared\TenantContext;
use Inertia\Testing\AssertableInertia;

beforeEach(function () {
    $this->withoutVite();
    TenantContext::clear();
});
afterEach(fn () => TenantContext::clear());

function panelUser(string $role): User
{
    return User::factory()->create(['email' => $role.'@example.test', 'password' => 'Test-Password-123!', 'is_super_admin' => $role === 'admin', 'is_b2b_agent' => $role === 'agent']);
}

test('each panel has a dedicated login page', function (string $path, string $component) {
    $this->get($path)->assertOk()->assertInertia(fn (AssertableInertia $page) => $page->component($component));
})->with([['/login', 'auth/login'], ['/admin/login', 'admin/login'], ['/agent/login', 'agent/login']]);

test('each account logs in through its own panel and reaches the correct dashboard', function (string $role, string $path, string $home) {
    $user = panelUser($role);
    $this->post($path, ['email' => $user->email, 'password' => 'Test-Password-123!'])->assertRedirect($home);
    $this->assertAuthenticatedAs($user);
})->with([['user', '/login', '/dashboard'], ['admin', '/admin/login', '/admin'], ['agent', '/agent/login', '/agent/dashboard']]);

test('an account cannot log in through another role login', function (string $role, string $path) {
    $user = panelUser($role);
    $this->post($path, ['email' => $user->email, 'password' => 'Test-Password-123!'])->assertSessionHasErrors('email');
    $this->assertGuest();
})->with([['user', '/admin/login'], ['user', '/agent/login'], ['admin', '/login'], ['admin', '/agent/login'], ['agent', '/login'], ['agent', '/admin/login']]);

test('protected panel URLs redirect guests to the matching login', function (string $path, string $login) {
    $this->get($path)->assertRedirect($login);
})->with([['/dashboard', '/login'], ['/admin/dashboard', '/admin/login'], ['/agent/dashboard', '/agent/login']]);

test('intended redirects cannot send a signed in role into another panel', function (string $role, string $login, string $home, string $intended) {
    $user = panelUser($role);
    $this->withSession(['url.intended' => $intended])->post($login, ['email' => $user->email, 'password' => 'Test-Password-123!'])->assertRedirect($home);
})->with([['user', '/login', '/dashboard', 'http://localhost/admin/users'], ['admin', '/admin/login', '/admin', 'http://localhost/dashboard'], ['agent', '/agent/login', '/agent/dashboard', 'http://localhost/admin'], ['user', '/login', '/dashboard', 'https://external.invalid/steal']]);

test('two factor authentication still returns each role to its own dashboard', function (string $role, string $login, string $home) {
    $user = panelUser($role);
    $user->forceFill(['two_factor_secret' => encrypt('JBSWY3DPEHPK3PXP'), 'two_factor_confirmed_at' => now(), 'two_factor_recovery_codes' => encrypt(json_encode(['recovery-test-code']))])->save();
    $this->post($login, ['email' => $user->email, 'password' => 'Test-Password-123!'])->assertRedirect('/two-factor-challenge');
    $this->assertGuest();
    $this->post('/two-factor-challenge', ['recovery_code' => 'recovery-test-code'])->assertRedirect($home);
    $this->assertAuthenticatedAs($user);
})->with([['admin', '/admin/login', '/admin'], ['agent', '/agent/login', '/agent/dashboard'], ['user', '/login', '/dashboard']]);

test('panel logout returns to the appropriate login', function (string $role, string $logout, string $login) {
    $this->actingAs(panelUser($role))->post($logout)->assertRedirect($login);
    $this->assertGuest();
})->with([['admin', '/admin/logout', '/admin/login'], ['agent', '/agent/logout', '/agent/login'], ['user', '/logout', '/login']]);

test('authenticated roles opening a login page return to their own dashboard', function (string $role, string $home) {
    $this->actingAs(panelUser($role));
    foreach (['/login', '/admin/login', '/agent/login', '/'] as $path) {
        $this->get($path)->assertRedirect($home);
    }
})->with([['admin', '/admin'], ['agent', '/agent/dashboard'], ['user', '/dashboard']]);
