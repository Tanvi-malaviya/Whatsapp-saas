<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bot_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('match_type')->default('contains'); // contains, exact, starts_with, welcome
            $table->text('keywords'); // comma separated keywords
            $table->text('reply_text');
            $table->boolean('is_enabled')->default(true);
            $table->integer('priority')->default(0);
            $table->timestamps();

            $table->index(['organization_id', 'is_enabled', 'priority']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_rules');
    }
};
