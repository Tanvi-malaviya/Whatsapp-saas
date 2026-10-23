<?php

namespace App\Modules\MetaConnection\Models;

use App\Modules\Foundation\Models\Organization;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WhatsAppChannel extends Model
{
    use HasFactory, HasUuids, BelongsToTenant, SoftDeletes;

    protected $table = 'whatsapp_channels';

    protected $fillable = [
        'organization_id',
        'name',
        'phone_number',
        'phone_number_id',
        'waba_id',
        'access_token',
        'app_id',
        'app_secret',
        'quality_rating',
        'messaging_limit',
        'status',
        'is_default',
        'webhook_verified_at',
        'metadata',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'webhook_verified_at' => 'datetime',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
