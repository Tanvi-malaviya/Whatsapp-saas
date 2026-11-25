<?php

namespace App\Modules\Foundation\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'billing_email',
        'timezone',
        'currency',
        'subscription_plan',
        'subscription_expires_at',
        'subscription_price_paise',
        'welcome_bonus_claimed',
        'b2b_agent_id',
        'max_channels',
        'metadata',
        'status',
    ];

    protected $casts = [
        'max_channels' => 'integer',
        'subscription_expires_at' => 'datetime',
        'subscription_price_paise' => 'integer',
        'welcome_bonus_claimed' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function wallet(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(\App\Models\Wallet::class);
    }

    public function getOrCreateWallet(): \App\Models\Wallet
    {
        return $this->wallet()->firstOrCreate([], [
            'paid_balance_paise' => 0,
            'promotional_balance_paise' => 0,
        ]);
    }

    public function b2bAgent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'b2b_agent_id');
    }

    public function channels(): HasMany
    {
        return $this->hasMany(\App\Modules\MetaConnection\Models\WhatsAppChannel::class, 'organization_id');
    }

    public function getMaxChannels(): int
    {
        if (array_key_exists('max_channels', $this->attributes) && $this->attributes['max_channels'] !== null) {
            return max((int) $this->attributes['max_channels'], 20);
        }

        return $this->metadata['max_channels'] ?? 20;
    }

    public function canAddMoreChannels(): bool
    {
        $limit = $this->getMaxChannels();
        if ($limit <= 0) {
            return true; // 0 or negative represents Unlimited
        }

        $current = \App\Modules\MetaConnection\Models\WhatsAppChannel::where('organization_id', $this->id)->count();
        return $current < $limit;
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'organization_user')
            ->withPivot('role', 'channel_access')
            ->withTimestamps();
    }

    public function invitations(): HasMany
    {
        return $this->hasMany(OrganizationInvitation::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSubscriptionActive(): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        if ($this->subscription_expires_at) {
            return $this->subscription_expires_at->isFuture();
        }

        return true;
    }

    public function daysUntilExpiry(): ?int
    {
        if (! $this->subscription_expires_at) {
            return null;
        }

        return (int) now()->diffInDays($this->subscription_expires_at, false);
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }
}
