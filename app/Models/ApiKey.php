<?php

namespace App\Models;

use App\Modules\Foundation\Models\Organization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use HasUuids;

    protected $fillable = [
        'organization_id',
        'user_id',
        'name',
        'key_prefix',
        'key_hash',
        'encrypted_key',
        'is_active',
        'last_used_at',
    ];

    protected $hidden = [
        'key_hash',
        'encrypted_key',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'last_used_at' => 'datetime',
        ];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Generate and persist a new API key for an organization.
     */
    public static function generateFor(Organization $org, ?User $user = null, string $name = 'Default API Key'): self
    {
        $plain = 'sk_live_' . Str::random(40);

        return self::create([
            'organization_id' => $org->id,
            'user_id' => $user?->id,
            'name' => $name,
            'key_prefix' => substr($plain, 0, 14) . '...',
            'key_hash' => hash('sha256', $plain),
            'encrypted_key' => Crypt::encryptString($plain),
            'is_active' => true,
        ]);
    }

    /**
     * Decrypt the stored secret key for display/copying in the Developer Hub.
     */
    public function revealKey(): ?string
    {
        if (! $this->encrypted_key) {
            return null;
        }

        try {
            return Crypt::decryptString($this->encrypted_key);
        } catch (\Throwable) {
            return null;
        }
    }
}
