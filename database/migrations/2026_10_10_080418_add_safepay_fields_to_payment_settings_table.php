<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_settings', function (Blueprint $table) {
            $table->boolean('safepay_enabled')->default(false)->after('xendit_production');
            $table->string('safepay_aggregator_id')->nullable()->after('safepay_enabled');
            $table->string('safepay_secret_key')->nullable()->after('safepay_aggregator_id');
            $table->string('safepay_webhook_secret')->nullable()->after('safepay_secret_key');
            $table->string('safepay_aggregator_merchant_identifier')->nullable()->after('safepay_webhook_secret');
            $table->boolean('safepay_production')->default(false)->after('safepay_aggregator_merchant_identifier');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_settings', function (Blueprint $table) {
            $table->dropColumn([
                'safepay_enabled',
                'safepay_aggregator_id',
                'safepay_secret_key',
                'safepay_webhook_secret',
                'safepay_aggregator_merchant_identifier',
                'safepay_production',
            ]);
        });
    }
};
