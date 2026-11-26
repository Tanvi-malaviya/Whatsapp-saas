<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use App\Modules\Foundation\Models\Organization;
use App\Shared\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?: $request->header('X-API-Key');

        if (! $token || ! str_starts_with($token, 'sk_live_')) {
            return response()->json([
                'success' => false,
                'error' => 'unauthorized',
                'message' => 'Missing or invalid API key. Pass Authorization: Bearer sk_live_... or X-API-Key header.',
            ], 401);
        }

        $apiKey = ApiKey::where('key_hash', hash('sha256', $token))
            ->where('is_active', true)
            ->first();

        if (! $apiKey) {
            return response()->json([
                'success' => false,
                'error' => 'invalid_api_key',
                'message' => 'The provided API key is invalid or has been revoked.',
            ], 401);
        }

        $org = Organization::find($apiKey->organization_id);
        if (! $org || ! $org->isActive()) {
            return response()->json([
                'success' => false,
                'error' => 'workspace_inactive',
                'message' => 'Your workspace is suspended or inactive.',
            ], 403);
        }

        if (! $org->isSubscriptionActive()) {
            return response()->json([
                'success' => false,
                'error' => 'subscription_expired',
                'message' => 'Your subscription has expired. Please renew to continue sending API messages.',
            ], 402);
        }

        TenantContext::set($org);
        $request->attributes->set('api_key', $apiKey);
        $request->attributes->set('api_organization', $org);

        // Update last_used_at at most once per minute to avoid unnecessary writes
        if (! $apiKey->last_used_at || $apiKey->last_used_at->lt(now()->subMinute())) {
            $apiKey->forceFill(['last_used_at' => now()])->saveQuietly();
        }

        try {
            return $next($request);
        } finally {
            TenantContext::clear();
        }
    }
}
