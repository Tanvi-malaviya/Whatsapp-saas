<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (!Schema::hasColumn('organizations', 'max_channels')) {
                $table->integer('max_channels')->default(1)->after('subscription_plan')->comment('Maximum WhatsApp numbers allowed for this organization');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'is_super_admin')) {
                $table->boolean('is_super_admin')->default(false)->after('email')->comment('Master Super Admin with cross-organization privileges');
            }
        });

        // Seed default high limit for primary owner/organization
        try {
            DB::table('organizations')
                ->where('slug', 'sathwara-infotech')
                ->orWhere('name', 'like', '%Sathwara%')
                ->update(['max_channels' => 20]);

            DB::table('users')
                ->where('email', 'like', '%sathwara%')
                ->orWhere('email', 'like', '%malaviya%')
                ->orWhere('id', 1)
                ->update(['is_super_admin' => true]);
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (Schema::hasColumn('organizations', 'max_channels')) {
                $table->dropColumn('max_channels');
            }
        });

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'is_super_admin')) {
                $table->dropColumn('is_super_admin');
            }
        });
    }
};
