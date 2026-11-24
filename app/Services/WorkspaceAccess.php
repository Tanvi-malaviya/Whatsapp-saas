<?php

namespace App\Services;

use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Shared\TenantContext;

class WorkspaceAccess
{
    public static function channelIds(?User $user = null): ?array
    {
        $user ??= auth()->user();
        $org = TenantContext::get();
        if (! $user || ! $org || $user->isSuperAdmin() || $user->isAdminOf($org)) { return null; }
        $membership = $user->organizations()->whereKey($org->id)->first();
        $ids = $membership?->pivot->channel_access;
        // Empty access means no channels. Only administrators have unrestricted access.
        return is_array($ids) ? $ids : (json_decode($ids ?? '[]', true) ?: []);
    }

    public static function allows(User $user, Organization $org, string $module, string $action): bool
    {
        if ($user->isSuperAdmin() || $user->isOwnerOf($org)) { return true; }
        $role = $user->roleIn($org);
        $configured = $org->metadata['role_permissions'][$role][$module][$action] ?? null;
        if (is_bool($configured)) { return $configured; }
        if ($role === 'Admin') { return ! in_array($module, ['billing', 'team'], true) || $action === 'view'; }
        if ($action === 'view') { return ! in_array($module, ['billing', 'team', 'organizations'], true); }
        if ($role === 'Viewer' || $role === 'Read-only') { return false; }
        if ($role === 'Manager') { return in_array($module, ['inbox', 'crm', 'campaigns', 'templates', 'commerce'], true); }
        return $role === 'Agent' && in_array($module, ['inbox', 'crm'], true);
    }
}
