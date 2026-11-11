<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('stock_mode', 20)->default('stock')->after('stock');
        });

        DB::table('products')
            ->whereIn('id', DB::table('recipes')
                ->where('status', 'active')
                ->select('product_id'))
            ->where('is_composite', false)
            ->update(['stock_mode' => 'made_to_order']);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('stock_mode');
        });
    }
};
