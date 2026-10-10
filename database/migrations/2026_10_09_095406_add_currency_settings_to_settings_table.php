<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('settings')->insert([
            [
                'key' => 'currency_code',
                'value' => 'PKR',
                'description' => 'Currency code (e.g., PKR, USD, EUR)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'currency_symbol',
                'value' => 'Rs',
                'description' => 'Currency symbol (e.g., Rs, $, €)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'currency_locale',
                'value' => 'en-PK',
                'description' => 'Locale for currency formatting (e.g., en-PK, en-US)',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'currency_decimal_places',
                'value' => '2',
                'description' => 'Number of decimal places for currency',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('settings')->whereIn('key', [
            'currency_code',
            'currency_symbol',
            'currency_locale',
            'currency_decimal_places',
        ])->delete();
    }
};
