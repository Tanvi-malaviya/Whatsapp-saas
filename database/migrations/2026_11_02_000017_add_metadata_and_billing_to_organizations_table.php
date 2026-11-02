<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (!Schema::hasColumn('organizations', 'metadata')) {
                $table->json('metadata')->nullable()->after('currency');
            }
            if (!Schema::hasColumn('organizations', 'subscription_plan')) {
                $table->string('subscription_plan')->default('growth')->after('currency');
            }
        });

        Schema::table('organization_user', function (Blueprint $table) {
            if (!Schema::hasColumn('organization_user', 'channel_access')) {
                $table->json('channel_access')->nullable()->after('role'); // array of channel IDs allowed
            }
        });
    }

    public function down(): void
    {
        Schema::table('organizations', function (Blueprint $table) {
            if (Schema::hasColumn('organizations', 'metadata')) {
                $table->dropColumn('metadata');
            }
            if (Schema::hasColumn('organizations', 'subscription_plan')) {
                $table->dropColumn('subscription_plan');
            }
        });

        Schema::table('organization_user', function (Blueprint $table) {
            if (Schema::hasColumn('organization_user', 'channel_access')) {
                $table->dropColumn('channel_access');
            }
        });
    }
};
