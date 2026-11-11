<?php

namespace Tests\Feature\SalesReturn;

use App\Models\ManualSalesReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class ManualSalesReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['sales-returns-access', 'sales-returns-create'] as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }
    }

    public function test_authorized_user_can_save_and_view_manual_sales_report_with_tax_totals(): void
    {
        $user = User::factory()->create();
        $user->givePermissionTo(['sales-returns-access', 'sales-returns-create']);

        $response = $this->actingAs($user)->post(route('manual-sales-reports.store'), [
            'vendor_name' => 'Example Vendor',
            'report_date' => '2026-11-02',
            'reference_number' => 'INV-100',
            'notes' => 'Manual entry',
            'items' => [
                [
                    'description' => 'Product A',
                    'quantity' => 3,
                    'unit_rate' => 100,
                    'tax_type' => 'percentage',
                    'tax_value' => 10,
                ],
                [
                    'description' => 'Product B',
                    'quantity' => 2,
                    'unit_rate' => 50,
                    'tax_type' => 'amount',
                    'tax_value' => 5,
                ],
            ],
        ]);

        $report = ManualSalesReport::firstOrFail();
        $response->assertRedirect(route('manual-sales-reports.print', $report));
        $this->assertSame('500.00', $report->subtotal);
        $this->assertSame('45.00', $report->tax_total);
        $this->assertSame('545.00', $report->grand_total);
        $this->assertDatabaseCount('manual_sales_report_items', 2);

        $this->actingAs($user)
            ->get(route('manual-sales-reports.print', $report))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard/ManualSalesReports/Print')
                ->where('report.vendor_name', 'Example Vendor')
                ->where('report.items.0.tax_amount', '30.00')
                ->where('report.grand_total', '545.00')
            );
    }

    public function test_user_cannot_view_another_users_manual_sales_report(): void
    {
        $owner = User::factory()->create();
        $viewer = User::factory()->create();
        $viewer->givePermissionTo('sales-returns-access');
        $report = ManualSalesReport::create([
            'code' => 'MSR-TEST-001',
            'vendor_name' => 'Private Vendor',
            'report_date' => '2026-11-02',
            'subtotal' => 100,
            'tax_total' => 0,
            'grand_total' => 100,
            'created_by' => $owner->id,
        ]);

        $this->actingAs($viewer)
            ->get(route('manual-sales-reports.print', $report))
            ->assertForbidden();
    }
}
