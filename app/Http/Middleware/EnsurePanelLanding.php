<?php

namespace App\Http\Middleware;

use App\Services\PanelNavigation;
use Closure;
use Illuminate\Http\Request;

class EnsurePanelLanding
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Only redirect away from /dashboard if the user has no workspace to display
        if ($user && $request->is('dashboard') && ($user->isSuperAdmin() || $user->isB2BAgent())) {
            $hasWorkspace = (bool) (
                $user->current_organization_id ||
                $user->organizations()->exists() ||
                ($request->session()->get('support_workspace_id') && $request->session()->get('support_workspace_id') === $user->current_organization_id)
            );

            if (! $hasWorkspace) {
                return redirect(PanelNavigation::home($user));
            }
        }

        return $next($request);
    }
}
