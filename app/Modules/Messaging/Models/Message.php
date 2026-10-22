<?php

namespace App\Modules\Messaging\Models;

use App\Modules\Foundation\Models\Organization;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'conversation_id',
        'organization_id',
        'direction',
        'sender_type',
        'sender_id',
        'wamid',
        'type',
        'content',
        'status',
        'meta_cost_paise',
    ];

    protected $casts = [
        'meta_cost_paise' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }
}
