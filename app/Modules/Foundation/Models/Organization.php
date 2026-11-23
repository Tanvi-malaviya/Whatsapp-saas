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
        'max_channels',
        'metadata',
        'status',
    ];

    protected $casts = [
        'max_channels' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function channels(): HasMany
    {
        return $this->hasMany(\App\Modules\MetaConnection\Models\WhatsAppChannel::class, 'organization_id');
    }

    public function getMaxChannels(): int
    {
        if (array_key_exists('max_channels', $this->attributes) && $this->attributes['max_channels'] !== null) {
            return (int) $this->attributes['max_channels'];
        }

        return $this->metadata['max_channels'] ?? 1;
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

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }
}
