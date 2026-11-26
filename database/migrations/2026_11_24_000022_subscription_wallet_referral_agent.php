<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Wallets table for organization messaging balance
        if (!Schema::hasTable('wallets')) {
            Schema::create('wallets', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('organization_id')->unique()->constrained('organizations')->cascadeOnDelete();
                $table->unsignedBigInteger('paid_balance_paise')->default(0);
                $table->unsignedBigInteger('promotional_balance_paise')->default(0);
                $table->timestamps();
            });
        }

        // 2. Wallet transactions ledger
        if (!Schema::hasTable('wallet_transactions')) {
            Schema::create('wallet_transactions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignUuid('wallet_id')->constrained('wallets')->cascadeOnDelete();
                $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->string('type'); // recharge, welcome_bonus, referral_reward, message_deduction, refund, adjustment
                $table->integer('amount_paise'); // positive for credits, negative for debits
                $table->string('balance_type')->default('paid'); // paid, promotional, mixed
                $table->string('reference_id')->nullable()->index();
                $table->text('description')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['organization_id', 'created_at']);
            });
        }

        // 3. Referral rewards tracking
        if (!Schema::hasTable('referral_rewards')) {
            Schema::create('referral_rewards', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->foreignId('referrer_user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignId('referred_user_id')->constrained('users')->cascadeOnDelete();
                $table->foreignUuid('referred_organization_id')->constrained('organizations')->cascadeOnDelete();
                $table->unsignedInteger('reward_amount_paise')->default(50000); // ₹500
                $table->string('status')->default('rewarded'); // pending, rewarded, cancelled
                $table->timestamp('rewarded_at')->nullable();
                $table->timestamps();

                $table->index(['referrer_user_id', 'status']);
            });
        }

        // 4. Update users table with referral code, referred_by, and B2B agent role
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'referral_code')) {
                    $table->string('referral_code', 32)->nullable()->unique();
                }
                if (!Schema::hasColumn('users', 'referred_by_id')) {
                    $table->foreignId('referred_by_id')->nullable()->constrained('users')->nullOnDelete();
                }
                if (!Schema::hasColumn('users', 'is_b2b_agent')) {
                    $table->boolean('is_b2b_agent')->default(false);
                }
            });
        }

        // 5. Update organizations table with subscription expiry, price, welcome bonus flag, and assigned B2B agent
        if (Schema::hasTable('organizations')) {
            Schema::table('organizations', function (Blueprint $table) {
                if (!Schema::hasColumn('organizations', 'subscription_expires_at')) {
                    $table->timestamp('subscription_expires_at')->nullable();
                }
                if (!Schema::hasColumn('organizations', 'subscription_price_paise')) {
                    $table->unsignedInteger('subscription_price_paise')->default(999900); // ₹9,999
                }
                if (!Schema::hasColumn('organizations', 'welcome_bonus_claimed')) {
                    $table->boolean('welcome_bonus_claimed')->default(false);
                }
                if (!Schema::hasColumn('organizations', 'b2b_agent_id')) {
                    $table->foreignId('b2b_agent_id')->nullable()->constrained('users')->nullOnDelete();
                }
            });
        }

        // 6. Update broadcast_campaigns table with cost, category, paused state and max contacts
        if (Schema::hasTable('broadcast_campaigns')) {
            Schema::table('broadcast_campaigns', function (Blueprint $table) {
                if (!Schema::hasColumn('broadcast_campaigns', 'cost_paise')) {
                    $table->unsignedInteger('cost_paise')->default(0);
                }
                if (!Schema::hasColumn('broadcast_campaigns', 'category')) {
                    $table->string('category', 50)->default('MARKETING');
                }
                if (!Schema::hasColumn('broadcast_campaigns', 'is_paused')) {
                    $table->boolean('is_paused')->default(false);
                }
                if (!Schema::hasColumn('broadcast_campaigns', 'max_contacts_limit')) {
                    $table->unsignedInteger('max_contacts_limit')->default(2000);
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('broadcast_campaigns')) {
            Schema::table('broadcast_campaigns', function (Blueprint $table) {
                $cols = array_filter(['cost_paise', 'category', 'is_paused', 'max_contacts_limit'], fn ($c) => Schema::hasColumn('broadcast_campaigns', $c));
                if (!empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }

        if (Schema::hasTable('organizations')) {
            Schema::table('organizations', function (Blueprint $table) {
                if (Schema::hasColumn('organizations', 'b2b_agent_id')) {
                    $table->dropConstrainedForeignId('b2b_agent_id');
                }
                $cols = array_filter(['subscription_expires_at', 'subscription_price_paise', 'welcome_bonus_claimed'], fn ($c) => Schema::hasColumn('organizations', $c));
                if (!empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'referred_by_id')) {
                    $table->dropConstrainedForeignId('referred_by_id');
                }
                $cols = array_filter(['referral_code', 'is_b2b_agent'], fn ($c) => Schema::hasColumn('users', $c));
                if (!empty($cols)) {
                    $table->dropColumn($cols);
                }
            });
        }

        Schema::dropIfExists('referral_rewards');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
