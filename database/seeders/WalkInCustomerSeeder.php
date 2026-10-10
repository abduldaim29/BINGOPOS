<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class WalkInCustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or update the WalkIn-01 customer
        Customer::updateOrCreate(
            ['is_walkin' => true],
            [
                'name' => 'Walk In Customer',
                'no_telp' => 999999999999, // Use a placeholder phone number
                'email' => null,
                'address' => 'Walk-in Customer', // Provide a placeholder address
                'is_loyalty_member' => false,
                'is_walkin' => true,
                'member_code' => null,
                'loyalty_tier' => 'regular', // Default loyalty tier
                'loyalty_points' => 0,
                'loyalty_total_spent' => 0,
                'loyalty_transaction_count' => 0,
                'loyalty_member_since' => null,
                'last_purchase_at' => null,
                'province_id' => null,
                'province_name' => null,
                'regency_id' => null,
                'regency_name' => null,
                'district_id' => null,
                'district_name' => null,
                'village_id' => null,
                'village_name' => null,
                'tax_id' => null,
                'tax_name' => null,
                'cnic' => null,
                'ntn' => null,
            ]
        );
    }
}
