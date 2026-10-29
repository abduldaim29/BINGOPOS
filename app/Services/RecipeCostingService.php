<?php

namespace App\Services;

use App\Models\Product;
use App\Models\PurchaseOrderItem;
use App\Models\Recipe;
use App\Models\RecipeIngredient;

class RecipeCostingService
{
    public function purchaseCost(Product $product, ?int $unitId = null): array
    {
        $unit = $unitId
            ? $product->units()->where('unit_id', $unitId)->first()
            : null;
        $unitPrice = $unit?->pivot->buy_price;

        if ($unitPrice !== null) {
            return ['price' => (float) $unitPrice, 'source' => 'product_unit', 'tax_available' => false];
        }

        $latestPurchase = PurchaseOrderItem::query()
            ->where('product_id', $product->id)
            ->whereHas('purchaseOrder', fn ($query) => $query->whereIn('status', ['received', 'completed']))
            ->latest()
            ->first();

        if ($latestPurchase) {
            return [
                'price' => (float) $latestPurchase->unit_price,
                'source' => 'latest_purchase',
                'tax_available' => false,
            ];
        }

        return ['price' => (float) $product->buy_price, 'source' => 'product_buy_price', 'tax_available' => false];
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
        $sellingPrice = (float) ($recipe->product?->sell_price ?? 0);
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
