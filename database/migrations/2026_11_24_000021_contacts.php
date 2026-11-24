<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('contacts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('contact_phone'); $table->string('contact_name')->nullable();
            $table->string('email')->nullable(); $table->string('city')->nullable();
            $table->string('pipeline_stage')->default('New'); $table->string('label')->nullable();
            $table->boolean('is_opted_in')->default(false); $table->decimal('deal_value',12,2)->default(0);
            $table->timestamp('followup_date')->nullable(); $table->string('lead_source')->nullable();
            $table->timestamp('last_message_at')->nullable(); $table->timestamps(); $table->softDeletes();
            $table->unique(['organization_id','contact_phone']);
        });
        Schema::table('conversations', fn (Blueprint $table) => $table->foreignUuid('contact_id')->nullable()->constrained('contacts')->nullOnDelete());
        DB::table('conversations')->orderBy('created_at')->each(function ($conversation) {
            $contact = DB::table('contacts')->where('organization_id', $conversation->organization_id)->where('contact_phone', $conversation->contact_phone)->first();
            $id = $contact?->id ?? (string) Str::uuid();
            if (! $contact) {
                $values = array_intersect_key((array) $conversation, array_flip(['organization_id','contact_phone','contact_name','email','city','pipeline_stage','label','is_opted_in','deal_value','followup_date','lead_source','last_message_at','created_at','updated_at']));
                DB::table('contacts')->insert(['id' => $id, ...$values]);
            }
            DB::table('conversations')->where('id', $conversation->id)->update(['contact_id' => $id]);
        });
    }
    public function down(): void
    {
        Schema::table('conversations', fn (Blueprint $table) => $table->dropConstrainedForeignId('contact_id'));
        Schema::dropIfExists('contacts');
    }
};
