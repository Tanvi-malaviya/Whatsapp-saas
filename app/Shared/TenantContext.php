<?php

namespace App\Shared;

use App\Modules\Foundation\Models\Organization;

class TenantContext
{
    private static ?Organization $currentOrganization = null;

    public static function set(?Organization $organization): void
    {
        self::$currentOrganization = $organization;
    }

    public static function get(): ?Organization
    {
        return self::$currentOrganization;
    }

    public static function id(): ?string
    {
        return self::$currentOrganization?->id;
    }

    public static function timezone(): string
    {
        return self::$currentOrganization?->timezone ?? 'Asia/Kolkata';
    }

    public static function clear(): void
    {
        self::$currentOrganization = null;
    }
}
