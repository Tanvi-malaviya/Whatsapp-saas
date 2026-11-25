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
#[Fillable(['name', 'email', 'password', 'current_organization_id', 'is_super_admin', 'email_verified_at', 'referral_code', 'referred_by_id', 'is_b2b_agent'])]
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
            'is_b2b_agent' => 'boolean',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return (bool) $this->is_super_admin;
    }

    public function isB2BAgent(): bool
    {
        return (bool) $this->is_b2b_agent;
    }

    public function generateReferralCode(): string
    {
        if (! $this->referral_code) {
            $base = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $this->name ?: explode('@', $this->email)[0]));
            if (strlen($base) < 3) {
                $base = 'USER';
            }
            $base = substr($base, 0, 6);

            $attempts = 0;
            do {
                $suffix = rand(1000, 9999);
                $code = $base . $suffix;
                $exists = self::where('referral_code', $code)->exists();
                $attempts++;
            } while ($exists && $attempts < 20);

            if ($exists) {
                $code = $base . strtoupper(substr(md5(uniqid()), 0, 4));
            }

            $this->update(['referral_code' => $code]);
        }
        return $this->referral_code;
    }

    public function referredBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(self::class, 'referred_by_id');
    }

    public function managedOrganizations(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(\App\Modules\Foundation\Models\Organization::class, 'b2b_agent_id');
    }

    public function organizations(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(\App\Modules\Foundation\Models\Organization::class, 'organization_user')
            ->withPivot('role', 'channel_access')
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
