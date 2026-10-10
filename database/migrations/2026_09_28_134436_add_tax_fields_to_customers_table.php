<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Add tax information fields
            $table->string('email')->nullable()->after('no_telp');
            $table->string('tax_id')->nullable()->after('village_name')->comment('Tax registration number');
            $table->string('tax_name')->nullable()->after('tax_id')->comment('Name on tax documents');
            $table->string('cnic')->nullable()->after('tax_name')->comment('Pakistan National Identity Card');
            $table->string('ntn')->nullable()->after('cnic')->comment('National Tax Number');

            // Make regional fields nullable since we're not using Indonesia data
            $table->string('province_id')->nullable()->change();
            $table->string('regency_id')->nullable()->change();
            $table->string('district_id')->nullable()->change();
            $table->string('village_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['email', 'tax_id', 'tax_name', 'cnic', 'ntn']);
        });
    }
};
