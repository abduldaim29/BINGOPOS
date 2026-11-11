<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductWarehouse;
use App\Models\Recipe;
use App\Models\TransactionDetail;
use App\Models\TransactionDetailRecipeConsumption;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;

class RecipeInventoryService
{
    public function __construct(private readonly RecipeCostingService $costing) {}

    public function recipeForSale(Product $product, ?string $variationId): ?Recipe
    {
        $query = Recipe::query()
            ->where('product_id', $product->id)
            ->where('status', 'active')
            ->with(['ingredients.product.units', 'ingredients.unit']);

        if ($variationId !== null && $variationId !== '') {
            $query->where('variation_id', $variationId);
        } else {
            $query->whereNull('variation_id');
        }

        $recipe = $query->latest('id')->first();

        if (
            ($variationId === null || $variationId === '')
            && $recipe
            && $recipe->ingredients->contains(fn ($ingredient) => ! $ingredient->product_id)
        ) {
            return null;
        }

        return $recipe;
    }

    public function costForQuantity(Recipe $recipe, int $quantity): int
    {
        $costPerYield = (float) $this->costing->calculate($recipe)['cost_per_yield'];

        return (int) round($costPerYield * $quantity);
    }

    public function consume(
        TransactionDetail $detail,
        Recipe $recipe,
        int $soldQuantity,
        ?int $warehouseId
    ): void {
        if ($recipe->ingredients->isEmpty()) {
            throw ValidationException::withMessages([
                'stock' => "The active recipe [{$recipe->name}] has no ingredients configured.",
            ]);
        }

        $yield = max(0.0001, (float) $recipe->batch_yield);
        $plans = [];

        foreach ($recipe->ingredients as $ingredient) {
            if (! $ingredient->product_id) {
                throw ValidationException::withMessages([
                    'stock' => "Map every ingredient in the active recipe [{$recipe->name}] to an inventory product before selling this variation.",
                ]);
            }

            $ingredientProduct = $ingredient->product;
            if (! $ingredientProduct || $ingredientProduct->is_composite) {
                throw ValidationException::withMessages([
                    'stock' => "The recipe ingredient [{$ingredient->ingredient_name}] is unavailable or is a composite product.",
                ]);
            }

            $baseFactor = 1.0;
            $selectedFactor = 1.0;
            if ($ingredient->unit_id) {
                $baseUnit = $ingredientProduct->units->firstWhere('pivot.is_base', true);
                $selectedUnit = $ingredientProduct->units->firstWhere('id', $ingredient->unit_id);

                if (! $selectedUnit) {
                    throw ValidationException::withMessages([
                        'stock' => "The recipe unit for [{$ingredient->ingredient_name}] is not configured on its inventory product.",
                    ]);
                }

                $baseFactor = max(0.000001, (float) ($baseUnit?->pivot->conversion_factor ?? 1));
                $selectedFactor = (float) ($selectedUnit->pivot->conversion_factor ?? 1);
            }

            $netQuantity = (float) $ingredient->quantity;
            $wastage = (float) $ingredient->wastage_percent;
            $grossQuantity = $netQuantity / max(0.000001, 1 - ($wastage / 100));
            $quantityPerSoldUnit = ($grossQuantity / $yield) * ($selectedFactor / $baseFactor);

            $plans[] = [
                'ingredient' => $ingredient,
                'product_id' => (int) $ingredient->product_id,
                'quantity_per_sold_unit' => $quantityPerSoldUnit,
                'base_quantity_consumed' => $quantityPerSoldUnit * $soldQuantity,
            ];
        }

        $groupedPlans = collect($plans)->groupBy('product_id')->sortKeys();

        foreach ($groupedPlans as $productId => $productPlans) {
            $totalQuantity = (float) $productPlans->sum('base_quantity_consumed');
            $integerQuantity = (int) round($totalQuantity);
            if ($integerQuantity < 1 || abs($totalQuantity - $integerQuantity) > 0.000001) {
                throw ValidationException::withMessages([
                    'stock' => "The recipe quantity for [{$productPlans->first()['ingredient']->ingredient_name}] does not convert to a whole base inventory unit. Set the ingredient product's base unit to its smallest stockable unit.",
                ]);
            }

            $product = Product::query()
                ->whereKey($productId)
                ->lockForUpdate()
                ->first();

            if (! $product) {
                throw ValidationException::withMessages([
                    'stock' => "An inventory product in recipe [{$recipe->name}] is no longer available.",
                ]);
            }

            $warehouseProduct = $warehouseId
                ? ProductWarehouse::query()
                    ->where('product_id', $product->id)
                    ->where('warehouse_id', $warehouseId)
                    ->lockForUpdate()
                    ->first()
                : null;
            $available = $warehouseProduct ? (int) $warehouseProduct->stock : (int) $product->stock;

            if ($available < $integerQuantity) {
                throw ValidationException::withMessages([
                    'stock' => "Insufficient stock for recipe ingredient {$product->title}. Available: {$available}.",
                ]);
            }

            if ($warehouseProduct) {
                $warehouseProduct->decrement('stock', $integerQuantity);
            }
            $product->decrement('stock', $integerQuantity);

            $batchAllocations = [];
            if ($warehouseId) {
                $batches = ProductBatch::query()
                    ->where('product_id', $product->id)
                    ->where('warehouse_id', $warehouseId)
                    ->where('stock', '>', 0)
                    ->where(function (Builder $query) {
                        $query->whereNull('expired_at')->orWhere('expired_at', '>', now());
                    })
                    ->orderBy('expired_at')
                    ->orderBy('received_at')
                    ->lockForUpdate()
                    ->get();

                if ($batches->isNotEmpty()) {
                    $covered = (int) $batches->sum('stock');
                    if ($covered < $integerQuantity) {
                        throw ValidationException::withMessages([
                            'stock' => "Insufficient batch stock for recipe ingredient {$product->title}. Available: {$covered}.",
                        ]);
                    }

                    $remaining = $integerQuantity;
                    foreach ($batches as $batch) {
                        if ($remaining <= 0) {
                            break;
                        }

                        $take = min((int) $batch->stock, $remaining);
                        $batch->decrement('stock', $take);
                        $remaining -= $take;
                        $batchAllocations[] = [
                            'product_batch_id' => $batch->id,
                            'quantity' => $take,
                        ];
                    }
                }
            }

            foreach ($productPlans->values() as $index => $plan) {
                TransactionDetailRecipeConsumption::query()->create([
                    'transaction_detail_id' => $detail->id,
                    'recipe_id' => $recipe->id,
                    'ingredient_product_id' => $product->id,
                    'unit_id' => $plan['ingredient']->unit_id,
                    'warehouse_id' => $warehouseId,
                    'quantity_per_sold_unit' => $plan['quantity_per_sold_unit'],
                    'base_quantity_consumed' => $plan['base_quantity_consumed'],
                    'batch_allocations' => $index === 0 && $batchAllocations ? $batchAllocations : null,
                ]);
            }
        }
    }
}
