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

        // Handle both naming conventions: 'category' and 'Category'
        $categoryName = trim($row['category'] ?? $row['Category'] ?? 'General');
        $category = Category::firstOrCreate(
            ['name' => $categoryName],
            ['description' => '', 'image' => 'default.png']
        );

        // Handle both naming conventions: 'barcode' and 'Barcode'
        $barcode = (string) ($row['barcode'] ?? $row['Barcode'] ?? '');
        if (empty($barcode)) {
            // Generate barcode if not provided
            $barcode = '20' . substr((string) time(), -10) . str_pad((string) rand(0, 9999), 4, '0', STR_PAD_LEFT);
        }

        // Handle both naming conventions for other fields
        $sku = $row['sku'] ?? $row['SKU'] ?? $barcode;
        $name = $row['name'] ?? $row['Product Name'] ?? $row['Name'] ?? '';
        $description = $row['description'] ?? $row['Description'] ?? '';
        $purchasePrice = $row['purchase_price'] ?? $row['Purchase Price'] ?? 0;
        $sellingPrice = $row['selling_price'] ?? $row['Selling Price'] ?? 0;
        $stock = $row['stock'] ?? $row['Stock'] ?? 0;
        $minStock = $row['min_stock'] ?? $row['Minimum Stock'] ?? 0;
        $maxStock = $row['max_stock'] ?? $row['Maximum Stock'] ?? 0;

        return Product::updateOrCreate(
            ['barcode' => $barcode],
            [
                'sku' => $sku,
                'title' => $name,
                'description' => $description,
                'category_id' => $category->id,
                'buy_price' => (int) $purchasePrice,
                'sell_price' => (int) $sellingPrice,
                'stock' => (int) $stock,
                'min_stock' => (int) $minStock,
                'max_stock' => (int) $maxStock,
                'tax_type' => $row['tax_type'] ?? $row['Tax Type'] ?? 'exclusive',
                'tax_rate' => (float) ($row['tax_rate'] ?? $row['Tax Rate'] ?? 18.00),
                'image' => 'default.png', // Use default image since import doesn't handle base64 images
            ]
        );
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    public function customValidationMessages()
    {
        return [
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