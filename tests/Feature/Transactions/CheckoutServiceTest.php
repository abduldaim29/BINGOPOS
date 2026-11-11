<?php

namespace Tests\Feature\Transactions;

use App\Models\BankAccount;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Transaction;
use App\Models\TransactionTender;
use App\Models\User;
use App\Models\Warehouse;
use App\Services\CashierShiftService;
use App\Services\CheckoutService;
use App\Support\Checkout\CheckoutContext;
use Database\Seeders\PermissionSeeder;
use Database\Seeders\RoleSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class CheckoutServiceTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;

    protected Warehouse $warehouse;

    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([PermissionSeeder::class, RoleSeeder::class, UserSeeder::class]);

        $this->cashier = User::where('email', 'cashier@gmail.com')->first();
        $this->cashier->markEmailAsVerified();

        $category = Category::create([
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

        $this->product = Product::create([
            'title' => 'Produk Test',
            'sku' => 'SKU-CO-'.uniqid(),
            'buy_price' => 5000,
            'sell_price' => 10000,
            'stock' => 100,
            'image' => 'products/test.jpg',
            'barcode' => 'BC-CO-'.uniqid(),
            'description' => 'Deskripsi produk test',
            'tax_rate' => 0,
            'category_id' => $category->id,
        ]);
        $this->warehouse->products()->attach($this->product->id, ['stock' => 100]);

        app(CashierShiftService::class)->openShift(
            $this->cashier,
            $this->cashier,
            0,
            null,
            $this->warehouse->id,
        );

        BankAccount::create([
            'bank_name' => 'BCA',
            'account_number' => '1234567890',
            'account_name' => 'Toko Test',
            'is_active' => true,
        ]);

        $this->actingAs($this->cashier);
    }

    private function payCash(
        int $amount = 10000,
        ?float $taxRateOverride = null,
        int $manualDiscount = 0,
    ): CheckoutContext
    {
        $this->post(route('transactions.addToCart'), [
            'product_id' => $this->product->id,
            'sell_price' => 10000,
            'qty' => 1,
        ]);

        return new CheckoutContext(
            userId: $this->cashier->id,
            customer: null,
            voucher: null,
            manualDiscount: $manualDiscount,
            shippingCost: 0,
            requestedRedeemPoints: 0,
            isPayLater: false,
            dueDate: null,
            orderType: null,
            note: null,
            customerNpwp: null,
            isCashPayment: true,
            cashAmount: $amount,
            paymentGateway: null,
            useTenders: false,
            tenderInput: [],
            outlet: null,
            bankAccountId: null,
            taxRateOverride: $taxRateOverride,
        );
    }

    public function test_cash_below_total_throws_validation(): void
    {
        $context = $this->payCash(9999);

        try {
            app(CheckoutService::class)->execute($context);
            $this->fail('Expected ValidationException for cash below total.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('cash', $e->errors());
            $this->assertSame(0, Transaction::count(), 'No transaction should be created on validation failure.');
        }
    }

    public function test_cash_equal_total_succeeds(): void
    {
        $context = $this->payCash(11600);
        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(11600, $result->transaction->grand_total);
        $this->assertSame(1600, $result->transaction->tax_total);
        $this->assertSame('16.00', $result->transaction->tax_rate);
        $this->assertSame('cash', $result->paymentMethod);
        $this->assertSame('paid', $result->paymentStatus);
        $this->assertFalse($result->needsDiscountApproval);
        $this->assertSame(5000, (int) $result->transaction->details()->firstOrFail()->cost_total);
        $this->assertSame(5000, (int) $result->transaction->profits()->sum('total'));
        $this->assertSame(99, $this->warehouse->products()->where('product_id', $this->product->id)->first()->pivot->stock);
    }

    public function test_pricing_preview_applies_payment_vat_to_zero_rate_products(): void
    {
        $this->post(route('transactions.addToCart'), [
            'product_id' => $this->product->id,
            'sell_price' => 10000,
            'qty' => 1,
        ]);

        $this->postJson(route('transactions.pricing-preview'), [
            'payment_method' => 'cash',
        ])->assertOk()
            ->assertJsonPath('data.summary.tax_total', 1600)
            ->assertJsonPath('data.summary.tax_rate', 16);

        $this->postJson(route('transactions.pricing-preview'), [
            'payment_method' => 'card',
        ])->assertOk()
            ->assertJsonPath('data.summary.tax_total', 600)
            ->assertJsonPath('data.summary.tax_rate', 6);

        $this->postJson(route('transactions.pricing-preview'), [
            'payment_method' => 'bank_transfer',
        ])->assertOk()
            ->assertJsonPath('data.summary.tax_total', 0);
    }

    public function test_manual_card_checkout_is_recorded_as_paid(): void
    {
        $this->post(route('transactions.addToCart'), [
            'product_id' => $this->product->id,
            'sell_price' => 10000,
            'qty' => 1,
        ]);

        $context = new CheckoutContext(
            userId: $this->cashier->id,
            customer: null,
            voucher: null,
            manualDiscount: 0,
            shippingCost: 0,
            requestedRedeemPoints: 0,
            isPayLater: false,
            dueDate: null,
            orderType: null,
            note: null,
            customerNpwp: null,
            isCashPayment: false,
            cashAmount: 0,
            paymentGateway: TransactionTender::METHOD_CARD,
            useTenders: false,
            tenderInput: [],
            outlet: null,
            bankAccountId: null,
        );

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(TransactionTender::METHOD_CARD, $result->paymentMethod);
        $this->assertSame('paid', $result->paymentStatus);
        $this->assertSame(TransactionTender::METHOD_CARD, $result->transaction->payment_method);
        $this->assertSame('paid', $result->transaction->payment_status);
    }

    public function test_cash_checkout_uses_configured_cash_vat_rate(): void
    {
        $this->product->update(['tax_rate' => 18]);
        $context = $this->payCash(11600);

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(11600, $result->transaction->grand_total);
        $this->assertSame(1600, $result->transaction->tax_total);
        $this->assertSame('16.00', $result->transaction->tax_rate);
    }

    public function test_card_checkout_uses_configured_card_vat_rate(): void
    {
        $this->post(route('transactions.addToCart'), [
            'product_id' => $this->product->id,
            'sell_price' => 10000,
            'qty' => 1,
        ]);
        $context = new CheckoutContext(
            userId: $this->cashier->id,
            customer: null,
            voucher: null,
            manualDiscount: 0,
            shippingCost: 0,
            requestedRedeemPoints: 0,
            isPayLater: false,
            dueDate: null,
            orderType: null,
            note: null,
            customerNpwp: null,
            isCashPayment: false,
            cashAmount: 0,
            paymentGateway: TransactionTender::METHOD_CARD,
            useTenders: false,
            tenderInput: [],
            outlet: null,
            bankAccountId: null,
        );

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(10600, $result->transaction->grand_total);
        $this->assertSame(600, $result->transaction->tax_total);
        $this->assertSame('6.00', $result->transaction->tax_rate);
    }

    public function test_split_cash_and_card_checkout_uses_amount_weighted_vat_rate(): void
    {
        $this->product->update(['tax_rate' => 18]);
        $this->post(route('transactions.addToCart'), [
            'product_id' => $this->product->id,
            'sell_price' => 10000,
            'qty' => 1,
        ]);
        $context = new CheckoutContext(
            userId: $this->cashier->id,
            customer: null,
            voucher: null,
            manualDiscount: 0,
            shippingCost: 0,
            requestedRedeemPoints: 0,
            isPayLater: false,
            dueDate: null,
            orderType: null,
            note: null,
            customerNpwp: null,
            isCashPayment: false,
            cashAmount: 0,
            paymentGateway: null,
            useTenders: true,
            tenderInput: [
                ['method' => TransactionTender::METHOD_CASH, 'amount' => 6720, 'cash_received' => 6720],
                ['method' => TransactionTender::METHOD_CARD, 'amount' => 4480],
            ],
            outlet: null,
            bankAccountId: null,
        );

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(11200, $result->transaction->grand_total);
        $this->assertSame(1200, $result->transaction->tax_total);
        $this->assertSame('12.00', $result->transaction->tax_rate);
        $this->assertSame(11200, (int) $result->transaction->tenders()->sum('amount'));
    }

    public function test_manual_tax_rate_override_is_applied_and_saved(): void
    {
        $context = $this->payCash(12000, 12.5);

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(11250, $result->transaction->grand_total);
        $this->assertSame(1250, $result->transaction->tax_total);
        $this->assertSame('12.50', $result->transaction->tax_rate);
        $this->assertSame(10000, $result->transaction->taxable_amount);
        $detail = $result->transaction->details()->firstOrFail();
        $this->assertSame(1250, $detail->tax_total);
        $this->assertSame(10000, $detail->taxable_amount);
        $this->assertSame('12.5000', $detail->tax_rate);
        $this->assertSame(10000, $detail->gross_sales_amount);
    }

    public function test_inclusive_tax_is_not_added_twice_to_the_checkout_total(): void
    {
        $this->product->update([
            'tax_type' => 'inclusive',
            'tax_rate' => 18,
        ]);
        $context = $this->payCash(10000);

        $result = app(CheckoutService::class)->execute($context);
        $detail = $result->transaction->details()->firstOrFail();

        $this->assertSame(10000, $result->transaction->grand_total);
        $this->assertSame(1379, $result->transaction->tax_total);
        $this->assertSame(8621, $result->transaction->taxable_amount);
        $this->assertSame(8621, $detail->taxable_amount);
        $this->assertSame(1379, $detail->tax_total);
        $this->assertSame(3621, (int) $result->transaction->profits()->sum('total'));
        $this->assertSame(8621, $detail->gross_sales_amount);
    }

    public function test_invoice_discount_does_not_change_the_recorded_tax_base(): void
    {
        $this->product->update([
            'tax_type' => 'exclusive',
            'tax_rate' => 18,
        ]);
        $context = $this->payCash(10600, null, 1000);

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(10600, $result->transaction->grand_total);
        $this->assertSame(1600, $result->transaction->tax_total);
        $this->assertSame(10000, $result->transaction->taxable_amount);
    }

    public function test_cash_vat_rate_applies_to_taxable_products_and_shipping(): void
    {
        Setting::set('tax_default_rate', '18.00');

        $otherProduct = Product::create([
            'title' => 'Reduced tax product',
            'sku' => 'SKU-CO-'.uniqid(),
            'buy_price' => 3000,
            'sell_price' => 10000,
            'stock' => 100,
            'image' => 'products/test.jpg',
            'barcode' => 'BC-CO-'.uniqid(),
            'description' => 'Reduced rate test product',
            'tax_type' => 'exclusive',
            'tax_rate' => 10,
            'category_id' => $this->product->category_id,
        ]);
        $this->warehouse->products()->attach($otherProduct->id, ['stock' => 100]);

        $this->product->update([
            'tax_type' => 'exclusive',
            'tax_rate' => 18,
        ]);
        foreach ([$this->product, $otherProduct] as $product) {
            $this->post(route('transactions.addToCart'), [
                'product_id' => $product->id,
                'sell_price' => 10000,
                'qty' => 1,
            ]);
        }

        $context = new CheckoutContext(
            userId: $this->cashier->id,
            customer: null,
            voucher: null,
            manualDiscount: 0,
            shippingCost: 1000,
            requestedRedeemPoints: 0,
            isPayLater: false,
            dueDate: null,
            orderType: null,
            note: null,
            customerNpwp: null,
            isCashPayment: true,
            cashAmount: 24360,
            paymentGateway: null,
            useTenders: false,
            tenderInput: [],
            outlet: null,
            bankAccountId: null,
        );

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame(3360, $result->transaction->tax_total);
        $this->assertSame(21000, $result->transaction->taxable_amount);
        $this->assertSame('16.00', $result->transaction->tax_rate);
        $this->assertSame(24360, $result->transaction->grand_total);
    }

    public function test_split_tender_creates_two_rows_and_marks_parent_split(): void
    {
        $this->post(route('transactions.addToCart'), [
            'product_id' => $this->product->id,
            'sell_price' => 10000,
            'qty' => 1,
        ]);

        $bankAccount = BankAccount::active()->first();

        $context = new CheckoutContext(
            userId: $this->cashier->id,
            customer: null,
            voucher: null,
            manualDiscount: 0,
            shippingCost: 0,
            requestedRedeemPoints: 0,
            isPayLater: false,
            dueDate: null,
            orderType: null,
            note: null,
            customerNpwp: null,
            isCashPayment: false,
            cashAmount: 0,
            paymentGateway: null,
            useTenders: true,
            tenderInput: [
                ['method' => TransactionTender::METHOD_CASH, 'amount' => 5850, 'cash_received' => 5850],
                ['method' => TransactionTender::METHOD_BANK_TRANSFER, 'amount' => 5850, 'bank_account_id' => $bankAccount->id],
            ],
            outlet: null,
            bankAccountId: $bankAccount->id,
        );

        $result = app(CheckoutService::class)->execute($context);

        $this->assertSame('split', $result->paymentMethod);
        $this->assertSame('paid', $result->paymentStatus);
        $this->assertSame(2, $result->transaction->tenders()->count());
        $this->assertSame(11700, $result->transaction->grand_total);
        $this->assertSame(11700, (int) $result->transaction->tenders()->sum('amount'));
        $this->assertSame(5850, (int) $result->transaction->cash);
    }

    public function test_empty_cart_aborts_422(): void
    {
        $context = new CheckoutContext(
            userId: $this->cashier->id,
            customer: null,
            voucher: null,
            manualDiscount: 0,
            shippingCost: 0,
            requestedRedeemPoints: 0,
            isPayLater: false,
            dueDate: null,
            orderType: null,
            note: null,
            customerNpwp: null,
            isCashPayment: true,
            cashAmount: 10000,
            paymentGateway: null,
            useTenders: false,
            tenderInput: [],
            outlet: null,
            bankAccountId: null,
        );

        $this->expectException(HttpException::class);
        app(CheckoutService::class)->execute($context);
    }
}
