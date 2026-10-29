<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('recipe_type', 30)->default('standard');
            $table->decimal('batch_yield', 15, 4)->default(1);
            $table->foreignId('yield_unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->decimal('packaging_cost', 15, 2)->default(0);
            $table->decimal('labour_cost', 15, 2)->default(0);
            $table->decimal('overhead_cost', 15, 2)->default(0);
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->index(['status', 'product_id']);
        });

        Schema::create('recipe_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();
            $table->decimal('quantity', 15, 6);
            $table->decimal('wastage_percent', 5, 2)->default(0);
            $table->decimal('purchase_price', 15, 4)->nullable();
            $table->string('purchase_price_source', 30)->nullable();
            $table->string('purchase_tax_type', 20)->nullable();
            $table->decimal('purchase_tax_rate', 5, 2)->nullable();
            $table->boolean('purchase_tax_included')->default(false);
            $table->timestamps();
            $table->index(['recipe_id', 'product_id']);
        });

        Schema::create('recipe_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recipe_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('title');
            $table->text('instructions');
            $table->unsignedInteger('duration_minutes')->nullable();
            $table->decimal('temperature', 8, 2)->nullable();
            $table->string('temperature_unit', 10)->nullable();
            $table->string('equipment')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipe_steps');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('recipes');
    }
};
