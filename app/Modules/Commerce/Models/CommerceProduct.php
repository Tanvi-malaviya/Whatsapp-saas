<?php

namespace App\Modules\Commerce\Models;

use App\Modules\Foundation\Models\Organization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommerceProduct extends Model
{
    use HasUuids;

    protected $table = 'commerce_products';

    protected $fillable = [
        'organization_id',
        'name',
        'retailer_id',
        'description',
        'price',
        'currency',
        'image_url',
        'category',
        'is_available',
        'meta_catalog_id',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
