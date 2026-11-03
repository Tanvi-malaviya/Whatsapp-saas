<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('app:create-demo-account', function () {
    $email = 'demo@sathwarainfotech.com';
    $password = 'Password@123';

    $user = \App\Models\User::where('email', $email)->first();
    if (! $user) {
        $user = new \App\Models\User();
        $user->name = 'Demo Reviewer';
        $user->email = $email;
    }

    $user->password = \Illuminate\Support\Facades\Hash::make($password);
    $user->email_verified_at = now();
    $user->two_factor_secret = null;
    $user->two_factor_recovery_codes = null;
    $user->two_factor_confirmed_at = null;

    $org = \App\Modules\Foundation\Models\Organization::where('slug', 'sathwara-infotech')->first() 
        ?? \App\Modules\Foundation\Models\Organization::first();

    if (! $org) {
        $org = \App\Modules\Foundation\Models\Organization::create([
            'name' => 'Sathwara InfoTech',
            'slug' => 'sathwara-infotech',
            'billing_email' => 'demo@sathwarainfotech.com',
            'timezone' => 'Asia/Kolkata',
            'currency' => 'INR',
            'status' => 'active',
        ]);
    }

    $user->current_organization_id = $org->id;
    $user->save();

    $exists = \Illuminate\Support\Facades\DB::table('organization_user')
        ->where('user_id', $user->id)
        ->where('organization_id', $org->id)
        ->exists();

    if (! $exists) {
        \Illuminate\Support\Facades\DB::table('organization_user')->insert([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'Owner',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    } else {
        \Illuminate\Support\Facades\DB::table('organization_user')
            ->where('user_id', $user->id)
            ->where('organization_id', $org->id)
            ->update([
                'role' => 'Owner',
                'updated_at' => now(),
            ]);
    }

    $this->info("✅ Meta Review Demo Account ready!");
    $this->line("Email: {$email}");
    $this->line("Password: {$password}");
    $this->line("Organization: {$org->name} ({$org->id})");
    $this->line("Role: Owner");
})->purpose('Create or reset the Meta Review demo account');

