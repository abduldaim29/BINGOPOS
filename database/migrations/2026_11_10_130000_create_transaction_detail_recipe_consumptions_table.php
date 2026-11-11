<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('transaction_detail_recipe_consumptions')) {
            Schema::create('transaction_detail_recipe_consumptions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('transaction_detail_id');
                $table->foreignId('recipe_id')->nullable();
                $table->foreignId('ingredient_product_id');
                $table->foreignId('unit_id')->nullable();
                $table->foreignId('warehouse_id')->nullable();
                $table->decimal('quantity_per_sold_unit', 15, 6);
                $table->decimal('base_quantity_consumed', 15, 6);
                $table->json('batch_allocations')->nullable();
                $table->timestamps();

                $table->index(['transaction_detail_id', 'ingredient_product_id'], 'detail_recipe_consumptions_detail_product_idx');
            });
        }

        Schema::table('transaction_detail_recipe_consumptions', function (Blueprint $table) {
            $table->foreign('transaction_detail_id', 'tdrc_detail_fk')
                ->references('id')->on('transaction_details')->cascadeOnDelete();
            $table->foreign('recipe_id', 'tdrc_recipe_fk')
                ->references('id')->on('recipes')->nullOnDelete();
            $table->foreign('ingredient_product_id', 'tdrc_ingredient_fk')
                ->references('id')->on('products')->restrictOnDelete();
            $table->foreign('unit_id', 'tdrc_unit_fk')
                ->references('id')->on('units')->nullOnDelete();
            $table->foreign('warehouse_id', 'tdrc_warehouse_fk')
                ->references('id')->on('warehouses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_detail_recipe_consumptions');
    }
};
