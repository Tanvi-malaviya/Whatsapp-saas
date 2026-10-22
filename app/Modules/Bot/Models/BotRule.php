<?php

namespace App\Modules\Bot\Models;

use App\Modules\Foundation\Models\Organization;
use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BotRule extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'organization_id',
        'name',
        'match_type',
        'keywords',
        'reply_text',
        'is_enabled',
        'priority',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'priority' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Match an inbound message text against this rule's keywords
     */
    public function matches(string $inboundText): bool
    {
        if (! $this->is_enabled) {
            return false;
        }

        $cleanedInbound = strtolower(trim($inboundText));
        $keywordList = array_map('trim', explode(',', strtolower($this->keywords)));

        foreach ($keywordList as $keyword) {
            if (empty($keyword)) continue;

            if ($this->match_type === 'exact' && $cleanedInbound === $keyword) {
                return true;
            }

            if ($this->match_type === 'starts_with' && str_starts_with($cleanedInbound, $keyword)) {
                return true;
            }

            if ($this->match_type === 'contains' && str_contains($cleanedInbound, $keyword)) {
                return true;
            }
        }

        return false;
    }
}
