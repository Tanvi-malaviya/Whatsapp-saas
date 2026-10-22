<?php

namespace Database\Seeders;

use App\Models\User;
use App\Modules\Foundation\Models\AuditLog;
use App\Modules\Foundation\Models\Organization;
use App\Shared\TenantContext;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create a test owner user
        $user = User::firstOrCreate(
            ['email' => 'bhavesh@sathwara.com'],
            [
                'name' => 'Bhavesh Sathwara',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // 2. Create sample organization 1
        $org1 = Organization::firstOrCreate(
            ['slug' => 'sathwara-infotech'],
            [
                'name' => 'Sathwara InfoTech',
                'billing_email' => 'billing@sathwara.com',
                'timezone' => 'Asia/Kolkata',
                'currency' => 'INR',
                'status' => 'active',
            ]
        );

        // 3. Create sample organization 2
        $org2 = Organization::firstOrCreate(
            ['slug' => 'acme-coaching'],
            [
                'name' => 'Acme Coaching Institute',
                'billing_email' => 'admin@acmecoaching.in',
                'timezone' => 'Asia/Kolkata',
                'currency' => 'INR',
                'status' => 'active',
            ]
        );

        // 4. Attach user to organizations with roles
        if (! $user->organizations()->where('organizations.id', $org1->id)->exists()) {
            $user->organizations()->attach($org1->id, ['role' => 'Owner']);
        }

        if (! $user->organizations()->where('organizations.id', $org2->id)->exists()) {
            $user->organizations()->attach($org2->id, ['role' => 'Admin']);
        }

        // Set default current organization
        $user->update(['current_organization_id' => $org1->id]);

        // 5. Create a sample audit log entry
        TenantContext::set($org1);
        AuditLog::create([
            'organization_id' => $org1->id,
            'user_id' => $user->id,
            'action' => 'workspace.initialized',
            'entity_type' => Organization::class,
            'entity_id' => $org1->id,
            'diff' => ['initial_setup' => true, 'currency' => 'INR'],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'Seeder Script',
            'created_at' => now(),
        ]);
        TenantContext::clear();
    }
}
