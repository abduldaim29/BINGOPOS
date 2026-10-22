<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductWarehouse;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CustomComboCartService
{
    public function __construct(
        private readonly CashierShiftService $cashierShiftService,
        private readonly OutletAccessService $outletAccessService,
        private readonly UnitConversionService $unitConversionService,
    ) {}

    public function addItems(User $user, array $items): array
    {
        $shift = $this->cashierShiftService->getActiveShiftForUser($user->id);
        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => 'Open a cashier shift before adding a custom combo.',
            ]);
        }

        $shift->loadMissing('warehouse');
        if (! $this->outletAccessService->canSellAtWarehouse($user, $shift->warehouse)) {
            abort(403, 'The active outlet is not available for sales.');
        }

        return DB::transaction(function () use ($user, $shift, $items) {
            $prepared = [];
            $products = collect();
            $requiredStock = [];

            foreach ($items as $index => $item) {
                $product = Product::query()
                    ->with(['units', 'components'])
                    ->find($item['product_id']);

                if (! $product) {
                    throw ValidationException::withMessages([
                        "items.{$index}.product_id" => 'This product is no longer available.',
                    ]);
                }

                $products->put($product->id, $product);
                $variations = $product->variations ?? [];
                $variationId = $item['variation_id'] ?? null;

                if ($variations !== [] && ! $variationId) {
                    throw ValidationException::withMessages([
                        "items.{$index}.variation_id" => "Select a variation for {$product->title}.",
                    ]);
                }

                if ($variationId && ! in_array((string) $variationId, array_map('strval', $variations), true)) {
                    throw ValidationException::withMessages([
                        "items.{$index}.variation_id" => "The selected variation for {$product->title} is unavailable.",
                    ]);
                }

                $quantity = (int) $item['quantity'];
                $variationName = $variationId
                    ? ucwords(str_replace('_', ' ', preg_replace('/^[a-z]+_/', '', $variationId)))
                    : null;

                if ($product->is_composite) {
                    if ($variationId || ! empty($item['unit_id'])) {
                        throw ValidationException::withMessages([
                            "items.{$index}" => "Composite product {$product->title} cannot use a variation or unit.",
                        ]);
                    }

                    $unitId = null;
                    $conversionFactor = 1;
                    $unitPrice = (int) $product->components->sum(
                        fn (Product $component) => $component->sell_price * (float) $component->pivot->qty
                    );

                    foreach ($product->components as $component) {
                        $products->put($component->id, $component);
                        $this->addStockRequirement(
                            $requiredStock,
                            $component->id,
                            (int) round((float) $component->pivot->qty * $quantity)
                        );
                    }
                } else {
                    $baseUnit = $product->units->first(fn ($unit) => (bool) $unit->pivot->is_base);
                    $unitId = $variationId
                        ? $baseUnit?->id
                        : (! empty($item['unit_id'])
                            ? (int) $item['unit_id']
                            : $baseUnit?->id);

                    $unit = $unitId
                        ? $product->units->firstWhere('id', $unitId)
                        : null;
                    if (! empty($item['unit_id']) && ! $unit) {
                        throw ValidationException::withMessages([
                            "items.{$index}.unit_id" => "The selected unit is not available for {$product->title}.",
                        ]);
                    }

                    $conversionFactor = $unit
                        ? (float) $unit->pivot->conversion_factor
                        : 1;
                    $unitPrice = $variationId
                        ? (int) (($product->variation_prices ?? [])[$variationId] ?? 0)
                        : 0;
                    if ($unitPrice <= 0) {
                        $unitPrice = $unit
                            ? $this->unitConversionService->getSellPrice($product, $unitId)
                            : (int) $product->sell_price;
                    }

                    $baseQuantity = $unitId
                        ? $this->unitConversionService->toBaseUnit($product, $unitId, $quantity)
                        : $quantity;
                    $this->addStockRequirement(
                        $requiredStock,
                        $product->id,
                        $baseQuantity
                    );
                }

                $prepared[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_id' => $unitId,
                    'conversion_factor' => $conversionFactor,
                    'variation_id' => $variationId,
                    'variation_name' => $variationName,
                    'unit_price' => $unitPrice,
                ];
            }

            $existingCarts = Cart::query()
                ->with('product.components')
                ->where('cashier_id', $user->id)
                ->where('warehouse_id', $shift->warehouse_id)
                ->active()
                ->lockForUpdate()
                ->get();

            foreach ($existingCarts as $cart) {
                if (! $cart->product) {
                    continue;
                }

                if ($cart->product->is_composite) {
                    foreach ($cart->product->components as $component) {
                        $products->put($component->id, $component);
                        $this->addStockRequirement(
                            $requiredStock,
                            $component->id,
                            (int) round((float) $component->pivot->qty * $cart->qty)
                        );
                    }
                } else {
                    $products->put($cart->product->id, $cart->product);
                    $this->addStockRequirement(
                        $requiredStock,
                        $cart->product_id,
                        (int) round($cart->qty * (float) $cart->conversion_factor)
                    );
                }
            }

            $stockRows = $shift->warehouse_id
                ? ProductWarehouse::query()
                    ->where('warehouse_id', $shift->warehouse_id)
                    ->whereIn('product_id', array_keys($requiredStock))
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('product_id')
                : collect();

            foreach ($requiredStock as $productId => $required) {
                $available = $shift->warehouse_id
                    ? (int) ($stockRows->get($productId)?->stock ?? 0)
                    : (int) ($products->get($productId)?->stock ?? 0);

                if ($required > $available) {
                    $title = $products->get($productId)?->title ?? 'A selected product';
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for {$title}. Available: {$available}.",
                    ]);
                }
            }

            foreach ($prepared as $item) {
                $product = $item['product'];
                $lineTotal = $item['unit_price'] * $item['quantity'];
                $cartQuery = Cart::query()
                    ->where('cashier_id', $user->id)
                    ->where('warehouse_id', $shift->warehouse_id)
                    ->where('product_id', $product->id)
                    ->where('unit_id', $item['unit_id'])
                    ->where('variation_id', $item['variation_id'])
                    ->whereNull('hold_id')
                    ->lockForUpdate();
                $cart = $cartQuery->first();

                if ($cart) {
                    $cart->qty += $item['quantity'];
                    $cart->price += $lineTotal;
                    $cart->save();
                } else {
                    Cart::query()->create([
                        'cashier_id' => $user->id,
                        'warehouse_id' => $shift->warehouse_id,
                        'product_id' => $product->id,
                        'unit_id' => $item['unit_id'],
                        'conversion_factor' => $item['conversion_factor'],
                        'qty' => $item['quantity'],
                        'price' => $lineTotal,
                        'variation_id' => $item['variation_id'],
                        'variation_name' => $item['variation_name'],
                    ]);
                }
            }

            return [
                'items_added' => count($prepared),
                'cart_item_count' => Cart::query()
                    ->where('cashier_id', $user->id)
                    ->where('warehouse_id', $shift->warehouse_id)
                    ->active()
                    ->sum('qty'),
            ];
        });
    }

    private function addStockRequirement(array &$requirements, int $productId, int $quantity): void
    {
        $requirements[$productId] = ($requirements[$productId] ?? 0) + $quantity;
    }
}
