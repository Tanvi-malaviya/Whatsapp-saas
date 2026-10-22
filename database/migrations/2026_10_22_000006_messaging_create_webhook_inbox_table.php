<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('webhook_inbox', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->default('meta');
            $table->string('event_id')->nullable()->index(); // wamid or event ID for deduplication
            $table->json('payload');
            $table->string('status')->default('pending'); // pending, processed, failed
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('webhook_inbox');
    }
};
