<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $defaultVatRate = Setting::get('tax_default_rate');
        if ($defaultVatRate === null || (float) $defaultVatRate === 11.0) {
            Setting::set('tax_default_rate', '18.00', 'Default VAT rate (%)');
        }

        if (Setting::get('tax_cash_rate') === null) {
            Setting::set('tax_cash_rate', '16.00', 'Cash payment VAT rate (%)');
        }

        if (Setting::get('tax_card_rate') === null) {
            Setting::set('tax_card_rate', '6.00', 'Card payment VAT rate (%)');
        }
    }

    public function down(): void
    {
        // Keep configured tax rates when rolling back application code.
    }
};
