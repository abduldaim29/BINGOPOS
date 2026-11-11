<?php

namespace App\Imports;

use App\Models\Category;
use App\Models\Product;
use App\Services\CategoryMergeService;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithBatchInserts;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\WithValidation;

class ProductsImport implements ToModel, WithBatchInserts, WithChunkReading, WithHeadingRow, WithUpserts, WithValidation
{
    private int $rowCount = 0;

    public function __construct(private readonly CategoryMergeService $categories) {}

    public function model(array $row)
    {
        $this->rowCount++;

        // Handle both naming conventions: 'category' and 'Category'
        $categoryName = trim($row['category'] ?? $row['Category'] ?? 'General');
        $category = $this->categories->findOrCreate($categoryName);

        // Handle both naming conventions: 'barcode' and 'Barcode'
        $barcode = trim((string) ($row['barcode'] ?? $row['Barcode'] ?? ''));
        if (empty($barcode)) {
            do {
                $barcode = '20' . substr((string) time(), -10) . str_pad((string) random_int(0, 9999), 4, '0', STR_PAD_LEFT);
            } while (Product::where('barcode', $barcode)->exists());
        }
        $existingProduct = Product::where('barcode', $barcode)->first();

        // Handle both naming conventions for other fields
        $sku = trim((string) ($row['sku'] ?? $row['SKU'] ?? ''));
        $sku = $sku !== '' ? $sku : $barcode;
        $name = $row['name'] ?? $row['Product Name'] ?? $row['Name'] ?? $existingProduct?->title ?? '';
        $description = $row['description'] ?? $row['Description'] ?? $existingProduct?->description ?? '';
        $purchasePrice = $row['purchase_price'] ?? $row['Purchase Price'] ?? $existingProduct?->buy_price ?? 0;
        $sellingPrice = $row['selling_price'] ?? $row['Selling Price'] ?? $existingProduct?->sell_price ?? 0;
        $stock = $row['stock'] ?? $row['Stock'] ?? $existingProduct?->stock ?? 0;
        $minStock = $row['min_stock'] ?? $row['Minimum Stock'] ?? $existingProduct?->min_stock ?? 0;
        $maxStock = $row['max_stock'] ?? $row['Maximum Stock'] ?? $existingProduct?->max_stock ?? 0;
        $image = trim((string) (
            $row['image_url']
            ?? $row['Image URL']
            ?? $row['product_image']
            ?? $row['Product Image']
            ?? $row['image']
            ?? ''
        ));
        if ($image === '') {
            $image = 'default.png';
        }

        return new Product([
            'barcode' => $barcode,
            'sku' => $sku,
            'title' => $name,
            'description' => $description,
            'category_id' => $categoryName !== 'General'
                ? $category->id
                : ($existingProduct?->category_id ?? $category->id),
            'buy_price' => (float) $purchasePrice,
            'sell_price' => (float) $sellingPrice,
            'stock' => (int) $stock,
            'min_stock' => (int) $minStock,
            'max_stock' => (int) $maxStock,
            'tax_type' => $row['tax_type'] ?? $row['Tax Type'] ?? $existingProduct?->tax_type ?? 'exclusive',
            'tax_rate' => (float) ($row['tax_rate'] ?? $row['Tax Rate'] ?? $existingProduct?->tax_rate ?? 18.00),
            'image' => $image !== 'default.png' ? $image : ($existingProduct?->image ?? $image),
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'purchase_price' => ['nullable', 'numeric', 'min:0'],
            'selling_price' => ['nullable', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'url', 'max:2048'],
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

    public function uniqueBy(): string
    {
        return 'barcode';
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