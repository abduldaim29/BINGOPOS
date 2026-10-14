<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_deal_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_deal_id')
                ->constrained('restaurant_deals')
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->foreignId('restaurant_deal_slot_id')->nullable();
            $table->boolean('is_required')->default(true);
            $table->unsignedInteger('min_qty')->default(1);
            $table->unsignedInteger('max_qty')->default(1);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['restaurant_deal_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_deal_items');
    }
};
