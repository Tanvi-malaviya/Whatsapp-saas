<?php

namespace App\Models;

use App\Shared\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BillingInvoice extends Model
{
    use HasUuids, BelongsToTenant;
    protected $guarded = ['id'];
    protected function casts(): array { return ['paid_at' => 'datetime', 'period_ends_at' => 'datetime', 'amount_paise' => 'integer']; }
}
