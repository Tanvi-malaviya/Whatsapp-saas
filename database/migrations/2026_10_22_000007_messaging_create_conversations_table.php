<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('contact_phone'); // E.164 e.g. +919825012345
            $table->string('contact_name')->nullable();
            $table->string('channel_phone_number_id')->nullable(); // Meta Phone Number ID
            $table->string('status')->default('open'); // open, bot_handled, pending, resolved
            $table->timestamp('window_expires_at')->nullable(); // WhatsApp 24h customer window end time
            $table->timestamp('last_message_at')->nullable();
            $table->foreignId('assigned_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['organization_id', 'contact_phone']);
            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
