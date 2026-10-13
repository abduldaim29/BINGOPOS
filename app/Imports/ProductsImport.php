<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Product;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class ProductsImport implements ToModel, WithBatchInserts, WithChunkReading, WithHeadingRow, WithValidation
{
    private int $rowCount = 0;

    public function model(array $row)
    {
        $this->rowCount++;
        $categoryName = trim($row['category'] ?? 'General');
        $category = Category::firstOrCreate(
            ['name' => $categoryName],
            ['description' => '', 'image' => 'default.png']
        );

        $barcode = (string) ($row['barcode'] ?? '');

        return Product::updateOrCreate(
            ['barcode' => $barcode],
            [
                'sku' => $row['sku'] ?? $barcode,
                'title' => $row['name'] ?? '',
                'description' => $row['description'] ?? '',
                'category_id' => $category->id,
                'buy_price' => (int) ($row['purchase_price'] ?? 0),
                'sell_price' => (int) ($row['selling_price'] ?? 0),
                'stock' => (int) ($row['stock'] ?? 0),
                'min_stock' => (int) ($row['min_stock'] ?? 0),
                'max_stock' => (int) ($row['max_stock'] ?? 0),
                'tax_type' => $row['tax_type'] ?? 'exclusive',
                'tax_rate' => (float) ($row['tax_rate'] ?? 11.00),
            ]
        );
    }

    public function rules(): array
    {
        return [
            'barcode' => ['required'],
            'name' => ['required', 'string', 'max:255'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function customValidationMessages()
    {
        return [
            'barcode.required' => 'The barcode is required.',
            'barcode.unique' => 'The barcode is already registered.',
            'name.required' => 'The product name is required.',
        ];
    }

    public function batchSize(): int
    {
        return 100;
    }

    public function chunkSize(): int
    {
        return 100;
    }

    public function getRowCount(): int
    {
        return $this->rowCount;
    }
}