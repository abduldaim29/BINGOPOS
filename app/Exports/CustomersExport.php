<?php

namespace App\Exports;

use App\Models\Customer;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class CustomersExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping
{
    public function collection()
    {
        return Customer::orderBy('name')->get();
    }

    public function headings(): array
    {
        return [
            'Name',
            'Phone',
            'Address',
            'Province',
            'City',
            'District',
            'Village',
            'Member',
            'Tier',
            'Points'
        ];
    }

    public function map($customer): array
    {
        return [
            $customer->name,
            $customer->no_telp ?? '',
            $customer->address ?? '',
            $customer->province_name ?? '',
            $customer->regency_name ?? '',
            $customer->district_name ?? '',
            $customer->village_name ?? '',
            $customer->is_loyalty_member ? 'Yes' : 'No',
            $customer->loyalty_tier ?? 'regular',
            (int) ($customer->loyalty_points ?? 0),
        ];
    }
}