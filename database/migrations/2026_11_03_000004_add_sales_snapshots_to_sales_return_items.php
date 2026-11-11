<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->bigInteger('net_sales_total')->nullable()->after('cost_total');
            $table->bigInteger('tax_refund_total')->nullable()->after('net_sales_total');
        });
    }

    public function down(): void
    {
        Schema::table('sales_return_items', function (Blueprint $table) {
            $table->dropColumn(['net_sales_total', 'tax_refund_total']);
        });
    }
};
