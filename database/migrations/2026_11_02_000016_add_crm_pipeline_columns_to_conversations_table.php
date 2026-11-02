<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            if (! Schema::hasColumn('conversations', 'deal_value')) {
                $table->decimal('deal_value', 12, 2)->default(0)->after('pipeline_stage');
            }
            if (! Schema::hasColumn('conversations', 'followup_date')) {
                $table->dateTime('followup_date')->nullable()->after('deal_value');
            }
            if (! Schema::hasColumn('conversations', 'lead_source')) {
                $table->string('lead_source', 50)->default('WhatsApp Inbound')->after('followup_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropColumn(['deal_value', 'followup_date', 'lead_source']);
        });
    }
};
