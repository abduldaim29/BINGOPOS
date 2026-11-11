<?php

namespace Tests\Feature\Reports;

use App\Models\Category;
use App\Models\Product;
use App\Models\Profit;
use App\Models\SalesReturn;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class SalesReportCalculationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_metrics_reconcile_to_recorded_transaction_values(): void
    {
        Permission::firstOrCreate([
            'name' => 'reports-access',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->markEmailAsVerified();
        $user->givePermissionTo('reports-access');

        $warehouse = Warehouse::create([
            'code' => 'REPORT',
            'name' => 'Report warehouse',
            'type' => 'main',
            'is_active' => true,
            'sort_order' => 0,
        ]);

        $category = Category::create([
            'name' => 'Report category',
            'image' => 'categories/report.jpg',
            'description' => 'Report test category',
        ]);

        $product = Product::create([
            'title' => 'Report product',
            'sku' => 'REPORT-'.uniqid(),
            'buy_price' => 3000,
            'sell_price' => 6000,
            'stock' => 10,
            'image' => 'products/report.jpg',
            'barcode' => 'REPORT-'.uniqid(),
            'description' => 'Report test product',
            'tax_rate' => 18,
            'category_id' => $category->id,
        ]);

        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'warehouse_id' => $warehouse->id,
            'invoice' => 'REPORT-INV-1',
            'cash' => 11120,
            'change' => 0,
            'discount' => 500,
            'loyalty_discount_total' => 200,
            'customer_voucher_discount' => 300,
            'shipping_cost' => 500,
            'grand_total' => 11120,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'tax_rate' => 18,
            'taxable_amount' => 9000,
            'tax_total' => 1620,
        ]);

        TransactionDetail::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'qty' => 2,
            'price' => 10000,
            'cost_total' => 6000,
            'discount_total' => 1000,
            'gross_sales_amount' => 11000,
        ]);

        $this->actingAs($user)
            ->get(route('reports.sales.index', ['per_page' => 25]))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/Reports/Sales')
                ->where('transactions.per_page', 25)
                ->where('summary.gross_sales_total', 13120)
                ->where('summary.tax_total', 1620)
                ->where('summary.tax_rate', 18)
                ->where('summary.revenue_total', 9000)
                ->where('summary.cost_total', 6000)
                ->where('summary.cost_complete', true)
                ->where('summary.profit_total', 3000)
                ->where('summary.profit_margin', 33.3)
                ->where('summary.discount_total', 2000)
                ->where('analytics.daily_sales.0.total', 9000)
                ->where('analytics.payment_methods.0.total', 11120)
            );
    }

    public function test_legacy_sales_recover_cost_from_recorded_profit_rows(): void
    {
        Permission::firstOrCreate([
            'name' => 'reports-access',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->markEmailAsVerified();
        $user->givePermissionTo('reports-access');

        $warehouse = Warehouse::create([
            'code' => 'LEGACY',
            'name' => 'Legacy warehouse',
            'type' => 'main',
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $category = Category::create([
            'name' => 'Legacy category',
            'image' => 'categories/legacy.jpg',
            'description' => 'Legacy report test category',
        ]);
        $product = Product::create([
            'title' => 'Legacy product',
            'sku' => 'LEGACY-'.uniqid(),
            'buy_price' => 3000,
            'sell_price' => 6000,
            'stock' => 10,
            'image' => 'products/legacy.jpg',
            'barcode' => 'LEGACY-'.uniqid(),
            'description' => 'Legacy report test product',
            'tax_rate' => 0,
            'category_id' => $category->id,
        ]);
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'warehouse_id' => $warehouse->id,
            'invoice' => 'LEGACY-INV-1',
            'cash' => 6000,
            'change' => 0,
            'discount' => 0,
            'shipping_cost' => 0,
            'grand_total' => 6000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'tax_rate' => 0,
            'tax_total' => 0,
        ]);
        TransactionDetail::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'qty' => 1,
            'price' => 6000,
            'discount_total' => 0,
        ]);
        Profit::create([
            'transaction_id' => $transaction->id,
            'total' => 3000,
        ]);

        $this->actingAs($user)
            ->get(route('reports.sales.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('summary.cost_complete', true)
                ->where('summary.cost_total', 3000)
                ->where('summary.profit_total', 3000)
                ->where('summary.profit_margin', 50)
                ->where('summary.gross_sales_total', 6000)
                ->where('summary.tax_rate', 0)
            );
    }

    public function test_completed_returns_reduce_net_sales_cost_profit_and_sold_quantity(): void
    {
        Permission::firstOrCreate([
            'name' => 'reports-access',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->markEmailAsVerified();
        $user->givePermissionTo('reports-access');
        $warehouse = Warehouse::create([
            'code' => 'RETURN-REPORT',
            'name' => 'Return report warehouse',
            'type' => 'main',
            'is_active' => true,
            'sort_order' => 0,
        ]);
        $category = Category::create([
            'name' => 'Return report category',
            'image' => 'categories/return-report.jpg',
            'description' => 'Return report test category',
        ]);
        $product = Product::create([
            'title' => 'Return report product',
            'sku' => 'RETURN-REPORT-'.uniqid(),
            'buy_price' => 1500,
            'sell_price' => 3000,
            'stock' => 10,
            'image' => 'products/return-report.jpg',
            'barcode' => 'RETURN-REPORT-'.uniqid(),
            'description' => 'Return report test product',
            'tax_rate' => 0,
            'category_id' => $category->id,
        ]);
        $transaction = Transaction::create([
            'cashier_id' => $user->id,
            'warehouse_id' => $warehouse->id,
            'invoice' => 'RETURN-REPORT-INV-1',
            'cash' => 6000,
            'change' => 0,
            'discount' => 0,
            'shipping_cost' => 0,
            'grand_total' => 6000,
            'payment_method' => 'cash',
            'payment_status' => 'paid',
            'tax_rate' => 0,
            'taxable_amount' => 6000,
            'tax_total' => 0,
        ]);
        $detail = TransactionDetail::create([
            'transaction_id' => $transaction->id,
            'product_id' => $product->id,
            'qty' => 2,
            'price' => 6000,
            'cost_total' => 3000,
            'discount_total' => 0,
            'taxable_amount' => 6000,
            'gross_sales_amount' => 6000,
            'tax_total' => 0,
            'tax_type' => 'exclusive',
        ]);
        Profit::create([
            'transaction_id' => $transaction->id,
            'total' => 3000,
        ]);
        $salesReturn = SalesReturn::create([
            'code' => 'SR-RETURN-REPORT-001',
            'transaction_id' => $transaction->id,
            'warehouse_id' => $warehouse->id,
            'cashier_id' => $user->id,
            'status' => 'completed',
            'return_type' => 'refund_cash',
            'refund_amount' => 2500,
            'credited_amount' => 500,
            'total_return_amount' => 3000,
            'completed_at' => now(),
        ]);
        $salesReturn->items()->create([
            'transaction_detail_id' => $detail->id,
            'product_id' => $product->id,
            'qty_sold' => 2,
            'qty_returned_before' => 0,
            'qty_return' => 1,
            'unit_price' => 3000,
            'subtotal' => 3000,
            'cost_total' => null,
            'net_sales_total' => null,
            'tax_refund_total' => null,
            'return_reason' => 'Damaged packaging',
            'restock_to_inventory' => true,
        ]);
        Profit::create([
            'transaction_id' => $transaction->id,
            'total' => -1500,
        ]);

        $this->actingAs($user)
            ->get(route('reports.sales.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('summary.gross_sales_total', 3000)
                ->where('summary.revenue_total', 3000)
                ->where('summary.returns_total', 3000)
                ->where('summary.cash_refund_total', 2500)
                ->where('summary.store_credit_total', 500)
                ->where('summary.returned_items', 1)
                ->where('summary.items_sold', 1)
                ->where('summary.cost_total', 1500)
                ->where('summary.profit_total', 1500)
                ->where('summary.return_financials_complete', true)
                ->where('analytics.daily_sales.0.total', 3000)
                ->where('analytics.top_products.0.quantity', 1)
            );
    }
}
