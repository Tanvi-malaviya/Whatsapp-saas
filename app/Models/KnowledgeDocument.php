<?php

namespace App\Models;

use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class KnowledgeDocument extends Model
{
    use HasUuids, BelongsToTenant;
    protected $fillable = ['organization_id', 'name', 'size', 'content'];
    protected $hidden = ['content'];
    protected function casts(): array { return ['content' => 'encrypted']; }
}
