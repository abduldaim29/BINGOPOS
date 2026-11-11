<?php

namespace App\Services;

use App\Models\Product;
use App\Models\PurchaseOrderItem;
use App\Models\Recipe;
use App\Models\RecipeIngredient;
use Illuminate\Support\Collection;

class RecipeCostingService
{
    public function basePurchaseCostsFor(Collection $products): array
    {
        $productIds = $products->pluck('id')->all();
        if (! $productIds) {
            return [];
        }

        $latestPurchaseIds = PurchaseOrderItem::query()
            ->whereIn('product_id', $productIds)
            ->whereHas('purchaseOrder', fn ($query) => $query->whereIn('status', ['received', 'completed']))
            ->selectRaw('MAX(id)')
            ->groupBy('product_id');
        $latestPurchases = PurchaseOrderItem::query()
            ->whereIn('id', $latestPurchaseIds)
            ->get(['product_id', 'unit_price'])
            ->keyBy('product_id');

        return $products->mapWithKeys(function (Product $product) use ($latestPurchases) {
            $baseUnit = $product->units->firstWhere('pivot.is_base', true);
            $unitPrice = $baseUnit?->pivot->buy_price;
            $purchase = $latestPurchases->get($product->id);
            $price = $unitPrice !== null
                ? (float) $unitPrice
                : ($purchase ? (float) $purchase->unit_price : (float) $product->buy_price);

            return [$product->id => $price];
        })->all();
    }

    public function purchaseCost(Product $product, ?int $unitId = null): array
    {
        $units = $product->units;
        $unit = $unitId
            ? $units->firstWhere('id', $unitId)
            : $units->firstWhere('pivot.is_base', true);
        $unitPrice = $unit?->pivot->buy_price;

        if ($unitPrice !== null) {
            return ['price' => (float) $unitPrice, 'source' => 'product_unit', 'tax_available' => false];
        }

        $baseUnit = $units->firstWhere('pivot.is_base', true);
        $baseFactor = max(0.000001, (float) ($baseUnit?->pivot->conversion_factor ?? 1));
        $selectedFactor = (float) ($unit?->pivot->conversion_factor ?? $baseFactor);
        $unitFactor = $selectedFactor / $baseFactor;

        $latestPurchase = PurchaseOrderItem::query()
            ->where('product_id', $product->id)
            ->whereHas('purchaseOrder', fn ($query) => $query->whereIn('status', ['received', 'completed']))
            ->latest()
            ->first();

        if ($latestPurchase) {
            return [
                'price' => (float) $latestPurchase->unit_price * $unitFactor,
                'source' => 'latest_purchase',
                'tax_available' => false,
            ];
        }

        return [
            'price' => (float) $product->buy_price * $unitFactor,
            'source' => 'product_buy_price',
            'tax_available' => false,
        ];
    }

    private function ingredientCost(RecipeIngredient $ingredient): array
    {
        if ($ingredient->purchase_price !== null && $ingredient->purchase_price !== '') {
            return [
                'price' => (float) $ingredient->purchase_price,
                'source' => 'manual_override',
                'tax_available' => false,
            ];
        }

        return $this->purchaseCost($ingredient->product, $ingredient->unit_id);
    }

    public function calculate(Recipe $recipe): array
    {
        $recipe->loadMissing(['ingredients.product.units', 'ingredients.unit', 'product']);
        $beforeTax = 0.0;
        $tax = 0.0;
        $rows = [];

        foreach ($recipe->ingredients as $ingredient) {
            $cost = $ingredient->product
                ? $this->ingredientCost($ingredient)
                : [
                    'price' => (float) ($ingredient->purchase_price ?? 0),
                    'source' => 'manual_override',
                    'tax_available' => false,
                ];
            $netQuantity = (float) $ingredient->quantity;
            $wastage = (float) $ingredient->wastage_percent;
            $grossQuantity = $netQuantity / max(0.000001, 1 - ($wastage / 100));
            $lineBeforeTax = $grossQuantity * $cost['price'];
            $lineTax = 0.0;

            $beforeTax += $lineBeforeTax;
            $tax += $lineTax;
            $rows[] = [
                'id' => $ingredient->id,
                'product_id' => $ingredient->product_id,
                'ingredient_name' => $ingredient->ingredient_name,
                'product' => $ingredient->product,
                'unit' => $ingredient->unit,
                'quantity' => $netQuantity,
                'unit_conversion_factor' => $ingredient->product && $ingredient->unit_id
                    ? (float) ($ingredient->product->units->firstWhere('id', $ingredient->unit_id)?->pivot->conversion_factor ?? 1)
                    : 1,
                'gross_quantity' => $grossQuantity,
                'wastage_percent' => $wastage,
                'purchase_price' => $cost['price'],
                'purchase_price_source' => $cost['source'],
                'purchase_tax_available' => $cost['tax_available'],
                'purchase_tax_rate' => null,
                'purchase_tax_amount' => $lineTax,
                'total_cost' => $lineBeforeTax + $lineTax,
            ];
        }

        $additional = (float) $recipe->packaging_cost + (float) $recipe->labour_cost + (float) $recipe->overhead_cost;
        $total = $beforeTax + $tax + $additional;
        $yield = max(0.0001, (float) $recipe->batch_yield);
        $perYield = $total / $yield;
        $product = $recipe->product;
        $variationPrices = $product?->variation_prices ?? [];
        $sellingPrice = (float) ($recipe->variation_id
            ? ($variationPrices[$recipe->variation_id] ?? $product?->sell_price ?? 0)
            : ($product?->sell_price ?? 0));
        $profit = $sellingPrice - $perYield;

        return [
            'rows' => $rows,
            'ingredient_count' => count($rows),
            'ingredient_cost_before_tax' => $beforeTax,
            'purchase_tax' => $tax,
            'ingredient_cost_after_tax' => $beforeTax + $tax,
            'packaging_cost' => (float) $recipe->packaging_cost,
            'labour_cost' => (float) $recipe->labour_cost,
            'overhead_cost' => (float) $recipe->overhead_cost,
            'total_cost' => $total,
            'batch_yield' => $yield,
            'cost_per_yield' => $perYield,
            'selling_price' => $sellingPrice,
            'gross_profit' => $profit,
            'gross_margin' => $sellingPrice > 0 ? ($profit / $sellingPrice) * 100 : null,
            'purchase_tax_note' => 'Purchase tax is not available in the current purchasing records; no tax has been assumed.',
        ];
    }
}
