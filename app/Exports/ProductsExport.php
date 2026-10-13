<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProductsExport implements FromCollection, ShouldAutoSize, WithHeadings, WithMapping
{
    public function collection()
    {
        return Product::with('category')->orderBy('title')->get();
    }

    public function headings(): array
    {
        return [
            'Barcode',
            'SKU',
            'Name',
            'Category',
            'Purchase Price',
            'Selling Price',
            'Stock',
            'Minimum Stock',
            'Maximum Stock',
            'Tax Type',
            'Tax Rate'
        ];
    }

    public function map($product): array
    {
        return [
            $product->barcode,
            $product->sku,
            $product->title,
            $product->category?->name ?? '',
            (int) $product->buy_price,
            (int) $product->sell_price,
            (int) $product->stock,
            (int) ($product->min_stock ?? 0),
            (int) ($product->max_stock ?? 0),
            $product->tax_type ?? 'exclusive',
            (float) ($product->tax_rate ?? 18.00),
        ];
    }
}