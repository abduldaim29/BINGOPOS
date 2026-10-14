<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->foreignId('restaurant_deal_id')->nullable()
                ->constrained('restaurant_deals')
                ->nullOnDelete();
            $table->string('restaurant_deal_name')->nullable();
            $table->string('restaurant_deal_type')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropForeign(['restaurant_deal_id']);
            $table->dropColumn(['restaurant_deal_id', 'restaurant_deal_name', 'restaurant_deal_type']);
        });
    }
};
