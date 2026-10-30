<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commerce_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name');
            $table->string('retailer_id')->nullable(); // SKU
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2)->default(0.00);
            $table->string('currency', 10)->default('INR');
            $table->text('image_url')->nullable();
            $table->string('category')->nullable();
            $table->boolean('is_available')->default(true);
            $table->string('meta_catalog_id')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'is_available']);
        });

        Schema::create('commerce_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('order_number')->unique();
            $table->string('customer_name')->nullable();
            $table->string('customer_phone');
            $table->decimal('total_amount', 10, 2)->default(0.00);
            $table->string('currency', 10)->default('INR');
            $table->string('status')->default('pending'); // pending, paid, shipped, delivered, cancelled
            $table->json('items')->nullable();
            $table->string('meta_order_id')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commerce_orders');
        Schema::dropIfExists('commerce_products');
    }
};
