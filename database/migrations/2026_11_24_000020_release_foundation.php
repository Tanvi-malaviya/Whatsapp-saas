<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('platform_settings')) {
            Schema::create('platform_settings', function (Blueprint $table) {
                $table->string('key')->primary();
                $table->text('value')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('knowledge_documents')) {
            Schema::create('knowledge_documents', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
                $table->string('name');
                $table->unsignedInteger('size');
                $table->longText('content');
                $table->timestamps();
            });
        }

        if (Schema::hasTable('messages') && !Schema::hasColumn('messages', 'metadata')) {
            Schema::table('messages', function (Blueprint $table) {
                $table->json('metadata')->nullable();
            });
        }

        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $table) {
                if (!Schema::hasColumn('conversations', 'label')) {
                    $table->string('label', 100)->nullable();
                }
                if (!Schema::hasColumn('conversations', 'unread_count')) {
                    $table->unsignedInteger('unread_count')->default(0);
                }
                if (!Schema::hasColumn('conversations', 'bot_state')) {
                    $table->json('bot_state')->nullable();
                }
                if (!Schema::hasColumn('conversations', 'channel_id')) {
                    $table->foreignUuid('channel_id')->nullable()->constrained('whatsapp_channels')->nullOnDelete();
                }
            });

            // Handle unique index migrations safely
            try {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->dropUnique('conversations_organization_id_contact_phone_unique');
                });
            } catch (\Throwable $e) {}

            try {
                Schema::table('conversations', function (Blueprint $table) {
                    $table->unique(['organization_id', 'channel_phone_number_id', 'contact_phone'], 'conversation_channel_contact_unique');
                });
            } catch (\Throwable $e) {}
        }

        if (Schema::hasTable('whatsapp_channels')) {
            try {
                Schema::table('whatsapp_channels', function (Blueprint $table) {
                    $table->text('app_secret')->nullable()->change();
                });
            } catch (\Throwable $e) {}

            try {
                DB::table('whatsapp_channels')->orderBy('id')->each(function ($channel) {
                    if (Schema::hasColumn('conversations', 'channel_id')) {
                        DB::table('conversations')
                            ->where('organization_id', $channel->organization_id)
                            ->where('channel_phone_number_id', $channel->phone_number_id)
                            ->update(['channel_id' => $channel->id]);
                    }
                    foreach (['access_token', 'app_secret'] as $field) {
                        if (!empty($channel->$field)) {
                            try {
                                Crypt::decryptString($channel->$field);
                            } catch (\Throwable) {
                                DB::table('whatsapp_channels')->where('id', $channel->id)->update([$field => Crypt::encryptString($channel->$field)]);
                            }
                        }
                    }
                });
            } catch (\Throwable $e) {}

            try {
                Schema::table('whatsapp_channels', function (Blueprint $table) {
                    $table->unique(['organization_id', 'phone_number_id'], 'channel_workspace_phone_unique');
                });
            } catch (\Throwable $e) {}
        }

        if (Schema::hasTable('webhook_inbox')) {
            Schema::table('webhook_inbox', function (Blueprint $table) {
                if (!Schema::hasColumn('webhook_inbox', 'organization_id')) {
                    $table->foreignUuid('organization_id')->nullable()->constrained()->nullOnDelete();
                }
                if (!Schema::hasColumn('webhook_inbox', 'phone_number_id')) {
                    $table->string('phone_number_id')->nullable()->index();
                }
                if (!Schema::hasColumn('webhook_inbox', 'attempts')) {
                    $table->unsignedInteger('attempts')->default(0);
                }
            });
        }

        if (Schema::hasTable('organization_invitations')) {
            Schema::table('organization_invitations', function (Blueprint $table) {
                if (!Schema::hasColumn('organization_invitations', 'channel_access')) {
                    $table->json('channel_access')->nullable();
                }
            });
        }

        if (Schema::hasTable('broadcast_campaigns')) {
            Schema::table('broadcast_campaigns', function (Blueprint $table) {
                if (!Schema::hasColumn('broadcast_campaigns', 'channel_id')) {
                    $table->foreignUuid('channel_id')->nullable()->constrained('whatsapp_channels')->nullOnDelete();
                }
                if (!Schema::hasColumn('broadcast_campaigns', 'payload')) {
                    $table->json('payload')->nullable();
                }
            });
        }

        if (!Schema::hasTable('campaign_recipients')) {
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
        }

        if (!Schema::hasTable('billing_invoices')) {
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
    }

    public function down(): void
    {
        if (Schema::hasTable('messages') && Schema::hasColumn('messages', 'metadata')) {
            Schema::table('messages', fn (Blueprint $t) => $t->dropColumn('metadata'));
        }
        Schema::dropIfExists('billing_invoices');
        Schema::dropIfExists('campaign_recipients');
        if (Schema::hasTable('broadcast_campaigns')) {
            Schema::table('broadcast_campaigns', function (Blueprint $t) {
                if (Schema::hasColumn('broadcast_campaigns', 'channel_id')) {
                    $t->dropConstrainedForeignId('channel_id');
                }
                if (Schema::hasColumn('broadcast_campaigns', 'payload')) {
                    $t->dropColumn('payload');
                }
            });
        }
        if (Schema::hasTable('organization_invitations') && Schema::hasColumn('organization_invitations', 'channel_access')) {
            Schema::table('organization_invitations', fn (Blueprint $t) => $t->dropColumn('channel_access'));
        }
        if (Schema::hasTable('webhook_inbox')) {
            Schema::table('webhook_inbox', function (Blueprint $t) {
                if (Schema::hasColumn('webhook_inbox', 'organization_id')) {
                    $t->dropConstrainedForeignId('organization_id');
                }
                $cols = array_filter(['phone_number_id', 'attempts'], fn ($c) => Schema::hasColumn('webhook_inbox', $c));
                if (!empty($cols)) {
                    $t->dropColumn($cols);
                }
            });
        }
        if (Schema::hasTable('whatsapp_channels')) {
            try {
                Schema::table('whatsapp_channels', fn (Blueprint $t) => $t->dropUnique('channel_workspace_phone_unique'));
            } catch (\Throwable $e) {}
        }
        if (Schema::hasTable('conversations')) {
            Schema::table('conversations', function (Blueprint $t) {
                try {
                    $t->dropUnique('conversation_channel_contact_unique');
                } catch (\Throwable $e) {}
                if (Schema::hasColumn('conversations', 'channel_id')) {
                    $t->dropConstrainedForeignId('channel_id');
                }
                $cols = array_filter(['unread_count', 'bot_state'], fn ($c) => Schema::hasColumn('conversations', $c));
                if (!empty($cols)) {
                    $t->dropColumn($cols);
                }
            });
        }
        Schema::dropIfExists('knowledge_documents');
        Schema::dropIfExists('platform_settings');
    }
};
