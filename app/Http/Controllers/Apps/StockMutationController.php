<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductWarehouse;
use App\Models\StockMutation;
use App\Services\OutletAccessService;
use App\Services\StockMutationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class StockMutationController extends Controller
{
    public function __construct(
        private readonly OutletAccessService $outletAccessService,
        private readonly StockMutationService $stockMutationService
    ) {}

    public function index(Request $request): Response
    {
        $filters = [
            'product_id' => $request->input('product_id'),
            'mutation_type' => $request->input('mutation_type'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
        ];

        $stockMutations = StockMutation::query()
            ->with(['product:id,title,barcode,sku', 'creator:id,name', 'warehouse:id,code,name'])
            ->when($filters['product_id'], fn ($query, $productId) => $query->where('product_id', $productId))
            ->when($filters['mutation_type'], fn ($query, $mutationType) => $query->where('mutation_type', $mutationType))
            ->when($filters['date_from'], fn ($query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'], fn ($query, $date) => $query->whereDate('created_at', '<=', $date))
            ->when($filters['warehouse_id'], fn ($query, $warehouseId) => $query->where('warehouse_id', $warehouseId))
            ->where(function ($query) use ($request) {
                $warehouseIds = $this->outletAccessService->warehousesFor($request->user())->pluck('id');
                $query->whereIn('warehouse_id', $warehouseIds)->orWhereNull('warehouse_id');
            })
            ->latest()
            ->paginate($this->perPage())->withQueryString()
            ->withQueryString();

        return Inertia::render('Dashboard/StockMutations/Index', [
            'stockMutations' => $stockMutations,
            'products' => Product::query()->orderBy('title')->get(['id', 'title', 'barcode', 'sku']),
            'warehouses' => $this->outletAccessService->warehousesFor($request->user()),
            'filters' => $filters,
        ]);
    }

    public function updateStock(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'adjustment_type' => ['required', 'in:set,add,remove'],
            'quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        abort_unless(
            $this->outletAccessService->canUseWarehouse(
                $request->user(),
                \App\Models\Warehouse::find($validated['warehouse_id'])
            ),
            403
        );

        DB::transaction(function () use ($validated, $request) {
            $product = Product::lockForUpdate()->findOrFail($validated['product_id']);
            $warehouseStock = ProductWarehouse::query()
                ->where('product_id', $product->id)
                ->where('warehouse_id', $validated['warehouse_id'])
                ->lockForUpdate()
                ->first();
            $stockBefore = (int) ($warehouseStock?->stock ?? 0);

            $stockAfter = match ($validated['adjustment_type']) {
                'set' => (int) $validated['quantity'],
                'add' => $stockBefore + (int) $validated['quantity'],
                'remove' => $stockBefore - (int) $validated['quantity'],
            };

            if ($stockAfter < 0) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stock cannot be reduced below zero.',
                ]);
            }

            ProductWarehouse::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'warehouse_id' => $validated['warehouse_id'],
                ],
                ['stock' => $stockAfter]
            );

            $product->update(['stock' => $product->stockTotal()]);

            if ($stockBefore !== $stockAfter) {
                $this->stockMutationService->recordManualAdjustment(
                    $product,
                    (int) $validated['warehouse_id'],
                    $stockBefore,
                    $stockAfter,
                    $validated['notes'] ?? null,
                    $request->user()?->id
                );
            }
        });

        return back()->with('success', 'Stock updated successfully.');
    }
}