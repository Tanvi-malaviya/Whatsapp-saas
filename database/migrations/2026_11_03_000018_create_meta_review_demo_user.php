<?php

use App\Models\User;
use App\Modules\Foundation\Models\Organization;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $email = 'demo@sathwarainfotech.com';
        $password = 'Password@123';

        // 1. Find or create the demo user
        $user = User::where('email', $email)->first();

        if (! $user) {
            $user = new User();
            $user->name = 'Demo Reviewer';
            $user->email = $email;
        }

        $user->password = Hash::make($password);
        $user->email_verified_at = now();
        $user->two_factor_secret = null;
        $user->two_factor_recovery_codes = null;
        $user->two_factor_confirmed_at = null;

        // 2. Find Sathwara InfoTech organization or first active org
        $org = Organization::where('slug', 'sathwara-infotech')->first() 
            ?? Organization::first();

        if (! $org) {
            $org = Organization::create([
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

        // 3. Attach user to organization with Owner role
        $existsInPivot = DB::table('organization_user')
            ->where('user_id', $user->id)
            ->where('organization_id', $org->id)
            ->exists();

        if (! $existsInPivot) {
            DB::table('organization_user')->insert([
                'organization_id' => $org->id,
                'user_id' => $user->id,
                'role' => 'Owner',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('organization_user')
                ->where('user_id', $user->id)
                ->where('organization_id', $org->id)
                ->update([
                    'role' => 'Owner',
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $user = User::where('email', 'demo@sathwarainfotech.com')->first();
        if ($user) {
            DB::table('organization_user')->where('user_id', $user->id)->delete();
            $user->delete();
        }
    }
};
