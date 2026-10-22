<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('restaurant_deal_items', function (Blueprint $table) {
            $table->decimal('deal_price', 10, 2)->nullable()->after('sort_order');
            $table->json('deal_variation_prices')->nullable()->after('deal_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('restaurant_deal_items', function (Blueprint $table) {
            $table->dropColumn(['deal_price', 'deal_variation_prices']);
        });
    }
};
