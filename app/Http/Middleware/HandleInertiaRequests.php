<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'isSuperAdmin' => $request->user()?->isSuperAdmin() ?? false,
                'isB2BAgent' => $request->user()?->isB2BAgent() ?? false,
            ],
            'tenant' => function () use ($request) {
                $user = $request->user();
                $currentOrg = $user?->currentOrganization
                    ?? \App\Shared\TenantContext::get();
                return [
                    'current' => $currentOrg ? [
                        'id' => $currentOrg->id,
                        'name' => $currentOrg->name,
                        'slug' => $currentOrg->slug,
                        'status' => $currentOrg->status,
                        'subscription_plan' => $currentOrg->subscription_plan,
                        'subscription_expires_at' => $currentOrg->subscription_expires_at?->toIso8601String(),
                        'days_until_expiry' => $currentOrg->daysUntilExpiry(),
                        'is_active' => $currentOrg->isSubscriptionActive(),
                    ] : null,
                    'organizations' => $user?->organizations ?? ($currentOrg ? [$currentOrg] : []),
                    'role' => $user && $currentOrg ? $user->roleIn($currentOrg) : null,
                ];
            },
            'wallet' => function () use ($request) {
                $org = $request->user()?->currentOrganization ?? \App\Shared\TenantContext::get();
                if (! $org) {
                    return null;
                }
                return app(\App\Services\WalletService::class)->getBalances($org);
            },
            'whatsapp' => function () use ($request) {
                $orgId = $request->user()?->current_organization_id
                    ?? \App\Shared\TenantContext::id();

                $channel = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $orgId)
                    ->where('status', 'connected')
                    ->first();

                return [
                    'isConnected' => (bool) $channel,
                    'phoneNumber' => $channel?->phone_number,
                    'name' => $channel?->name,
                ];
            },
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
