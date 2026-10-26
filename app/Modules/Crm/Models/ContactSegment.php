<?php

namespace App\Modules\Crm\Models;

use App\Modules\Foundation\Models\Organization;
use App\Modules\Messaging\Models\Conversation;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactSegment extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'name',
        'description',
        'filter_type',
        'filter_value',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function getMatchingQuery()
    {
        $q = Conversation::where('organization_id', $this->organization_id);

        switch ($this->filter_type) {
            case 'opt_in':
                $q->where('is_opted_in', true);
                break;
            case 'opt_out':
                $q->where('is_opted_in', false);
                break;
            case 'stage':
                if ($this->filter_value) {
                    $q->where('pipeline_stage', $this->filter_value);
                }
                break;
            case 'city':
                if ($this->filter_value) {
                    $q->where('city', $this->filter_value);
                }
                break;
            case 'active_7d':
                $q->where('last_message_at', '>=', now()->subDays(7));
                break;
            case 'inactive_30d':
                $q->where('last_message_at', '<', now()->subDays(30));
                break;
            case 'all':
            default:
                break;
        }

        return $q;
    }

    public function getMatchingCount(): int
    {
        return $this->getMatchingQuery()->count();
    }
}
