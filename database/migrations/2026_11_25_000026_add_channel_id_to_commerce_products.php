<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('commerce_products')) {
            Schema::table('commerce_products', function (Blueprint $table) {
                if (! Schema::hasColumn('commerce_products', 'channel_id')) {
                    $table->foreignUuid('channel_id')->nullable()->after('organization_id')->constrained('whatsapp_channels')->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('commerce_products') && Schema::hasColumn('commerce_products', 'channel_id')) {
            Schema::table('commerce_products', function (Blueprint $table) {
                $table->dropConstrainedForeignId('channel_id');
            });
        }
    }
};
