<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_deals', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('deal_type', ['fixed_price', 'dynamic_price', 'slot_based', 'custom'])->default('fixed_price');
            $table->enum('discount_type', ['percentage', 'fixed_amount', 'fixed_price'])->default('fixed_price');
            $table->decimal('discount_value', 15, 2)->default(0);
            $table->decimal('fixed_price', 15, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('priority')->default(0);
            $table->foreignId('outlet_id')->nullable()->constrained('outlets')->nullOnDelete();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->unsignedInteger('max_per_customer')->nullable();
            $table->unsignedInteger('min_products')->nullable();
            $table->unsignedInteger('max_products')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['is_active', 'priority']);
            $table->index(['deal_type', 'outlet_id']);
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_deals');
    }
};
