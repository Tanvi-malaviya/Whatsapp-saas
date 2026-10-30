<?php

namespace App\Modules\Commerce\Models;

use App\Modules\Foundation\Models\Organization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommerceOrder extends Model
{
    use HasUuids;

    protected $table = 'commerce_orders';

    protected $fillable = [
        'organization_id',
        'order_number',
        'customer_name',
        'customer_phone',
        'total_amount',
        'currency',
        'status',
        'items',
        'meta_order_id',
        'notes',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'items' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
