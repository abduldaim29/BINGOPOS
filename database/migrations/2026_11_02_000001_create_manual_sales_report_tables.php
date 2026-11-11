<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('manual_sales_reports', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('vendor_name');
            $table->date('report_date');
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('manual_sales_report_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manual_sales_report_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('quantity', 10, 3);
            $table->decimal('unit_rate', 15, 2);
            $table->string('tax_type', 20);
            $table->decimal('tax_value', 10, 2)->default(0);
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_amount', 15, 2);
            $table->decimal('total', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('manual_sales_report_items');
        Schema::dropIfExists('manual_sales_reports');
    }
};
