<?php

namespace App\Modules\Crm\Models;

use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Contact extends Model
{
    use HasUuids, BelongsToTenant, SoftDeletes;
    protected $fillable = ['organization_id','contact_phone','contact_name','email','city','pipeline_stage','label','is_opted_in','deal_value','followup_date','lead_source','last_message_at'];
    protected function casts(): array { return ['is_opted_in' => 'boolean', 'deal_value' => 'decimal:2', 'followup_date' => 'datetime', 'last_message_at' => 'datetime']; }
    public function conversations() { return $this->hasMany(\App\Modules\Messaging\Models\Conversation::class); }
    public function messages() { return $this->hasManyThrough(\App\Modules\Messaging\Models\Message::class, \App\Modules\Messaging\Models\Conversation::class); }
    protected static function booted(): void
    {
        static::updated(function (self $contact) {
            $changes = array_intersect_key($contact->getChanges(), array_flip(['contact_name','email','city','pipeline_stage','label','is_opted_in','deal_value','followup_date','lead_source']));
            if ($changes) { $contact->conversations()->withoutGlobalScopes()->update($changes); }
        });
    }
}
