<?php

namespace App\Http\Middleware;

use App\Services\WorkspaceAccess;
use App\Shared\TenantContext;
use Closure;
use Illuminate\Http\Request;

class AuthorizeWorkspace
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (! $user || $request->is('admin', 'admin/*', 'agent', 'agent/*', 'webhooks/*', 'login', 'logout', 'register', 'email/*', 'user/*', 'two-factor-challenge', 'settings/profile', 'settings/security', 'settings/password', 'settings/appearance', 'account', 'invitations/*')) {
            return $next($request);
        }
        $org = TenantContext::get();
        $isAuthorized = $user->isSuperAdmin()
            || $user->organizations()->whereKey($org?->id)->exists()
            || ($user->isB2BAgent() && $org && $org->b2b_agent_id === $user->id);

        abort_unless($org && $isAuthorized, 403, 'No authorized workspace is selected.');
        abort_unless($org->isActive() || $user->isSuperAdmin(), 403, 'Your workspace is suspended. Contact the administrator.');
        if ($request->is('workspace/store')) { abort_unless($user->isSuperAdmin(), 403, 'Only the platform administrator can create workspaces.'); }
        if ($request->is('workspace/switch/*', 'workspace/store')) { return $next($request); }

        // B2B Partners assisting their assigned client workspaces are granted support assist access
        if ($user->isB2BAgent() && $org->b2b_agent_id === $user->id) {
            return $next($request);
        }
        $path = $request->path();
        $module = match (true) {
            str_starts_with($path, 'management/team') => 'team',
            str_starts_with($path, 'settings/billing') => 'billing',
            str_starts_with($path, 'settings/organization') => 'organizations',
            str_starts_with($path, 'channels'), str_starts_with($path, 'whatsapp') => 'whatsapp_accounts',
            str_starts_with($path, 'inbox'), str_starts_with($path, 'chat') => 'inbox',
            str_starts_with($path, 'campaigns') => 'campaigns',
            str_starts_with($path, 'templates') => 'templates',
            str_starts_with($path, 'flows'), str_starts_with($path, 'auto-responder'), str_starts_with($path, 'ai-agent') => 'automation',
            str_starts_with($path, 'commerce') => 'commerce',
            default => 'crm',
        };
        $action = $request->isMethod('GET') ? 'view' : match (true) {
            $request->isMethod('DELETE') => 'delete',
            $request->is('inbox/reply', 'inbox/new-chat') => 'reply',
            $request->is('campaigns/broadcast') => 'send',
            $request->isMethod('PUT'), $request->isMethod('PATCH') => 'edit',
            default => 'create',
        };
        if ($module === 'team') { abort_unless($user->isAdminOf($org) || $user->isSuperAdmin(), 403); }
        elseif (! $request->is('dashboard', 'reports', 'analytics/*', 'insights/*', 'developers')) {
            abort_unless(WorkspaceAccess::allows($user, $org, $module, $action), 403, 'Your role does not allow this action.');
        }
        if ($request->is('insights/system-logs/clear')) { abort_unless($user->isAdminOf($org) || $user->isSuperAdmin(), 403); }
        return $next($request);
    }
}
