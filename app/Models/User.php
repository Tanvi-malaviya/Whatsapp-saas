<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'current_organization_id', 'is_super_admin', 'email_verified_at'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_super_admin' => 'boolean',
        ];
    }

    public function isSuperAdmin(): bool
    {
        if ($this->is_super_admin) {
            return true;
        }

        // Primary master user is super admin
        if ($this->id === 1) {
            return true;
        }

        return false;
    }

    public function organizations(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Modules\Foundation\Models\Organization::class, 'organization_user')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function currentOrganization(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Modules\Foundation\Models\Organization::class, 'current_organization_id');
    }

    public function switchOrganization(\App\Modules\Foundation\Models\Organization $organization): void
    {
        $this->update(['current_organization_id' => $organization->id]);
        $this->unsetRelation('currentOrganization');
        \App\Shared\TenantContext::set($organization);
    }

    public function roleIn(\App\Modules\Foundation\Models\Organization $organization): ?string
    {
        $membership = $this->organizations()->where('organizations.id', $organization->id)->first();
        return $membership?->pivot->role;
    }

    public function isOwnerOf(\App\Modules\Foundation\Models\Organization $organization): bool
    {
        return $this->roleIn($organization) === 'Owner';
    }

    public function isAdminOf(\App\Modules\Foundation\Models\Organization $organization): bool
    {
        return in_array($this->roleIn($organization), ['Owner', 'Admin']);
    }
}
