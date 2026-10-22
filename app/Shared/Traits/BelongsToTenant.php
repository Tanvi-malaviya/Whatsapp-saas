<?php

namespace App\Shared\Traits;

use App\Modules\Foundation\Models\Organization;
use App\Shared\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::creating(function ($model) {
            if (empty($model->organization_id) && TenantContext::id()) {
                $model->organization_id = TenantContext::id();
            }
        });

        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($tenantId = TenantContext::id()) {
                $builder->where($builder->getModel()->getTable() . '.organization_id', $tenantId);
            }
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
