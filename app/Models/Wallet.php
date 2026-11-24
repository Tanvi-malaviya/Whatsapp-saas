<?php

namespace App\Models;

use App\Modules\Foundation\Models\Organization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'organization_id',
        'paid_balance_paise',
        'promotional_balance_paise',
    ];

    protected $casts = [
        'paid_balance_paise' => 'integer',
        'promotional_balance_paise' => 'integer',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class)->latest();
    }

    public function totalBalancePaise(): int
    {
        return (int) ($this->paid_balance_paise + $this->promotional_balance_paise);
    }

    public function hasSufficientBalance(int $amountPaise): bool
    {
        return $this->totalBalancePaise() >= $amountPaise;
    }
}
