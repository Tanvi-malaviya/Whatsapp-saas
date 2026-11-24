<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commerce_products', function (Blueprint $table) {
            if (!Schema::hasColumn('commerce_products', 'channel_id')) {
                $table->uuid('channel_id')->nullable()->after('organization_id');
                $table->index(['organization_id', 'channel_id']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('commerce_products', function (Blueprint $table) {
            if (Schema::hasColumn('commerce_products', 'channel_id')) {
                $table->dropColumn('channel_id');
            }
        });
    }
};
