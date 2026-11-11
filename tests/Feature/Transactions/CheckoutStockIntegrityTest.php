<?php

namespace Tests\Feature\Transactions;

use App\Models\Cart;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\Recipe;
use App\Models\Transaction;
use App\Models\TransactionDetailRecipeConsumption;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\CashierShiftService;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CheckoutStockIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([PermissionSeeder::class, RoleSeeder::class, UserSeeder::class]);

        $this->cashier = User::where('email', 'cashier@gmail.com')->first();
        $this->cashier->markEmailAsVerified();

        $this->pusat = Warehouse::create([
            'code' => 'PUSAT',
            'name' => 'Gudang Pusat',
            'type' => 'main',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $this->category = Category::create([
            'name' => 'Kategori Test',
            'image' => 'test.png',
            'description' => 'desc',
        ]);

        app(CashierShiftService::class)->openShift($this->cashier, $this->cashier, 0, null, $this->pusat->id);
    }

    private static int $seq = 0;

    private function createProduct(int $stock = 10): Product
    {
        self::$seq++;

        $product = Product::create([
            'title' => 'Produk Integrity '.self::$seq,
            'sku' => 'SKU-INT-'.self::$seq,
            'barcode' => 'BC-INT-'.self::$seq,
            'image' => 'product.png',
            'description' => 'desc',
            'category_id' => $this->category->id,
            'buy_price' => 1000,
            'sell_price' => 2000,
            'stock' => $stock,
            'tax_rate' => 0,
        ]);

        $product->warehouses()->attach($this->pusat->id, ['stock' => $stock]);

        return $product;
    }

    private function openShiftFor(User $user, int $warehouseId): CashierShift
    {
        return CashierShift::create([
            'user_id' => $user->id,
            'opened_by' => $user->id,
            'opened_at' => now(),
            'opening_cash' => 100000,
            'expected_cash' => 100000,
            'status' => 'open',
            'warehouse_id' => $warehouseId,
        ]);
    }

    public function test_checkout_rejects_cart_exceeding_available_stock_atomic(): void
    {
        $product = $this->createProduct(5);

        // Bypass the add-to-cart guard: simulate a cart created when stock was higher
        Cart::create([
            'cashier_id' => $this->cashier->id,
            'warehouse_id' => $this->pusat->id,
            'product_id' => $product->id,
            'qty' => 10,
            'price' => 20000,
            'conversion_factor' => 1,
        ]);

        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertSessionHasErrors('stock');

        $this->assertSame(0, Transaction::count());
        $this->assertSame(5, $product->fresh()->stock);
        $this->assertSame(5, (int) $product->fresh()->warehouses()->where('warehouse_id', $this->pusat->id)->first()->pivot->stock);
        $this->assertSame(1, Cart::count());
    }

    public function test_checkout_rejects_second_item_shortage_and_rolls_back_first_item(): void
    {
        $productA = $this->createProduct(100);
        $productB = $this->createProduct(3);

        // Both pass the add-to-cart guard (stock was sufficient at add time)
        $this->actingAs($this->cashier)->post(route('transactions.addToCart'), [
            'product_id' => $productA->id,
            'qty' => 5,
        ])->assertRedirect();

        $this->actingAs($this->cashier)->post(route('transactions.addToCart'), [
            'product_id' => $productB->id,
            'qty' => 2,
        ])->assertRedirect();

        // Simulate stock dropping below cart qty before checkout
        $productB->warehouses()->updateExistingPivot($this->pusat->id, ['stock' => 1]);
        $productB->update(['stock' => 1]);

        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertSessionHasErrors('stock');

        $this->assertSame(0, Transaction::count());
        // First product decrement must have been rolled back too
        $this->assertSame(100, $productA->fresh()->stock);
        $this->assertSame(2, Cart::count());
    }

    public function test_composite_checkout_short_component_rolls_back_all_decrements(): void
    {
        $componentA = Product::create([
            'title' => 'Komponen A',
            'sku' => 'SKU-CA-'.Str::upper(Str::random(6)),
            'barcode' => 'BC-CA-'.Str::upper(Str::random(6)),
            'image' => 'product.png',
            'description' => 'desc',
            'category_id' => $this->category->id,
            'buy_price' => 1000,
            'sell_price' => 6000,
            'stock' => 5,
            'tax_rate' => 0,
        ]);
        $componentA->warehouses()->attach($this->pusat->id, ['stock' => 5]);

        $componentB = Product::create([
            'title' => 'Komponen B',
            'sku' => 'SKU-CB-'.Str::upper(Str::random(6)),
            'barcode' => 'BC-CB-'.Str::upper(Str::random(6)),
            'image' => 'product.png',
            'description' => 'desc',
            'category_id' => $this->category->id,
            'buy_price' => 1000,
            'sell_price' => 4000,
            'stock' => 8,
            'tax_rate' => 0,
        ]);
        $componentB->warehouses()->attach($this->pusat->id, ['stock' => 8]);

        $composite = Product::create([
            'title' => 'Paket Integrity',
            'sku' => 'SKU-PI-'.Str::upper(Str::random(6)),
            'barcode' => 'BC-PI-'.Str::upper(Str::random(6)),
            'image' => 'product.png',
            'description' => 'desc',
            'category_id' => $this->category->id,
            'buy_price' => 0,
            'sell_price' => 0,
            'stock' => 0,
            'is_composite' => true,
            'tax_rate' => 0,
        ]);
        $composite->components()->attach([
            $componentA->id => ['qty' => 1],
            $componentB->id => ['qty' => 3],
        ]);

        // Component B needs 3x per composite; add 2 composites = 6 needed
        $this->actingAs($this->cashier)->post(route('transactions.addToCart'), [
            'product_id' => $composite->id,
            'qty' => 2,
        ])->assertRedirect();

        // Stock drops to 5 (below the 6 needed) before checkout
        $componentB->warehouses()->updateExistingPivot($this->pusat->id, ['stock' => 5]);
        $componentB->update(['stock' => 5]);

        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertSessionHasErrors('stock');

        $this->assertSame(0, Transaction::count());
        $this->assertSame(5, $componentA->fresh()->stock);
        $this->assertSame(5, $componentB->fresh()->stock);
        $this->assertSame(1, Cart::count());
    }

    public function test_checkout_rejects_partial_batch_coverage(): void
    {
        $product = $this->createProduct(30);

        // Batches cover only 5 of the 30 aggregate units
        ProductBatch::create([
            'product_id' => $product->id,
            'warehouse_id' => $this->pusat->id,
            'batch_number' => 'BATCH-X',
            'expired_at' => now()->addDays(10)->toDateString(),
            'received_at' => '2026-01-01',
            'stock' => 5,
        ]);

        $this->actingAs($this->cashier)->post(route('transactions.addToCart'), [
            'product_id' => $product->id,
            'qty' => 8,
        ])->assertRedirect();

        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertSessionHasErrors('stock');

        $this->assertSame(0, Transaction::count());
        $this->assertSame(30, $product->fresh()->stock);
        $this->assertSame(5, (int) ProductBatch::where('batch_number', 'BATCH-X')->first()->stock);
        $this->assertSame(1, Cart::count());
    }

    public function test_checkout_succeeds_when_batch_coverage_is_sufficient(): void
    {
        $product = $this->createProduct(30);

        ProductBatch::create([
            'product_id' => $product->id,
            'warehouse_id' => $this->pusat->id,
            'batch_number' => 'BATCH-Y',
            'expired_at' => now()->addDays(10)->toDateString(),
            'received_at' => '2026-01-01',
            'stock' => 10,
        ]);

        $this->actingAs($this->cashier)->post(route('transactions.addToCart'), [
            'product_id' => $product->id,
            'qty' => 8,
        ])->assertRedirect();

        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertRedirect();

        $this->assertSame(1, Transaction::count());
        $this->assertSame(22, $product->fresh()->stock);
        $this->assertSame(2, (int) ProductBatch::where('batch_number', 'BATCH-Y')->first()->stock);
        $this->assertSame(0, Cart::count());
    }

    public function test_checkout_consumes_only_the_selected_variations_recipe_ingredients(): void
    {
        $ingredient = $this->createProduct(100);
        $pizza = Product::create([
            'title' => 'Recipe Pizza',
            'sku' => 'SKU-RP-'.Str::upper(Str::random(6)),
            'barcode' => 'BC-RP-'.Str::upper(Str::random(6)),
            'image' => 'product.png',
            'description' => 'Recipe-backed product',
            'category_id' => $this->category->id,
            'buy_price' => 0,
            'sell_price' => 800,
            'stock' => 0,
            'stock_mode' => 'made_to_order',
            'variations' => ['pizza_small', 'pizza_large'],
            'variation_prices' => ['pizza_small' => 800, 'pizza_large' => 1200],
            'tax_rate' => 0,
        ]);
        $pizza->warehouses()->attach($this->pusat->id, ['stock' => 0]);

        foreach (['pizza_small' => 4, 'pizza_large' => 10] as $variationId => $ingredientQty) {
            $recipe = Recipe::create([
                'product_id' => $pizza->id,
                'variation_id' => $variationId,
                'variation_name' => $variationId === 'pizza_small' ? 'Small' : 'Large',
                'code' => 'REC-'.Str::upper(Str::random(10)),
                'name' => 'Recipe '.ucfirst(str_replace('pizza_', '', $variationId)),
                'recipe_type' => 'variation',
                'batch_yield' => 1,
                'status' => 'active',
            ]);
            $recipe->ingredients()->create([
                'product_id' => $ingredient->id,
                'ingredient_name' => $ingredient->title,
                'quantity' => $ingredientQty,
                'wastage_percent' => 0,
            ]);
        }

        Cart::create([
            'cashier_id' => $this->cashier->id,
            'warehouse_id' => $this->pusat->id,
            'product_id' => $pizza->id,
            'variation_id' => 'pizza_small',
            'variation_name' => 'Small',
            'qty' => 2,
            'price' => 1600,
            'conversion_factor' => 1,
        ]);

        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertRedirect();

        $this->assertSame(0, $pizza->fresh()->stock);
        $this->assertSame(92, $ingredient->fresh()->stock);
        $this->assertSame(
            92,
            (int) $ingredient->fresh()->warehouses()->where('warehouse_id', $this->pusat->id)->first()->pivot->stock
        );
        $this->assertDatabaseHas('transaction_detail_recipe_consumptions', [
            'ingredient_product_id' => $ingredient->id,
            'base_quantity_consumed' => 8,
        ]);
        $this->assertSame(1, TransactionDetailRecipeConsumption::count());
    }

    public function test_recipe_ingredient_shortage_rolls_back_checkout(): void
    {
        $ingredient = $this->createProduct(5);
        $pizza = Product::create([
            'title' => 'Short Recipe Pizza',
            'sku' => 'SKU-SRP-'.Str::upper(Str::random(6)),
            'barcode' => 'BC-SRP-'.Str::upper(Str::random(6)),
            'image' => 'product.png',
            'category_id' => $this->category->id,
            'buy_price' => 0,
            'sell_price' => 800,
            'stock' => 0,
            'stock_mode' => 'made_to_order',
            'variations' => ['pizza_small'],
            'variation_prices' => ['pizza_small' => 800],
            'tax_rate' => 0,
        ]);
        $pizza->warehouses()->attach($this->pusat->id, ['stock' => 0]);
        $recipe = Recipe::create([
            'product_id' => $pizza->id,
            'variation_id' => 'pizza_small',
            'variation_name' => 'Small',
            'code' => 'REC-'.Str::upper(Str::random(10)),
            'name' => 'Short Recipe',
            'recipe_type' => 'variation',
            'batch_yield' => 1,
            'status' => 'active',
        ]);
        $recipe->ingredients()->create([
            'product_id' => $ingredient->id,
            'ingredient_name' => $ingredient->title,
            'quantity' => 10,
            'wastage_percent' => 0,
        ]);
        Cart::create([
            'cashier_id' => $this->cashier->id,
            'warehouse_id' => $this->pusat->id,
            'product_id' => $pizza->id,
            'variation_id' => 'pizza_small',
            'variation_name' => 'Small',
            'qty' => 1,
            'price' => 800,
            'conversion_factor' => 1,
        ]);

        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertSessionHasErrors('stock');

        $this->assertSame(0, Transaction::count());
        $this->assertSame(5, $ingredient->fresh()->stock);
        $this->assertSame(5, (int) $ingredient->fresh()->warehouses()->where('warehouse_id', $this->pusat->id)->first()->pivot->stock);
        $this->assertSame(1, Cart::count());
        $this->assertSame(0, TransactionDetailRecipeConsumption::count());
    }

    public function test_other_cashier_cart_is_ignored_when_checking_stock(): void
    {
        $other = User::factory()->create();
        $other->markEmailAsVerified();

        $product = $this->createProduct(2);

        // Other cashier holds a cart for the same product beyond remaining stock
        Cart::create([
            'cashier_id' => $other->id,
            'warehouse_id' => $this->pusat->id,
            'product_id' => $product->id,
            'qty' => 2,
            'price' => 4000,
            'conversion_factor' => 1,
        ]);
        $this->openShiftFor($other, $this->pusat->id);

        $this->actingAs($this->cashier)->post(route('transactions.addToCart'), [
            'product_id' => $product->id,
            'qty' => 1,
        ])->assertRedirect();

        // Only the acting cashier's cart is considered at checkout
        $this->actingAs($this->cashier)
            ->post(route('transactions.store'), ['payment_method' => 'cash', 'cash' => 50000])
            ->assertRedirect();

        $this->assertSame(1, $product->fresh()->stock);
    }
}
