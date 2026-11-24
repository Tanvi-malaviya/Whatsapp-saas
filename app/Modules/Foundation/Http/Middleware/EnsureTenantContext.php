<?php

namespace App\Modules\Foundation\Http\Middleware;

use App\Shared\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        TenantContext::clear();
        $user = $request->user();
        if ($request->is("admin", "admin/*", "webhooks/*")) { return $next($request); }

        if ($user) {
            $org = $user->currentOrganization;
            $isAuthorizedForOrg = $org && (
                $user->isSuperAdmin() ||
                $user->organizations()->whereKey($org->id)->exists() ||
                ($user->isB2BAgent() && $org->b2b_agent_id === $user->id)
            );

            if ($org && ! $isAuthorizedForOrg) {
                $org = null;
                $user->update(["current_organization_id" => null]);
            }

            if (! $org && $user->organizations()->exists()) {
                $org = $user->organizations()->first();
                $user->update(['current_organization_id' => $org->id]);
            }

            if ($org) {
                TenantContext::set($org);

                Inertia::share([
                    'tenant' => [
                        'current' => [
                            'id' => $org->id,
                            'name' => $org->name,
                            'slug' => $org->slug,
                            'role' => ($user->isB2BAgent() && $org->b2b_agent_id === $user->id && ! $user->organizations()->whereKey($org->id)->exists())
                                ? 'Partner Support'
                                : $user->roleIn($org),
                            'status' => $org->status,
                            'timezone' => $org->timezone,
                            'currency' => $org->currency,
                            'billing_email' => $org->billing_email,
                            'max_channels' => $org->getMaxChannels(),
                        ],
                        'isAssisting' => (bool) ($user->isB2BAgent() && $org->b2b_agent_id === $user->id && ! $user->organizations()->whereKey($org->id)->exists()),
                        'all' => fn () => $user->organizations->map(fn ($o) => [
                            'id' => $o->id,
                            'name' => $o->name,
                            'slug' => $o->slug,
                            'role' => $o->pivot->role,
                        ]),
                    ],
                ]);
            }
        }

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        TenantContext::clear();
    }
}
