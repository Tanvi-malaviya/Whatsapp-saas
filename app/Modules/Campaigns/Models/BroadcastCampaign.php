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
        'channel_id',
        'payload',
        'name',
        'template_name',
        'template_language',
        'recipients_count',
        'success_count',
        'failed_count',
        'cost_paise',
        'category',
        'is_paused',
        'max_contacts_limit',
        'status',
        'parameters',
    ];

    protected $casts = [
        'payload' => 'array',
        'parameters' => 'array',
        'recipients_count' => 'integer',
        'success_count' => 'integer',
        'failed_count' => 'integer',
        'cost_paise' => 'integer',
        'is_paused' => 'boolean',
        'max_contacts_limit' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
