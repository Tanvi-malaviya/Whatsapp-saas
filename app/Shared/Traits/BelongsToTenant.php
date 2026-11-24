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
            } elseif (! app()->runningInConsole()) {
                $request = request();
                if (! ($request->user()?->isSuperAdmin() && $request->is('admin', 'admin/*'))) {
                    $builder->whereRaw('1 = 0');
                }
            }
            if (auth()->check() && \App\Shared\TenantContext::id() && ! request()->is('admin', 'admin/*')) {
                $ids = \App\Services\WorkspaceAccess::channelIds();
                $table = $builder->getModel()->getTable();
                if ($ids !== null && $table === 'whatsapp_channels') { $builder->whereIn($table.'.id', $ids); }
                if ($ids !== null && $table === 'conversations') { $builder->whereIn($table.'.channel_id', $ids); }
                if ($ids !== null && $table === 'messages') { $builder->whereHas('conversation', fn ($q) => $q->whereIn('channel_id', $ids)); }
            }
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
