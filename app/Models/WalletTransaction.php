<?php

namespace App\Models;

use App\Modules\Foundation\Models\Organization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'wallet_id',
        'organization_id',
        'type',
        'amount_paise',
        'balance_type',
        'reference_id',
        'description',
        'metadata',
    ];

    protected $casts = [
        'amount_paise' => 'integer',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
