<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('price_lists')
            ->where(function ($query) {
                $query->where('slug', 'harga-grosir')
                    ->orWhere('name', 'Harga Grosir');
            })
            ->where('customer_scope', 'all')
            ->update([
                'customer_scope' => 'registered',
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        DB::table('price_lists')
            ->where(function ($query) {
                $query->where('slug', 'harga-grosir')
                    ->orWhere('name', 'Harga Grosir');
            })
            ->where('customer_scope', 'registered')
            ->update([
                'customer_scope' => 'all',
                'updated_at' => now(),
            ]);
    }
};
