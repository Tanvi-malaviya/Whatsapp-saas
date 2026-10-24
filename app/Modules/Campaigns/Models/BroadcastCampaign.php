<?php

namespace App\Modules\Campaigns\Models;

use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BroadcastCampaign extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $table = 'broadcast_campaigns';

    protected $fillable = [
        'organization_id',
        'name',
        'template_name',
        'template_language',
        'recipients_count',
        'success_count',
        'failed_count',
        'status',
        'parameters',
    ];

    protected $casts = [
        'parameters' => 'array',
        'recipients_count' => 'integer',
        'success_count' => 'integer',
        'failed_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
