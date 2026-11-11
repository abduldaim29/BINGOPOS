<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->bigInteger('taxable_amount')->nullable()->after('tax_rate');
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            $table->bigInteger('taxable_amount')->nullable()->after('cost_total');
            $table->bigInteger('gross_sales_amount')->nullable()->after('taxable_amount');
            $table->bigInteger('tax_total')->nullable()->after('taxable_amount');
            $table->decimal('tax_rate', 7, 4)->nullable()->after('tax_total');
            $table->string('tax_type')->nullable()->after('tax_rate');
        });
    }

    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('taxable_amount');
        });

        Schema::table('transaction_details', function (Blueprint $table) {
            $table->dropColumn([
                'taxable_amount',
                'gross_sales_amount',
                'tax_total',
                'tax_rate',
                'tax_type',
            ]);
        });
    }
};
