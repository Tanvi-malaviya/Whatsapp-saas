<?php

namespace App\Modules\Messaging\Models;

use Illuminate\Database\Eloquent\Model;

class WebhookInbox extends Model
{
    protected $table = 'webhook_inbox';

    protected $fillable = [
        'provider',
        'organization_id',
        'phone_number_id',
        'attempts',
        'event_id',
        'payload',
        'status',
        'error',
    ];

    protected $casts = [
        'payload' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
