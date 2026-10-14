<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('restaurant_deal_items', function (Blueprint $table) {
            $table->foreign('restaurant_deal_slot_id')
                ->references('id')
                ->on('restaurant_deal_slots')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('restaurant_deal_items', function (Blueprint $table) {
            $table->dropForeign(['restaurant_deal_slot_id']);
        });
    }
};
