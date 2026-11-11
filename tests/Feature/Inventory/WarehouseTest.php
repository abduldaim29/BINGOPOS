<?php

namespace Tests\Feature\Inventory;

use App\Models\Category;
use App\Models\Product;
use App\Models\SalesReturn;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\CashierShiftService;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class WarehouseTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([PermissionSeeder::class, RoleSeeder::class, UserSeeder::class]);
        $this->admin = User::where('email', 'arya@gmail.com')->first();
        $this->admin->markEmailAsVerified();
        $this->actingAs($this->admin);
        $this->withSession($this->recentlyConfirmedSession());

        // Seed default warehouse
        $pusat = Warehouse::create([
            'code' => 'PUSAT',
            'name' => 'Main Warehouse',
            'type' => 'main',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        // Create sample product + pivot
        $category = Category::create(['image' => 'test.png', 'name' => 'Test', 'description' => 'Test']);
        $product = Product::create([
            'category_id' => $category->id,
            'image' => 'product.png',
            'barcode' => 'TEST001',
            'title' => 'Test Product',
            'description' => 'Test',
            'buy_price' => 5000,
            'sell_price' => 10000,
            'stock' => 100,
        ]);
        $pusat->products()->attach($product->id, ['stock' => 100]);
    }

    public function test_index_warehouses_requires_warehouses_access_permission()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('warehouses-access');

        $this->actingAs($user)
            ->get(route('settings.warehouses.index'))
            ->assertOk();
    }

    public function test_index_warehouses_denies_without_permission()
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('settings.warehouses.index'))
            ->assertForbidden();
    }

    public function test_admin_can_create_warehouse()
    {
        $response = $this->from(route('settings.warehouses.index'))
            ->post(route('settings.warehouses.store'), [
                'code' => 'CABANG-A',
                'name' => 'Branch A',
                'type' => 'branch',
                'address' => 'Jl. Merdeka No. 1',
                'phone' => '021-123456',
                'is_active' => true,
                'sort_order' => 1,
            ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('warehouses', ['code' => 'CABANG-A']);
    }

    public function test_create_warehouse_syncs_all_products()
    {
        $productCount = Product::count();

        $this->from(route('settings.warehouses.index'))
            ->post(route('settings.warehouses.store'), [
                'code' => 'CABANG-B',
                'name' => 'Branch B',
                'type' => 'branch',
                'sort_order' => 2,
            ]);

        $warehouse = Warehouse::where('code', 'CABANG-B')->first();
        $this->assertNotNull($warehouse);
        $this->assertEquals($productCount, $warehouse->products()->count());
    }

    public function test_creating_a_main_warehouse_demotes_the_previous_main_warehouse()
    {
        $previousMain = Warehouse::where('code', 'PUSAT')->firstOrFail();

        $this->from(route('settings.warehouses.index'))
            ->post(route('settings.warehouses.store'), [
                'code' => 'NEW-MAIN',
                'name' => 'New Main Warehouse',
                'type' => 'main',
                'is_active' => true,
                'sort_order' => 0,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('warehouses', [
            'code' => 'NEW-MAIN',
            'type' => 'main',
        ]);
        $this->assertDatabaseHas('warehouses', [
            'id' => $previousMain->id,
            'type' => 'branch',
        ]);
    }

    public function test_admin_can_update_warehouse()
    {
        $warehouse = Warehouse::factory()->create(['code' => 'GUDANG-1', 'name' => 'Warehouse 1']);

        $this->from(route('settings.warehouses.index'))
            ->put(route('settings.warehouses.update', $warehouse->id), [
                'code' => 'GUDANG-1',
                'name' => 'Warehouse 1 Updated',
                'type' => 'warehouse',
                'sort_order' => 0,
                'is_active' => true,
            ])->assertSessionHas('success');

        $this->assertDatabaseHas('warehouses', ['name' => 'Warehouse 1 Updated']);
    }

    public function test_updating_a_warehouse_to_main_demotes_the_previous_main_warehouse()
    {
        $previousMain = Warehouse::where('code', 'PUSAT')->firstOrFail();
        $selectedWarehouse = Warehouse::factory()->create([
            'code' => 'NEW-MAIN',
            'type' => 'branch',
        ]);

        $this->from(route('settings.warehouses.index'))
            ->put(route('settings.warehouses.update', $selectedWarehouse), [
                'code' => $selectedWarehouse->code,
                'name' => $selectedWarehouse->name,
                'type' => 'main',
                'sort_order' => 0,
                'is_active' => true,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('warehouses', [
            'id' => $selectedWarehouse->id,
            'type' => 'main',
        ]);
        $this->assertDatabaseHas('warehouses', [
            'id' => $previousMain->id,
            'type' => 'branch',
        ]);
    }

    public function test_cannot_delete_main_warehouse()
    {
        $main = Warehouse::where('type', 'main')->first();

        $this->from(route('settings.warehouses.index'))
            ->delete(route('settings.warehouses.destroy', $main->id))
            ->assertSessionHas('error');
    }

    public function test_cannot_delete_warehouse_with_stock()
    {
        $warehouse = Warehouse::factory()->create(['code' => 'HAS-STOK', 'type' => 'branch']);
        $product = Product::first();
        $warehouse->products()->attach($product->id, ['stock' => 10]);

        $this->from(route('settings.warehouses.index'))
            ->delete(route('settings.warehouses.destroy', $warehouse->id))
            ->assertSessionHas('error');
    }

    public function test_can_delete_empty_warehouse()
    {
        $warehouse = Warehouse::factory()->create(['code' => 'KOSONG', 'type' => 'branch']);

        $response = $this->from(route('settings.warehouses.index'))
            ->delete(route('settings.warehouses.destroy', $warehouse->id))
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('warehouses', ['id' => $warehouse->id]);
        $response->assertRedirect(route('settings.warehouses.index'));

        $this->get(route('settings.warehouses.index'))
            ->assertInertia(fn ($page) => $page
                ->where('flash.success', 'Warehouse deleted successfully.')
                ->where('flash.error', null)
            );
    }

    public function test_cannot_delete_warehouse_referenced_by_a_sales_return(): void
    {
        $warehouse = Warehouse::factory()->create(['code' => 'RETURN-WH', 'type' => 'branch']);
        $transaction = Transaction::create([
            'cashier_id' => $this->admin->id,
            'invoice' => 'TRX-'.Str::upper(Str::random(10)),
            'cash' => 10000,
            'change' => 0,
            'discount' => 0,
            'grand_total' => 10000,
        ]);
        SalesReturn::create([
            'code' => 'SR-'.Str::upper(Str::random(10)),
            'transaction_id' => $transaction->id,
            'warehouse_id' => $warehouse->id,
            'status' => 'draft',
            'return_type' => 'refund_cash',
            'refund_amount' => 0,
            'credited_amount' => 0,
            'total_return_amount' => 0,
        ]);

        $this->from(route('settings.warehouses.index'))
            ->delete(route('settings.warehouses.destroy', $warehouse->id))
            ->assertSessionHas('error', 'A warehouse with operational history cannot be deleted. Deactivate the warehouse instead.');

        $this->assertDatabaseHas('warehouses', ['id' => $warehouse->id]);
    }

    public function test_cannot_delete_warehouse_with_operational_history(): void
    {
        $warehouse = Warehouse::factory()->create(['code' => 'USED-WH', 'type' => 'branch']);

        $shift = app(CashierShiftService::class)->openShift($this->admin, $this->admin, 0, null, $warehouse->id);
        $shift->update(['status' => 'closed']);

        $this->delete(route('settings.warehouses.destroy', $warehouse->id))
            ->assertSessionHas('error');

        $this->assertDatabaseHas('warehouses', ['id' => $warehouse->id]);
    }

    public function test_cannot_deactivate_warehouse_with_open_shift(): void
    {
        $warehouse = Warehouse::factory()->create(['code' => 'OPEN-WH', 'type' => 'branch']);

        app(CashierShiftService::class)->openShift($this->admin, $this->admin, 0, null, $warehouse->id);

        $this->put(route('settings.warehouses.update', $warehouse->id), [
            'code' => $warehouse->code,
            'name' => $warehouse->name,
            'type' => $warehouse->type,
            'is_active' => false,
            'sort_order' => 0,
        ])->assertSessionHas('error');

        $this->assertDatabaseHas('warehouses', ['id' => $warehouse->id, 'is_active' => true]);
    }

    public function test_default_warehouse_is_created_after_seed()
    {
        $this->assertDatabaseHas('warehouses', ['code' => 'PUSAT', 'type' => 'main']);
    }

    public function test_product_has_stock_total_helper()
    {
        $warehouse = Warehouse::where('code', 'PUSAT')->first();
        $product = Product::first();
        $product->warehouses()->syncWithPivotValues([$warehouse->id], ['stock' => 50]);

        $this->assertEquals(50, $product->stockTotal());
    }

    public function test_code_must_be_unique()
    {
        Warehouse::factory()->create(['code' => 'DUPLICATE']);

        $this->post(route('settings.warehouses.store'), [
            'code' => 'DUPLICATE',
            'name' => 'Duplicate',
            'type' => 'branch',
            'sort_order' => 0,
        ])->assertInvalid(['code']);
    }
}