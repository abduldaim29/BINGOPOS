<?php

namespace Tests\Feature\Products;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductWarehouse;
use App\Models\Recipe;
use App\Models\StockMutation;
use App\Models\Transaction;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProductStoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([PermissionSeeder::class, RoleSeeder::class, UserSeeder::class]);

        $this->admin = User::where('email', 'arya@gmail.com')->first();
        $this->admin->markEmailAsVerified();
        $this->actingAs($this->admin);

        $this->category = Category::create([
            'name' => 'Kategori Test',
            'image' => 'categories/test.jpg',
            'description' => 'Kategori untuk test',
        ]);

        $this->warehouse = Warehouse::create([
            'code' => 'PUSAT',
            'name' => 'Gudang Pusat',
            'type' => 'main',
            'is_active' => true,
            'sort_order' => 0,
        ]);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'image' => UploadedFile::fake()->image('product.png'),
            'barcode' => 'BRCD-'.Str::upper(Str::random(10)),
            'sku' => 'SKU-'.Str::upper(Str::random(10)),
            'title' => 'Produk Uji',
            'description' => 'Deskripsi uji.',
            'category_id' => $this->category->id,
            'buy_price' => 5000,
            'sell_price' => 10000,
            'stock' => 100,
            'tax_rate' => 0,
        ], $overrides);
    }

    public function test_store_creates_pivot_row_in_default_warehouse(): void
    {
        $this->post(route('products.store'), $this->validPayload())
            ->assertRedirect(route('products.index'));

        $product = Product::latest('id')->first();

        $pivot = ProductWarehouse::where('product_id', $product->id)
            ->where('warehouse_id', $this->warehouse->id)
            ->first();
        $this->assertNotNull($pivot);
        $this->assertEquals(100, $pivot->stock);
        $this->assertEquals(100, $product->fresh()->stock);
    }

    public function test_store_creates_product_when_optional_description_price_and_stock_are_omitted(): void
    {
        $payload = $this->validPayload();
        unset($payload['description'], $payload['buy_price'], $payload['stock']);

        $this->post(route('products.store'), $payload)
            ->assertRedirect(route('products.index'));

        $product = Product::latest('id')->firstOrFail();

        $this->assertSame('', $product->description);
        $this->assertSame(0, $product->buy_price);
        $this->assertSame(0, $product->stock);
        $this->assertDatabaseHas('product_warehouse', [
            'product_id' => $product->id,
            'warehouse_id' => $this->warehouse->id,
            'stock' => 0,
        ]);
    }

    public function test_store_saves_independent_recipes_for_each_variation(): void
    {
        $dough = Product::create([
            'image' => 'dough.png',
            'barcode' => 'ING-DOUGH-'.Str::upper(Str::random(6)),
            'sku' => 'ING-DOUGH-'.Str::upper(Str::random(6)),
            'title' => 'Pizza Dough',
            'description' => '',
            'category_id' => $this->category->id,
            'buy_price' => 10,
            'sell_price' => 0,
            'stock' => 1000,
        ]);
        $cheese = Product::create([
            'image' => 'cheese.png',
            'barcode' => 'ING-CHEESE-'.Str::upper(Str::random(6)),
            'sku' => 'ING-CHEESE-'.Str::upper(Str::random(6)),
            'title' => 'Mozzarella',
            'description' => '',
            'category_id' => $this->category->id,
            'buy_price' => 20,
            'sell_price' => 0,
            'stock' => 1000,
        ]);

        $payload = $this->validPayload([
            'variations' => ['pizza_small', 'pizza_large'],
            'variation_prices' => ['pizza_small' => 800, 'pizza_large' => 1200],
            'variation_recipes' => [
                'pizza_small' => [
                    'batch_yield' => 1,
                    'ingredients' => [
                        ['product_id' => $dough->id, 'unit_id' => null, 'quantity' => 150],
                        ['product_id' => $cheese->id, 'unit_id' => null, 'quantity' => 80],
                    ],
                ],
                'pizza_large' => [
                    'batch_yield' => 1,
                    'ingredients' => [
                        ['product_id' => $dough->id, 'unit_id' => null, 'quantity' => 250],
                        ['product_id' => $cheese->id, 'unit_id' => null, 'quantity' => 130],
                    ],
                ],
            ],
        ]);

        $this->post(route('products.store'), $payload)
            ->assertRedirect(route('products.index'));

        $product = Product::where('title', 'Produk Uji')->latest('id')->firstOrFail();
        $small = Recipe::where('product_id', $product->id)->where('variation_id', 'pizza_small')->firstOrFail();
        $large = Recipe::where('product_id', $product->id)->where('variation_id', 'pizza_large')->firstOrFail();

        $this->assertSame('active', $small->status);
        $this->assertSame('active', $large->status);
        $this->assertEquals(
            [150.0, 80.0],
            $small->ingredients()->orderBy('id')->pluck('quantity')->map(fn ($value) => (float) $value)->all()
        );
        $this->assertEquals(
            [250.0, 130.0],
            $large->ingredients()->orderBy('id')->pluck('quantity')->map(fn ($value) => (float) $value)->all()
        );
    }

    public function test_updating_one_variation_recipe_does_not_change_another_variation(): void
    {
        $ingredient = Product::create([
            'image' => 'ingredient.png',
            'barcode' => 'ING-'.Str::upper(Str::random(10)),
            'sku' => 'ING-'.Str::upper(Str::random(10)),
            'title' => 'Ingredient',
            'description' => '',
            'category_id' => $this->category->id,
            'buy_price' => 10,
            'sell_price' => 0,
            'stock' => 1000,
        ]);
        $product = Product::create([
            'image' => 'pizza.png',
            'barcode' => 'PIZ-'.Str::upper(Str::random(10)),
            'sku' => 'PIZ-'.Str::upper(Str::random(10)),
            'title' => 'Pizza',
            'description' => '',
            'category_id' => $this->category->id,
            'buy_price' => 0,
            'sell_price' => 800,
            'stock' => 0,
            'variations' => ['pizza_small', 'pizza_large'],
            'variation_prices' => ['pizza_small' => 800, 'pizza_large' => 1200],
        ]);
        $createRecipe = fn (string $variationId) => Recipe::create([
            'product_id' => $product->id,
            'variation_id' => $variationId,
            'variation_name' => ucfirst(str_replace('pizza_', '', $variationId)),
            'code' => 'REC-'.Str::upper(Str::random(10)),
            'name' => 'Pizza recipe',
            'recipe_type' => 'variation',
            'batch_yield' => 1,
            'status' => 'active',
        ]);
        $small = $createRecipe('pizza_small');
        $small->ingredients()->create([
            'product_id' => $ingredient->id,
            'ingredient_name' => $ingredient->title,
            'quantity' => 100,
            'wastage_percent' => 0,
        ]);
        $large = $createRecipe('pizza_large');
        $large->ingredients()->create([
            'product_id' => $ingredient->id,
            'ingredient_name' => $ingredient->title,
            'quantity' => 300,
            'wastage_percent' => 0,
        ]);

        $this->put(route('products.update', $product), [
            'barcode' => $product->barcode,
            'sku' => $product->sku,
            'title' => $product->title,
            'category_id' => $product->category_id,
            'buy_price' => 0,
            'sell_price' => 800,
            'variations' => ['pizza_small', 'pizza_large'],
            'variation_prices' => ['pizza_small' => 800, 'pizza_large' => 1200],
            'variation_recipes' => [
                'pizza_small' => [
                    'batch_yield' => 1,
                    'ingredients' => [
                        ['product_id' => $ingredient->id, 'unit_id' => null, 'quantity' => 150],
                    ],
                ],
                'pizza_large' => [
                    'batch_yield' => 1,
                    'ingredients' => [
                        ['product_id' => $ingredient->id, 'unit_id' => null, 'quantity' => 300],
                    ],
                ],
            ],
        ])->assertRedirect(route('products.index'));

        $this->assertSame($small->id, $small->fresh()->id);
        $this->assertSame($large->id, $large->fresh()->id);
        $this->assertEquals(150, $small->fresh()->ingredients()->firstOrFail()->quantity);
        $this->assertEquals(300, $large->fresh()->ingredients()->firstOrFail()->quantity);
    }

    public function test_invalid_variation_recipe_unit_rolls_back_product_creation(): void
    {
        $ingredient = Product::create([
            'image' => 'ingredient.png',
            'barcode' => 'ING-'.Str::upper(Str::random(10)),
            'sku' => 'ING-'.Str::upper(Str::random(10)),
            'title' => 'Ingredient without configured units',
            'description' => '',
            'category_id' => $this->category->id,
            'buy_price' => 10,
            'sell_price' => 0,
            'stock' => 100,
        ]);
        $unit = Unit::create([
            'code' => 'TEST-'.Str::upper(Str::random(6)),
            'name' => 'Test unit',
            'symbol' => 'tu',
        ]);
        $payload = $this->validPayload([
            'variations' => ['pizza_small'],
            'variation_recipes' => [
                'pizza_small' => [
                    'batch_yield' => 1,
                    'ingredients' => [
                        [
                            'product_id' => $ingredient->id,
                            'unit_id' => $unit->id,
                            'quantity' => 1,
                        ],
                    ],
                ],
            ],
        ]);

        $this->post(route('products.store'), $payload)
            ->assertSessionHasErrors('variation_recipes.pizza_small.ingredients.0.unit_id');

        $this->assertDatabaseMissing('products', ['sku' => $payload['sku']]);
    }

    public function test_store_records_initial_mutation_with_warehouse(): void
    {
        $this->post(route('products.store'), $this->validPayload());

        $product = Product::latest('id')->first();

        $mutation = StockMutation::where('reference_type', 'product_create')
            ->where('product_id', $product->id)
            ->first();
        $this->assertNotNull($mutation);
        $this->assertEquals($this->warehouse->id, $mutation->warehouse_id);
        $this->assertEquals(100, $mutation->qty);
        $this->assertEquals(0, $mutation->stock_before);
        $this->assertEquals(100, $mutation->stock_after);
    }

    public function test_store_uses_requested_warehouse(): void
    {
        $other = Warehouse::create([
            'code' => 'WH-2',
            'name' => 'Gudang Kedua',
            'type' => 'branch',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $this->post(route('products.store'), $this->validPayload(['warehouse_id' => $other->id]))
            ->assertRedirect(route('products.index'));

        $product = Product::latest('id')->first();

        $this->assertDatabaseHas('product_warehouse', [
            'product_id' => $product->id,
            'warehouse_id' => $other->id,
            'stock' => 100,
        ]);
    }

    public function test_update_persists_min_and_max_stock(): void
    {
        $product = Product::create([
            'image' => 'product.png',
            'barcode' => 'BRCD-'.Str::upper(Str::random(10)),
            'sku' => 'SKU-'.Str::upper(Str::random(10)),
            'title' => 'Produk Uji',
            'description' => 'Deskripsi uji.',
            'category_id' => $this->category->id,
            'buy_price' => 5000,
            'sell_price' => 10000,
            'stock' => 100,
            'tax_rate' => 0,
        ]);

        $payload = [
            'image' => UploadedFile::fake()->image('product.png'),
            'barcode' => $product->barcode,
            'sku' => $product->sku,
            'title' => 'Produk Uji',
            'description' => 'Deskripsi uji.',
            'category_id' => $this->category->id,
            'buy_price' => 5000,
            'sell_price' => 10000,
            'tax_rate' => 0,
            'min_stock' => 25,
            'max_stock' => 250,
        ];

        $this->put(route('products.update', $product), $payload)
            ->assertRedirect(route('products.index'));

        $product = $product->fresh();
        $this->assertEquals(25, $product->min_stock);
        $this->assertEquals(250, $product->max_stock);
    }

    public function test_store_requires_image(): void
    {
        $payload = $this->validPayload();
        unset($payload['image']);

        $this->post(route('products.store'), $payload)
            ->assertSessionHasErrors('image');
    }

    public function test_delete_archives_products_with_transaction_history_and_can_restore_them(): void
    {
        $product = Product::create([
            'image' => 'product.png',
            'barcode' => 'BRCD-'.Str::upper(Str::random(10)),
            'sku' => 'SKU-'.Str::upper(Str::random(10)),
            'title' => 'Produk Terpakai',
            'description' => 'Tidak bisa dihapus.',
            'category_id' => $this->category->id,
            'buy_price' => 5000,
            'sell_price' => 10000,
            'stock' => 10,
            'tax_rate' => 0,
        ]);

        $transaction = Transaction::create([
            'cashier_id' => $this->admin->id,
            'warehouse_id' => $this->warehouse->id,
            'invoice' => 'TRX-'.Str::upper(Str::random(8)),
            'cash' => 20000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 20000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
        ]);

        $transaction->details()->create([
            'product_id' => $product->id,
            'qty' => 1,
            'price' => 20000,
        ]);

        $this->delete(route('products.destroy', $product->id))
            ->assertRedirect()
            ->assertSessionHas('success', 'Product archived successfully.');

        $this->assertSoftDeleted('products', ['id' => $product->id]);
        $this->assertSame($product->id, $transaction->details()->firstOrFail()->product->id);

        $this->patch(route('products.restore', $product->id))
            ->assertRedirect(route('products.index'))
            ->assertSessionHas('success', 'Product restored successfully.');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'deleted_at' => null,
        ]);
    }
}
