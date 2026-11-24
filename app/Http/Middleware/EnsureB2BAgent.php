<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureB2BAgent
{
    /**
     * Ensure only authenticated B2B Agents or Super Admins can access the Agent portal.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->guest(route('login'));
        }

        if (! $user->isB2BAgent() && ! $user->isSuperAdmin()) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access. Only B2B Agents and Partners can access this portal.');
        }

        return $next($request);
    }
}
