<?php

namespace Tests\Feature\Recipes;

use App\Models\Category;
use App\Models\Product;
use App\Models\Recipe;
use App\Models\Unit;
use App\Services\RecipeCostingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RecipeVariationCostingTest extends TestCase
{
    use RefreshDatabase;

    public function test_recipe_cost_converts_grams_from_a_kilogram_base_unit(): void
    {
        $category = Category::create([
            'name' => 'Recipe costing',
            'image' => 'categories/recipe-costing.png',
            'description' => 'Recipe costing tests',
        ]);
        $kilogram = Unit::create([
            'code' => 'KG-'.Str::upper(Str::random(5)),
            'name' => 'Kilogram',
            'symbol' => 'kg',
        ]);
        $gram = Unit::create([
            'code' => 'G-'.Str::upper(Str::random(5)),
            'name' => 'Gram',
            'symbol' => 'g',
        ]);
        $ingredient = Product::create([
            'category_id' => $category->id,
            'image' => 'products/cheese.png',
            'barcode' => 'CHEESE-'.Str::upper(Str::random(8)),
            'sku' => 'CHEESE-'.Str::upper(Str::random(8)),
            'title' => 'Cheese',
            'buy_price' => 1000,
            'sell_price' => 0,
            'stock' => 100,
        ]);
        $ingredient->units()->attach($kilogram->id, [
            'is_base' => true,
            'conversion_factor' => 1,
            'buy_price' => 1000,
            'sell_price' => null,
        ]);
        $ingredient->units()->attach($gram->id, [
            'is_base' => false,
            'conversion_factor' => 0.001,
            'buy_price' => null,
            'sell_price' => null,
        ]);
        $finishedProduct = Product::create([
            'category_id' => $category->id,
            'image' => 'products/pizza.png',
            'barcode' => 'PIZZA-'.Str::upper(Str::random(8)),
            'sku' => 'PIZZA-'.Str::upper(Str::random(8)),
            'title' => 'Pizza',
            'buy_price' => 0,
            'sell_price' => 800,
            'stock' => 0,
            'variations' => ['pizza_small'],
            'variation_prices' => ['pizza_small' => 800],
        ]);
        $recipe = Recipe::create([
            'product_id' => $finishedProduct->id,
            'variation_id' => 'pizza_small',
            'variation_name' => 'Small',
            'code' => 'REC-'.Str::upper(Str::random(10)),
            'name' => 'Small Pizza',
            'recipe_type' => 'variation',
            'batch_yield' => 1,
            'status' => 'active',
        ]);
        $recipe->ingredients()->create([
            'product_id' => $ingredient->id,
            'ingredient_name' => 'Cheese',
            'unit_id' => $gram->id,
            'quantity' => 80,
            'wastage_percent' => 0,
        ]);

        $costing = app(RecipeCostingService::class)->calculate($recipe->fresh());

        $this->assertEquals(80, $costing['cost_per_yield']);
        $this->assertEquals(80, $costing['rows'][0]['total_cost']);
    }
}
