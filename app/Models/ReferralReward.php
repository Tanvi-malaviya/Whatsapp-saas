<?php

namespace App\Models;

use App\Modules\Foundation\Models\Organization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReferralReward extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'referrer_user_id',
        'referred_user_id',
        'referred_organization_id',
        'reward_amount_paise',
        'status',
        'rewarded_at',
    ];

    protected $casts = [
        'reward_amount_paise' => 'integer',
        'rewarded_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function referrer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referrer_user_id');
    }

    public function referredUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'referred_user_id');
    }

    public function referredOrganization(): BelongsTo
    {
        return $this->belongsTo(Organization::class, 'referred_organization_id');
    }
}
