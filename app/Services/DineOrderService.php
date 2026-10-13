<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\DineOrder;
use App\Models\ProductWarehouse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DineOrderService
{
    public function __construct(
        private PricingService $pricingService,
    ) {}

    public function accept(DineOrder $order): void
    {
        $cashierId = $order->cashier_id ?? auth()->id();
        $shift = CashierShift::with('warehouse.outlet')
            ->where('user_id', $cashierId)
            ->open()
            ->first();

        // ponytail: Without an open shift, there is no warehouse context from which to deduct stock — reject the order instead of accepting it without reducing inventory.
        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => 'There is no active cashier shift. Open a shift before accepting the order.',
            ]);
        }

        $warehouseId = $shift->warehouse_id;

        DB::transaction(function () use ($order, $shift, $warehouseId) {
            // ponytail: Lock the order row to prevent concurrent accept/reject operations.
            $order = DineOrder::with(['items.product.components', 'table.area.outlet'])
                ->whereKey($order->id)
                ->lockForUpdate()
                ->firstOrFail();

            $tableOutletId = $order->table?->area?->outlet_id;
            $shiftOutletId = $shift->warehouse?->outlet_id;

            if ($tableOutletId && $shiftOutletId && $tableOutletId !== $shiftOutletId) {
                throw ValidationException::withMessages([
                    'shift' => 'The cashier shift must belong to the same outlet as the table.',
                ]);
            }

            foreach ($order->items as $item) {
                $product = $item->product;

                if ($product->is_composite) {
                    foreach ($product->components as $component) {
                        $componentQty = $item->qty * (int) round($component->pivot->qty);

                        $pw = ProductWarehouse::where('product_id', $component->id)
                            ->where('warehouse_id', $warehouseId)
                            ->lockForUpdate()
                            ->first();

                        $available = $pw ? (int) $pw->stock : (int) $component->stock;

                        if ($available < $componentQty) {
                            throw ValidationException::withMessages([
                                'stock' => "Insufficient stock for component {$component->title} (available: {$available}).",
                            ]);
                        }

                        $pw?->decrement('stock', $componentQty);
                        $component->decrement('stock', $componentQty);
                    }
                } else {
                    $pw = ProductWarehouse::where('product_id', $product->id)
                        ->where('warehouse_id', $warehouseId)
                        ->lockForUpdate()
                        ->first();

                    $available = $pw ? (int) $pw->stock : (int) $product->stock;

                    if ($available < $item->qty) {
                        throw ValidationException::withMessages([
                            'stock' => "Insufficient stock for {$product->title} (available: {$available}).",
                        ]);
                    }

                    $pw?->decrement('stock', $item->qty);
                    $product->decrement('stock', $item->qty);
                }
            }

            $order->update(['status' => DineOrder::STATUS_ACCEPTED]);
        });
    }

    public function reject(DineOrder $order, ?string $reason = null): void
    {
        $order->update([
            'status' => DineOrder::STATUS_REJECTED,
            'notes' => $order->notes
                ? "{$order->notes}\n[Rejection: {$reason}]"
                : "[Rejection: {$reason}]",
        ]);
    }
}