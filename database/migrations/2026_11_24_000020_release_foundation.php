<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
        Schema::create('knowledge_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('size');
            $table->longText('content');
            $table->timestamps();
        });
        Schema::table('messages', function (Blueprint $table) { $table->json('metadata')->nullable(); });
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('label', 100)->nullable();
            $table->unsignedInteger('unread_count')->default(0);
            $table->json('bot_state')->nullable();
            $table->foreignUuid('channel_id')->nullable()->constrained('whatsapp_channels')->nullOnDelete();
            $table->dropUnique(['organization_id', 'contact_phone']);
            $table->unique(['organization_id', 'channel_phone_number_id', 'contact_phone'], 'conversation_channel_contact_unique');
        });
        Schema::table('whatsapp_channels', function (Blueprint $table) {
            $table->text('app_secret')->nullable()->change();
        });
        DB::table('whatsapp_channels')->orderBy('id')->each(function ($channel) {
            DB::table('conversations')->where('organization_id', $channel->organization_id)
                ->where('channel_phone_number_id', $channel->phone_number_id)->update(['channel_id' => $channel->id]);
            foreach (['access_token', 'app_secret'] as $field) {
                if ($channel->$field) {
                    DB::table('whatsapp_channels')->where('id', $channel->id)->update([$field => Crypt::encryptString($channel->$field)]);
                }
            }
        });
        // Retain legacy records; the connection service rejects ownership conflicts.
        Schema::table('whatsapp_channels', function (Blueprint $table) {
            $table->unique(['organization_id', 'phone_number_id'], 'channel_workspace_phone_unique');
        });
        Schema::table('webhook_inbox', function (Blueprint $table) {
            $table->foreignUuid('organization_id')->nullable()->constrained()->nullOnDelete();
            $table->string('phone_number_id')->nullable()->index();
            $table->unsignedInteger('attempts')->default(0);
        });
        Schema::table('organization_invitations', function (Blueprint $table) {
            $table->json('channel_access')->nullable();
        });
        Schema::table('broadcast_campaigns', function (Blueprint $table) {
            $table->foreignUuid('channel_id')->nullable()->constrained('whatsapp_channels')->nullOnDelete();
            $table->json('payload')->nullable();
        });
        Schema::create('campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('campaign_id')->constrained('broadcast_campaigns')->cascadeOnDelete();
            $table->string('phone');
            $table->string('name')->nullable();
            $table->string('status')->default('queued');
            $table->string('wamid')->nullable()->index();
            $table->text('error')->nullable();
            $table->timestamps();
            $table->unique(['campaign_id', 'phone']);
        });
        Schema::create('billing_invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('plan');
            $table->unsignedInteger('amount_paise');
            $table->string('currency', 3)->default('INR');
            $table->string('status')->default('pending');
            $table->string('provider_order_id')->nullable()->unique();
            $table->string('provider_payment_id')->nullable()->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('period_ends_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::table('messages', fn (Blueprint $t) => $t->dropColumn('metadata'));
        Schema::dropIfExists('billing_invoices');
        Schema::dropIfExists('campaign_recipients');
        Schema::table('broadcast_campaigns', function (Blueprint $t) { $t->dropConstrainedForeignId('channel_id'); $t->dropColumn('payload'); });
        Schema::table('organization_invitations', fn (Blueprint $t) => $t->dropColumn('channel_access'));
        Schema::table('webhook_inbox', function (Blueprint $t) { $t->dropConstrainedForeignId('organization_id'); $t->dropColumn(['phone_number_id', 'attempts']); });
        Schema::table('whatsapp_channels', fn (Blueprint $t) => $t->dropUnique('channel_workspace_phone_unique'));
        Schema::table('conversations', function (Blueprint $t) {
            $t->dropUnique('conversation_channel_contact_unique');
            $t->dropConstrainedForeignId('channel_id');
            $t->dropColumn(['label', 'unread_count', 'bot_state']);
        });
        Schema::dropIfExists('knowledge_documents');
        Schema::dropIfExists('platform_settings');
    }
};
