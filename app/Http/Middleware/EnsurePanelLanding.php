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
        if ($user && $request->is('dashboard') && ($user->isSuperAdmin() || $user->isB2BAgent())
            && ! ($request->session()->get('support_workspace_id') && $request->session()->get('support_workspace_id') === $user->current_organization_id)) {
            return redirect(PanelNavigation::home($user));
        }

        return $next($request);
    }
}
