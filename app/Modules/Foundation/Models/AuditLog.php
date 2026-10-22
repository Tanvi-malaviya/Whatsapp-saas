<?php

namespace App\Modules\Foundation\Models;

use App\Models\User;
use App\Shared\TenantContext;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Request;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'diff',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'diff' => 'array',
        'created_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function record(string $action, ?Model $entity = null, ?array $diff = null): self
    {
        return self::create([
            'organization_id' => TenantContext::id(),
            'user_id' => auth()->id(),
            'action' => $action,
            'entity_type' => $entity ? get_class($entity) : null,
            'entity_id' => $entity?->getKey(),
            'diff' => $diff,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'created_at' => now(),
        ]);
    }
}
