<?php

namespace App\Http\Controllers\Apps;

use App\Exports\CustomersExport;
use App\Exports\ProductsExport;
use App\Exports\TransactionsExport;
use App\Http\Controllers\Controller;
use App\Imports\CustomersImport;
use App\Imports\ProductsImport;
use App\Models\CashierShift;
use App\Models\Product;
use App\Models\ProductWarehouse;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Facades\Excel;

class ImportExportController extends Controller
{
    public function exportProducts()
    {
        return Excel::download(new ProductsExport, 'products.xlsx');
    }

    public function exportCustomers()
    {
        return Excel::download(new CustomersExport, 'customers.xlsx');
    }

    public function exportTransactions(Request $request)
    {
        return Excel::download(new TransactionsExport($request), 'transactions.xlsx');
    }

    public function importProducts(Request $request)
    {
        try {
            $request->validate([
                'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
            ]);

            $import = new ProductsImport(app(\App\Services\CategoryMergeService::class));
            Excel::import($import, $request->file('file'));
            $this->syncImportedProductsToDefaultWarehouse();

            $successCount = $import->getRowCount();

            return back()->with('success', "Import completed. {$successCount} products imported.");
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errorMessages = collect($failures)->map(function ($failure) {
                return "Row {$failure->row()}: " . implode(', ', $failure->errors());
            })->implode('; ');

            return back()->withErrors([
                'file' => "Validation failed: {$errorMessages}",
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'file' => "Import failed: " . $e->getMessage(),
            ]);
        }
    }

    private function syncImportedProductsToDefaultWarehouse(): void
    {
        $warehouse = CashierShift::query()
            ->where('user_id', auth()->id())
            ->where('status', CashierShift::STATUS_OPEN)
            ->latest('opened_at')
            ->with('warehouse')
            ->first()
            ?->warehouse;

        $warehouse ??= Warehouse::active()
            ->where('type', 'main')
            ->orderBy('sort_order')
            ->orderBy('code')
            ->first()
            ?? Warehouse::active()->orderBy('sort_order')->orderBy('code')->first();

        if (! $warehouse) {
            return;
        }

        Product::query()
            ->whereDoesntHave('warehouses')
            ->each(function (Product $product) use ($warehouse): void {
                ProductWarehouse::updateOrCreate(
                    ['product_id' => $product->id, 'warehouse_id' => $warehouse->id],
                    ['stock' => (int) $product->stock]
                );
            });
    }

    public function importCustomers(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ]);

        $import = new CustomersImport;
        Excel::import($import, $request->file('file'));

        return back()->with('success', 'Customer import completed.');
    }

    public function downloadTemplate(string $type)
    {
        $headings = match ($type) {
            'products' => ['Barcode', 'SKU', 'Name', 'Description', 'Category', 'Purchase Price', 'Selling Price', 'Stock', 'Minimum Stock', 'Maximum Stock', 'Tax Type', 'Tax Rate', 'Image URL'],
            'customers' => ['name', 'phone', 'address'],
            default => abort(404),
        };

        return Excel::download(
            new class($headings) implements FromArray, WithHeadings
            {
                public function __construct(private array $headings) {}

                public function headings(): array
                {
                    return $this->headings;
                }

                public function array(): array
                {
                    return [];
                }
            },
            "template-{$type}.xlsx"
        );
    }
}