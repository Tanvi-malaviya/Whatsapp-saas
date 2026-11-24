<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // 1. Wallets table for organization messaging balance
        Schema::create('wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->unique()->constrained('organizations')->cascadeOnDelete();
            $table->unsignedBigInteger('paid_balance_paise')->default(0);
            $table->unsignedBigInteger('promotional_balance_paise')->default(0);
            $table->timestamps();
        });

        // 2. Wallet transactions ledger
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

        // 3. Referral rewards tracking
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

        // 4. Update users table with referral code, referred_by, and B2B agent role
        Schema::table('users', function (Blueprint $table) {
            $table->string('referral_code', 32)->nullable()->unique();
            $table->foreignId('referred_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_b2b_agent')->default(false);
        });

        // 5. Update organizations table with subscription expiry, price, welcome bonus flag, and assigned B2B agent
        Schema::table('organizations', function (Blueprint $table) {
            $table->timestamp('subscription_expires_at')->nullable();
            $table->unsignedInteger('subscription_price_paise')->default(999900); // ₹9,999
            $table->boolean('welcome_bonus_claimed')->default(false);
            $table->foreignId('b2b_agent_id')->nullable()->constrained('users')->nullOnDelete();
        });

        // 6. Update broadcast_campaigns table with cost, category, paused state and max contacts
        Schema::table('broadcast_campaigns', function (Blueprint $table) {
            $table->unsignedInteger('cost_paise')->default(0);
            $table->string('category', 50)->default('MARKETING');
            $table->boolean('is_paused')->default(false);
            $table->unsignedInteger('max_contacts_limit')->default(2000);
        });
    }

    public function down(): void
    {
        Schema::table('broadcast_campaigns', function (Blueprint $table) {
            $table->dropColumn(['cost_paise', 'category', 'is_paused', 'max_contacts_limit']);
        });

        Schema::table('organizations', function (Blueprint $table) {
            $table->dropConstrainedForeignId('b2b_agent_id');
            $table->dropColumn(['subscription_expires_at', 'subscription_price_paise', 'welcome_bonus_claimed']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('referred_by_id');
            $table->dropColumn(['referral_code', 'is_b2b_agent']);
        });

        Schema::dropIfExists('referral_rewards');
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('wallets');
    }
};
