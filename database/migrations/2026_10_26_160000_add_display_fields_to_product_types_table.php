<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_types', function (Blueprint $table) {
            if (! Schema::hasColumn('product_types', 'short_name')) {
                $table->string('short_name', 80)->nullable()->after('name');
            }
            if (! Schema::hasColumn('product_types', 'sort_order')) {
                $table->unsignedInteger('sort_order')->default(0)->after('is_active');
            }
            if (! Schema::hasColumn('product_types', 'color')) {
                $table->string('color', 7)->nullable()->after('sort_order');
            }
        });
    }

    public function down(): void
    {
        Schema::table('product_types', function (Blueprint $table) {
            foreach (['short_name', 'color'] as $column) {
                if (Schema::hasColumn('product_types', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
