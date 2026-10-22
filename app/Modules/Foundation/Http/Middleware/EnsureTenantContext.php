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
        $user = $request->user();

        if ($user) {
            $org = $user->currentOrganization;

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
                            'role' => $user->roleIn($org),
                            'status' => $org->status,
                            'timezone' => $org->timezone,
                        ],
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
