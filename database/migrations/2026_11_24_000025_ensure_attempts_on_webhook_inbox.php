<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('webhook_inbox')) {
            Schema::table('webhook_inbox', function (Blueprint $table) {
                if (! Schema::hasColumn('webhook_inbox', 'attempts')) {
                    $table->unsignedInteger('attempts')->default(0)->after('status');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('webhook_inbox') && Schema::hasColumn('webhook_inbox', 'attempts')) {
            Schema::table('webhook_inbox', function (Blueprint $table) {
                $table->dropColumn('attempts');
            });
        }
    }
};
