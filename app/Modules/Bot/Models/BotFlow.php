<?php

namespace App\Modules\Bot\Models;

use App\Modules\Foundation\Models\Organization;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BotFlow extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $table = 'bot_flows';

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'trigger_keywords',
        'status',
        'greeting_message',
        'options',
        'execution_count',
    ];

    protected $casts = [
        'options' => 'array',
        'execution_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
