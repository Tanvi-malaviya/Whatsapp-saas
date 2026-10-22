<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('direction'); // inbound, outbound
            $table->string('sender_type'); // contact, bot, agent
            $table->string('sender_id')->nullable();
            $table->string('wamid')->nullable()->index(); // Meta WhatsApp Message ID
            $table->string('type')->default('text'); // text, interactive, image, audio, document
            $table->text('content');
            $table->string('status')->default('sent'); // received, sent, delivered, read, failed
            $table->integer('meta_cost_paise')->default(0); // Cost in paise (0 within free tier)
            $table->timestamps();

            $table->index(['conversation_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
