<?php

namespace Tests\Feature\SalesReturn;

use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Receivable;
use App\Models\SalesReturn;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SalesReturnTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
            'sales-returns-complete',
            'cashier-shifts-access',
            'cashier-shifts-open',
            'cashier-shifts-close',
        ] as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }

    public function test_authorized_user_can_create_sales_return_draft_for_cash_transaction(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
        ]);

        [$transaction, $detail] = $this->createTransaction($user);

        $response = $this
            ->actingAs($user)
            ->post(route('sales-returns.store', $transaction), [
                'return_type' => 'refund_cash',
                'notes' => 'Retur karena salah ukuran',
                'items' => [
                    [
                        'transaction_detail_id' => $detail->id,
                        'qty_return' => 1,
                        'return_reason' => 'Salah ukuran',
                        'restock_to_inventory' => true,
                    ],
                ],
            ]);

        $salesReturn = SalesReturn::first();

        $response->assertRedirect(route('sales-returns.show', $salesReturn));
        $this->assertNotNull($salesReturn);
        $this->assertSame('draft', $salesReturn->status);
        $this->assertSame(1, $salesReturn->items()->count());
        $this->assertSame(60000, $salesReturn->total_return_amount);
        $this->assertSame(60000, $salesReturn->refund_amount);
    }

    public function test_replacement_settlement_is_persisted_without_refund_or_credit(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
        ]);
        [$transaction, $detail] = $this->createTransaction($user);

        $this->actingAs($user)->post(route('sales-returns.store', $transaction), [
            'return_type' => 'replacement',
            'items' => [[
                'transaction_detail_id' => $detail->id,
                'qty_return' => 1,
                'return_reason' => 'Replacement requested',
                'restock_to_inventory' => true,
            ]],
        ])->assertRedirect();

        $salesReturn = SalesReturn::firstOrFail();
        $this->assertSame('replacement', $salesReturn->return_type);
        $this->assertSame(0, $salesReturn->refund_amount);
        $this->assertSame(0, $salesReturn->credited_amount);
    }

    public function test_draft_snapshots_return_value_after_invoice_discount_and_inclusive_tax(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
        ]);
        [$transaction, $detail] = $this->createTransaction($user, qty: 2);
        $transaction->update([
            'discount' => 12000,
            'grand_total' => 108000,
            'taxable_amount' => 102000,
            'tax_total' => 18000,
        ]);
        $detail->update([
            'cost_total' => 90000,
            'tax_total' => 18000,
            'tax_type' => 'inclusive',
        ]);

        $this->actingAs($user)
            ->post(route('sales-returns.store', $transaction), [
                'return_type' => 'refund_cash',
                'notes' => 'Partial quantity return',
                'items' => [
                    [
                        'transaction_detail_id' => $detail->id,
                        'qty_return' => 1,
                        'return_reason' => 'Partial return',
                        'restock_to_inventory' => true,
                    ],
                ],
            ])
            ->assertSessionDoesntHaveErrors();

        $returnItem = SalesReturn::firstOrFail()->items()->firstOrFail();
        $this->assertSame(60000, $returnItem->subtotal);
        $this->assertSame(45000, $returnItem->cost_total);
        $this->assertSame(45000, $returnItem->net_sales_total);
        $this->assertSame(9000, $returnItem->tax_refund_total);
    }

    public function test_qty_return_cannot_exceed_remaining_quantity(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
            'sales-returns-complete',
        ]);

        [$transaction, $detail, $product] = $this->createTransaction($user, qty: 2);

        $firstReturn = SalesReturn::create([
            'code' => 'SR-TEST-001',
            'transaction_id' => $transaction->id,
            'customer_id' => $transaction->customer_id,
            'cashier_id' => $user->id,
            'status' => 'completed',
            'return_type' => 'refund_cash',
            'return_type' => 'refund_cash',
            'refund_amount' => 60000,
            'credited_amount' => 0,
            'total_return_amount' => 60000,
            'completed_at' => now(),
        ]);

        $firstReturn->items()->create([
            'transaction_detail_id' => $detail->id,
            'product_id' => $product->id,
            'qty_sold' => 2,
            'qty_returned_before' => 0,
            'qty_return' => 1,
            'unit_price' => 60000,
            'subtotal' => 60000,
            'return_reason' => 'Retur pertama',
            'restock_to_inventory' => true,
        ]);

        $response = $this
            ->from(route('sales-returns.create', $transaction))
            ->actingAs($user)
            ->post(route('sales-returns.store', $transaction), [
                'return_type' => 'refund_cash',
                'items' => [
                    [
                        'transaction_detail_id' => $detail->id,
                        'qty_return' => 2,
                        'return_reason' => 'Melebihi sisa',
                        'restock_to_inventory' => true,
                    ],
                ],
            ]);

        $response->assertInvalid(['items']);
        $this->assertDatabaseCount('sales_returns', 1);
    }

    public function test_complete_sales_return_restocks_product_and_creates_mutation(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
            'sales-returns-complete',
        ]);

        [$transaction, $detail, $product] = $this->createTransaction($user, qty: 1, stock: 4);
        $shift = $this->openShiftFor($user);

        $salesReturn = SalesReturn::create([
            'code' => 'SR-TEST-002',
            'transaction_id' => $transaction->id,
            'customer_id' => $transaction->customer_id,
            'cashier_id' => $user->id,
            'status' => 'draft',
            'return_type' => 'refund_cash',
            'refund_amount' => 60000,
            'credited_amount' => 0,
            'total_return_amount' => 60000,
        ]);

        $salesReturn->items()->create([
            'transaction_detail_id' => $detail->id,
            'product_id' => $product->id,
            'qty_sold' => 1,
            'qty_returned_before' => 0,
            'qty_return' => 1,
            'unit_price' => 60000,
            'subtotal' => 60000,
            'cost_total' => 45000,
            'net_sales_total' => 60000,
            'tax_refund_total' => 0,
            'return_reason' => 'Barang dikembalikan',
            'restock_to_inventory' => true,
        ]);

        $response = $this
            ->actingAs($user)
            ->post(route('sales-returns.complete', $salesReturn));

        $response->assertSessionDoesntHaveErrors();
        $this->assertSame(5, $product->fresh()->stock);
        $this->assertDatabaseHas('sales_returns', [
            'id' => $salesReturn->id,
            'status' => 'completed',
            'refund_amount' => 60000,
            'cashier_shift_id' => $shift->id,
        ]);
        $this->assertDatabaseHas('stock_mutations', [
            'product_id' => $product->id,
            'reference_type' => 'sales_return',
            'reference_id' => $salesReturn->id,
            'mutation_type' => 'in',
            'qty' => 1,
            'stock_before' => 4,
            'stock_after' => 5,
        ]);
        $this->assertDatabaseHas('profits', [
            'transaction_id' => $transaction->id,
            'total' => -15000,
        ]);
    }

    public function test_complete_waste_return_reverses_revenue_without_restoring_cost(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
            'sales-returns-complete',
        ]);
        [$transaction, $detail, $product] = $this->createTransaction($user, qty: 1, stock: 4);
        $detail->update([
            'cost_total' => 45000,
            'tax_total' => 0,
            'tax_type' => 'exclusive',
        ]);
        $shift = $this->openShiftFor($user);
        $salesReturn = SalesReturn::create([
            'code' => 'SR-TEST-WASTE',
            'transaction_id' => $transaction->id,
            'customer_id' => $transaction->customer_id,
            'cashier_id' => $user->id,
            'status' => 'draft',
            'return_type' => 'refund_cash',
            'refund_amount' => 60000,
            'credited_amount' => 0,
            'total_return_amount' => 60000,
        ]);
        $salesReturn->items()->create([
            'transaction_detail_id' => $detail->id,
            'product_id' => $product->id,
            'qty_sold' => 1,
            'qty_returned_before' => 0,
            'qty_return' => 1,
            'unit_price' => 60000,
            'subtotal' => 60000,
            'net_sales_total' => 60000,
            'tax_refund_total' => 0,
            'return_reason' => 'Written off as waste',
            'restock_to_inventory' => false,
        ]);

        $this->actingAs($user)
            ->post(route('sales-returns.complete', $salesReturn))
            ->assertSessionDoesntHaveErrors();

        $this->assertSame(4, $product->fresh()->stock);
        $this->assertSame(-45000, (int) $transaction->profits()->sum('total'));
        $this->assertDatabaseMissing('stock_mutations', [
            'reference_type' => 'sales_return',
            'reference_id' => $salesReturn->id,
        ]);
        $this->assertDatabaseHas('sales_returns', [
            'id' => $salesReturn->id,
            'status' => 'completed',
            'cashier_shift_id' => $shift->id,
        ]);
    }

    public function test_complete_sales_return_updates_receivable_total_and_creates_credit_on_overpayment(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
            'sales-returns-complete',
        ]);

        [$transaction, $detail, $product, $customer] = $this->createTransaction(
            $user,
            qty: 1,
            stock: 3,
            paymentMethod: 'pay_later',
            paymentStatus: 'paid',
            withReceivable: true
        );
        $shift = $this->openShiftFor($user);

        $salesReturn = SalesReturn::create([
            'code' => 'SR-TEST-003',
            'transaction_id' => $transaction->id,
            'customer_id' => $customer->id,
            'cashier_id' => $user->id,
            'status' => 'draft',
            'return_type' => 'store_credit',
            'refund_amount' => 0,
            'credited_amount' => 60000,
            'total_return_amount' => 60000,
        ]);

        $salesReturn->items()->create([
            'transaction_detail_id' => $detail->id,
            'product_id' => $product->id,
            'qty_sold' => 1,
            'qty_returned_before' => 0,
            'qty_return' => 1,
            'unit_price' => 60000,
            'subtotal' => 60000,
            'return_reason' => 'Salah kirim',
            'restock_to_inventory' => true,
        ]);

        $this->actingAs($user)->post(route('sales-returns.complete', $salesReturn));

        $this->assertDatabaseHas('receivables', [
            'transaction_id' => $transaction->id,
            'total' => 0,
            'status' => 'paid',
        ]);
        $this->assertDatabaseHas('customer_credits', [
            'customer_id' => $customer->id,
            'sales_return_id' => $salesReturn->id,
            'amount' => 60000,
            'balance' => 60000,
        ]);
        $this->assertDatabaseHas('sales_returns', [
            'id' => $salesReturn->id,
            'cashier_shift_id' => $shift->id,
        ]);
    }

    public function test_transaction_without_customer_forces_refund_cash(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
        ]);

        [$transaction, $detail] = $this->createTransaction($user, withCustomer: false);

        $this->actingAs($user)->post(route('sales-returns.store', $transaction), [
            'return_type' => 'store_credit',
            'items' => [
                [
                    'transaction_detail_id' => $detail->id,
                    'qty_return' => 1,
                    'return_reason' => 'Barang dibatalkan',
                    'restock_to_inventory' => true,
                ],
            ],
        ]);

        $salesReturn = SalesReturn::first();

        $this->assertSame('refund_cash', $salesReturn->return_type);
    }

    public function test_completed_sales_return_cannot_be_updated(): void
    {
        $user = $this->createUserWithPermissions([
            'transactions-access',
            'sales-returns-access',
            'sales-returns-create',
        ]);

        [$transaction, $detail, $product] = $this->createTransaction($user);

        $salesReturn = SalesReturn::create([
            'code' => 'SR-TEST-004',
            'transaction_id' => $transaction->id,
            'customer_id' => $transaction->customer_id,
            'cashier_id' => $user->id,
            'status' => 'completed',
            'return_type' => 'refund_cash',
            'refund_amount' => 60000,
            'credited_amount' => 0,
            'total_return_amount' => 60000,
            'completed_at' => now(),
        ]);

        $salesReturn->items()->create([
            'transaction_detail_id' => $detail->id,
            'product_id' => $product->id,
            'qty_sold' => 1,
            'qty_returned_before' => 0,
            'qty_return' => 1,
            'unit_price' => 60000,
            'subtotal' => 60000,
            'return_reason' => 'Tidak jadi beli',
            'restock_to_inventory' => true,
        ]);

        $response = $this
            ->from(route('sales-returns.show', $salesReturn))
            ->actingAs($user)
            ->patch(route('sales-returns.update', $salesReturn), [
                'return_type' => 'refund_cash',
                'items' => [
                    [
                        'transaction_detail_id' => $detail->id,
                        'qty_return' => 1,
                        'return_reason' => 'Ubah alasan',
                        'restock_to_inventory' => true,
                    ],
                ],
            ]);

        $response->assertInvalid(['sales_return']);
    }

    public function test_sales_returns_page_lists_filtered_returns(): void
    {
        $user = $this->createUserWithPermissions(['sales-returns-access']);
        [$transaction] = $this->createTransaction($user, qty: 2);
        $salesReturn = SalesReturn::create([
            'code' => 'RET-INDEX-001',
            'transaction_id' => $transaction->id,
            'warehouse_id' => $transaction->warehouse_id,
            'cashier_id' => $user->id,
            'status' => 'completed',
            'total_return_amount' => 50000,
            'refund_amount' => 50000,
        ]);

        $this->actingAs($user)
            ->get(route('sales-returns.index', ['code' => $salesReturn->code]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/SalesReturns/Index')
                ->where('filters.code', $salesReturn->code)
                ->where('summary.returns_count', 1)
                ->where('summary.refunded_total', 50000)
                ->where('salesReturns.data.0.code', $salesReturn->code)
            );
    }

    public function test_sales_returns_page_is_empty_without_returns(): void
    {
        $user = $this->createUserWithPermissions(['sales-returns-access']);

        $this->actingAs($user)
            ->get(route('sales-returns.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('summary.returns_count', 0)
                ->where('salesReturns.total', 0)
            );
    }

    public function test_sales_returns_page_exposes_return_summary(): void
    {
        $user = $this->createUserWithPermissions(['sales-returns-access']);
        $warehouse = Warehouse::factory()->create([
            'code' => 'REPORT-WH',
            'name' => 'Warehouse Before Rename',
            'type' => 'main',
        ]);
        [$transaction] = $this->createTransaction($user);
        $transaction->update(['warehouse_id' => $warehouse->id]);
        $warehouse->update(['name' => 'Updated Main Warehouse']);

        $this->actingAs($user)
            ->get(route('sales-returns.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('salesReturns')
                ->has('summary.returned_total')
            );

        $this->get(route('sales-returns.daily-sales.print', [
            'date' => now()->toDateString(),
        ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('sales.0.warehouse.name', 'Updated Main Warehouse')
            );
    }

    public function test_daily_sales_print_includes_every_sale_for_the_selected_day(): void
    {
        $user = $this->createUserWithPermissions(['sales-returns-access']);
        [$firstTransaction] = $this->createTransaction($user, qty: 2);
        [$secondTransaction] = $this->createTransaction($user);
        [$previousTransaction] = $this->createTransaction($user);

        $firstTransaction->forceFill(['created_at' => now()->startOfDay()->addHours(9)])->save();
        $secondTransaction->forceFill(['created_at' => now()->startOfDay()->addHours(11)])->save();
        $previousTransaction->forceFill(['created_at' => now()->subDay()->startOfDay()->addHours(11)])->save();

        $this->actingAs($user)
            ->get(route('sales-returns.daily-sales.print', ['date' => now()->toDateString()]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/SalesReturns/DailySalesPrint')
                ->where('autoPrint', false)
                ->where('summary.orders_count', 2)
                ->where('summary.revenue_total', 180000)
                ->where('summary.item_subtotal', 180000)
                ->where('summary.promotion_discount_total', 0)
                ->where('summary.discount_total', 0)
                ->where('summary.tax_total', 0)
                ->where('summary.shipping_total', 0)
                ->has('sales', 2)
                ->where('sales.0.invoice', $firstTransaction->invoice)
                ->where('sales.0.details.0.product.title', $firstTransaction->details[0]->product->title)
                ->where('sales.1.invoice', $secondTransaction->invoice)
            );
    }

    public function test_daily_sales_report_only_auto_prints_when_requested(): void
    {
        $user = $this->createUserWithPermissions(['sales-returns-access']);

        $this->actingAs($user)
            ->get(route('sales-returns.daily-sales.print', [
               'date' => now()->toDateString(),
               'auto_print' => 1,
            ]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
               ->component('Dashboard/SalesReturns/DailySalesPrint')
               ->where('autoPrint', true)
            );
    }

    public function test_authorized_user_can_view_a_sales_return_invoice(): void
    {
        $user = $this->createUserWithPermissions(['sales-returns-access']);
        [$transaction, $detail, $product] = $this->createTransaction($user);
        $salesReturn = SalesReturn::create([
            'code' => 'SR-PRINT-001',
            'transaction_id' => $transaction->id,
            'customer_id' => $transaction->customer_id,
            'cashier_id' => $user->id,
            'status' => 'completed',
            'return_type' => 'refund_cash',
            'refund_amount' => 60000,
            'credited_amount' => 0,
            'total_return_amount' => 60000,
            'completed_at' => now(),
        ]);
        $salesReturn->items()->create([
            'transaction_detail_id' => $detail->id,
            'product_id' => $product->id,
            'qty_sold' => 1,
            'qty_returned_before' => 0,
            'qty_return' => 1,
            'unit_price' => 60000,
            'subtotal' => 60000,
            'return_reason' => 'Damaged item',
            'restock_to_inventory' => true,
        ]);

        $this->actingAs($user)
            ->get(route('sales-returns.print', $salesReturn))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/SalesReturns/Print')
                ->where('salesReturn.code', 'SR-PRINT-001')
                ->where('salesReturn.status', 'completed')
                ->where('salesReturn.total_return_amount', 60000)
                ->where('salesReturn.items.0.product.title', $product->title)
                ->where('salesReturn.items.0.return_reason', 'Damaged item')
                ->where('transaction.invoice', $transaction->invoice)
            );
    }

    private function createUserWithPermissions(array $permissions): User
    {
        $user = User::factory()->create();
        $user->givePermissionTo($permissions);

        return $user;
    }

    private function createTransaction(
        User $user,
        int $qty = 1,
        int $stock = 10,
        bool $withCustomer = true,
        string $paymentMethod = 'cash',
        string $paymentStatus = 'paid',
        bool $withReceivable = false
    ): array {
        $category = Category::create([
            'name' => 'Kategori '.Str::upper(Str::random(5)),
            'description' => 'Kategori pengujian',
            'image' => 'category.png',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'image' => 'product.png',
            'barcode' => 'BRCD-'.Str::upper(Str::random(10)),
            'sku' => 'SKU-'.Str::upper(Str::random(10)),
            'title' => 'Produk Uji '.Str::upper(Str::random(4)),
            'description' => 'Deskripsi produk uji.',
            'buy_price' => 45000,
            'sell_price' => 60000,
            'stock' => $stock,
            'tax_rate' => 0,
        ]);

        $customer = $withCustomer
            ? Customer::create([
                'name' => 'Customer Test',
                'no_telp' => '08123456789',
                'address' => 'Jalan Test',
            ])
            : null;

        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'cashier_shift_id' => null,
            'customer_id' => $customer?->id,
            'invoice' => 'TRX-'.Str::upper(Str::random(8)),
            'cash' => 60000 * $qty,
            'change' => 0,
            'discount' => 0,
            'shipping_cost' => 0,
            'grand_total' => 60000 * $qty,
            'payment_method' => $paymentMethod,
            'payment_status' => $paymentStatus,
            'payment_reference' => null,
            'payment_url' => null,
            'bank_account_id' => null,
        ]);

        $detail = $transaction->details()->create([
            'product_id' => $product->id,
            'qty' => $qty,
            'price' => 60000 * $qty,
        ]);

        $transaction->profits()->create([
            'total' => 15000 * $qty,
        ]);

        if ($withReceivable) {
            Receivable::create([
                'customer_id' => $customer?->id,
                'transaction_id' => $transaction->id,
                'invoice' => $transaction->invoice,
                'total' => $transaction->grand_total,
                'paid' => $transaction->grand_total,
                'due_date' => now()->addDays(7),
                'status' => 'paid',
            ]);
        }

        return [$transaction->fresh(['details', 'receivable']), $detail, $product, $customer];
    }

    private function openShiftFor(User $user)
    {
        return CashierShift::create([
            'user_id' => $user->id,
            'opened_by' => $user->id,
            'opened_at' => now(),
            'opening_cash' => 100000,
            'expected_cash' => 100000,
            'status' => 'open',
        ]);
    }
}
