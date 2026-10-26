<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            if (! Schema::hasColumn('conversations', 'email')) {
                $table->string('email')->nullable()->after('contact_name');
            }
            if (! Schema::hasColumn('conversations', 'city')) {
                $table->string('city', 100)->nullable()->after('email');
            }
            if (! Schema::hasColumn('conversations', 'is_opted_in')) {
                $table->boolean('is_opted_in')->default(true)->after('pipeline_stage');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            if (Schema::hasColumn('conversations', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('conversations', 'city')) {
                $table->dropColumn('city');
            }
        });
    }
};
