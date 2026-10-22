<?php

namespace App\Modules\Messaging\Models;

use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Conversation extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'organization_id',
        'contact_phone',
        'contact_name',
        'channel_phone_number_id',
        'status',
        'window_expires_at',
        'last_message_at',
        'assigned_user_id',
    ];

    protected $casts = [
        'window_expires_at' => 'datetime',
        'last_message_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'asc');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function isWindowOpen(): bool
    {
        return $this->window_expires_at && $this->window_expires_at->isFuture();
    }

    public function extendWindow(): void
    {
        $this->update([
            'window_expires_at' => now()->addHours(24),
            'last_message_at' => now(),
        ]);
    }
}
