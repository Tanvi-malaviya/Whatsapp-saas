<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;

class PanelNavigation
{
    public static function home(User $user): string
    {
        return $user->isSuperAdmin() ? '/admin' : ($user->isB2BAgent() ? '/agent/dashboard' : '/dashboard');
    }

    public static function login(Request $request): string
    {
        return $request->is('admin', 'admin/*') ? '/admin/login' : ($request->is('agent', 'agent/*') ? '/agent/login' : '/login');
    }

    public static function intended(User $user, mixed $url): string
    {
        if (request()->is('agent/login') && ($user->isB2BAgent() || $user->isSuperAdmin())) {
            return '/agent/dashboard';
        }

        $home = self::home($user);
        if (! is_string($url) || $url === '' || str_starts_with($url, '//')) {
            return $home;
        }
        $host = parse_url($url, PHP_URL_HOST);
        if ($host && ! hash_equals((string) parse_url(config('app.url'), PHP_URL_HOST), $host)) {
            return $home;
        }
        $path = '/'.ltrim(parse_url($url, PHP_URL_PATH) ?: '', '/');
        if ($user->isSuperAdmin()) {
            return $path === '/admin' || str_starts_with($path, '/admin/') && $path !== '/admin/login' ? $url : $home;
        }
        if ($user->isB2BAgent()) {
            return str_starts_with($path, '/agent/') && $path !== '/agent/login' ? $url : $home;
        }
        if ($path === '/admin' || str_starts_with($path, '/admin/') || $path === '/agent' || str_starts_with($path, '/agent/') || in_array($path, ['/login', '/logout', '/register', '/two-factor-challenge'], true)) {
            return $home;
        }

        return $url;
    }
}
