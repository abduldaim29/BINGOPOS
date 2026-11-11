<?php

namespace Tests\Feature\Recipes;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Tests\TestCase;

class RecipeVariationImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_preview_resolves_a_qualified_variation_product_name(): void
    {
        $this->seed([PermissionSeeder::class, RoleSeeder::class, UserSeeder::class]);
        $user = User::where('email', 'arya@gmail.com')->firstOrFail();
        $user->markEmailAsVerified();

        $category = Category::create([
            'name' => 'Pizza',
            'image' => 'categories/pizza.png',
            'description' => 'Pizza products',
        ]);
        Product::create([
            'category_id' => $category->id,
            'image' => 'products/fajita.png',
            'barcode' => 'BAR-'.Str::upper(Str::random(10)),
            'sku' => 'SKU-'.Str::upper(Str::random(10)),
            'title' => 'Fajita Pizza',
            'description' => '',
            'buy_price' => 0,
            'sell_price' => 2500,
            'stock' => 0,
            'variations' => ['pizza_small', 'pizza_jumbo'],
            'variation_prices' => ['pizza_small' => 1000, 'pizza_jumbo' => 3000],
        ]);

        $csv = implode("\n", [
            'record_type,recipe_name,finished_product,variation_id,variation_name,recipe_type,batch_yield,yield_unit,packaging_cost,labour_cost,overhead_cost,notes,status,ingredient_name,ingredient_quantity,ingredient_unit,wastage_percent,purchase_price,step_title,instructions,duration_minutes,temperature,temperature_unit,equipment',
            'recipe,Fajita Jumbo Recipe,Fajita Pizza - Jumbo (16-18 inch),,,,1,serving / unit,0,0,0,,draft,,,,,,,,,,,',
        ]);

        $response = $this->actingAs($user)->postJson(route('recipes.import-preview'), [
            'file' => UploadedFile::fake()->createWithContent('recipe.csv', $csv),
        ]);

        $response->assertOk()
            ->assertJsonPath('data.product.title', 'Fajita Pizza')
            ->assertJsonPath('data.variation_id', 'pizza_jumbo')
            ->assertJsonPath('data.variation_name', 'Jumbo (16-18 inch)')
            ->assertJsonPath('data.recipe_type', 'variation');
    }
}
