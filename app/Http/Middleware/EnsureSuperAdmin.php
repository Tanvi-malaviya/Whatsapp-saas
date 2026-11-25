<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     * Ensure only authenticated Super Administrators can access the Admin Portal.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // If not logged in, redirect to dedicated Admin Login page
        if (! $user) {
            return redirect()->guest(route('admin.login'));
        }

        // If logged in but not a Super Admin, deny and send to workspace dashboard
        if (! $user->isSuperAdmin()) {
            return redirect(\App\Services\PanelNavigation::home($user))->with('error', 'Unauthorized access. Only Super Administrators can access the Admin Portal.');
        }

        return $next($request);
    }
}
