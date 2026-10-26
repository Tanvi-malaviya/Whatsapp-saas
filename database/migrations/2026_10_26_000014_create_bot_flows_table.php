<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bot_flows', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('trigger_keywords'); // comma-separated keywords e.g. 'hi, hello, menu'
            $table->string('status')->default('active'); // 'active' | 'draft'
            $table->text('greeting_message');
            $table->json('options'); // array of [{ id: '1', label: '...', reply_text: '...', action_type: 'reply' }]
            $table->unsignedInteger('execution_count')->default(0);
            $table->timestamps();

            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bot_flows');
    }
};
