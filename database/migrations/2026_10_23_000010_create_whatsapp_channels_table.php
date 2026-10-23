<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('whatsapp_channels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name')->default('Primary WhatsApp'); // e.g. "DukanHisab", "Support"
            $table->string('phone_number')->nullable(); // e.g. "+91 79978 81665"
            $table->string('phone_number_id'); // Meta Phone Number ID
            $table->string('waba_id'); // WhatsApp Business Account ID
            $table->text('access_token'); // Meta Permanent System User Token
            $table->string('app_id')->nullable();
            $table->string('app_secret')->nullable();
            $table->string('quality_rating')->default('GREEN'); // GREEN, YELLOW, RED, UNKNOWN
            $table->string('messaging_limit')->default('TIER_1K'); // TIER_1K, TIER_10K, TIER_100K, UNLIMITED
            $table->string('status')->default('connected'); // connected, pending, disconnected
            $table->boolean('is_default')->default(true);
            $table->timestamp('webhook_verified_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['organization_id', 'status']);
            $table->index(['phone_number_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_channels');
    }
};
