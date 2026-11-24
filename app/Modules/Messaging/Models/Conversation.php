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
        'channel_id',
        'contact_id',
        'unread_count',
        'bot_state',
        'contact_phone',
        'contact_name',
        'email',
        'city',
        'channel_phone_number_id',
        'status',
        'pipeline_stage',
        'is_opted_in',
        'label',
        'deal_value',
        'followup_date',
        'lead_source',
        'window_expires_at',
        'last_message_at',
        'assigned_user_id',
    ];

    protected $casts = [
        'unread_count' => 'integer',
        'bot_state' => 'array',
        'is_opted_in' => 'boolean',
        'deal_value' => 'decimal:2',
        'followup_date' => 'datetime',
        'window_expires_at' => 'datetime',
        'last_message_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::saving(function (self $conversation) {
            if (! $conversation->organization_id || ! $conversation->contact_phone) { return; }
            $values = array_filter(
                array_intersect_key($conversation->getAttributes(), array_flip(['contact_name','email','city','pipeline_stage','label','is_opted_in','deal_value','followup_date','lead_source','last_message_at'])),
                fn ($v) => $v !== null
            );
            $contact = \App\Modules\Crm\Models\Contact::withoutGlobalScopes()->withTrashed()->firstOrCreate(['organization_id' => $conversation->organization_id, 'contact_phone' => $conversation->contact_phone], $values);
            $conversation->contact_id = $contact->id;
            if ($conversation->exists) { $contact->fill($values)->saveQuietly(); }
            if ($conversation->channel_phone_number_id && ! $conversation->channel_id) {
                $conversation->channel_id = \App\Modules\MetaConnection\Models\WhatsAppChannel::withoutGlobalScopes()->where('organization_id', $conversation->organization_id)->where('phone_number_id', $conversation->channel_phone_number_id)->value('id');
            }
        });
    }
    public function contact() { return $this->belongsTo(\App\Modules\Crm\Models\Contact::class); }

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
