<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        foreach ([
            'brand_ntn' => 'Brand NTN / CNIC',
            'brand_strn' => 'Brand STRN',
        ] as $key => $description) {
            $exists = Setting::where('key', $key)
                ->whereNull('outlet_id')
                ->exists();

            if (! $exists) {
                Setting::set($key, '', $description);
            }
        }
    }

    public function down(): void
    {
        Setting::whereIn('key', ['brand_ntn', 'brand_strn'])
            ->whereNull('outlet_id')
            ->where('value', '')
            ->delete();
    }
};
