<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_channels', fn (Blueprint $table) => $table->text('registration_pin')->nullable());
    }

    public function down(): void
    {
        Schema::table('whatsapp_channels', fn (Blueprint $table) => $table->dropColumn('registration_pin'));
    }
};
