<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Models\ManualSalesReport;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ManualSalesReportController extends Controller
{
    public function create(): Response
    {
        $this->ensureReportTablesExist();

        return Inertia::render('Dashboard/ManualSalesReports/Create', [
            'reportDate' => now()->toDateString(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->ensureReportTablesExist();

        $validated = $request->validate([
            'vendor_name' => ['required', 'string', 'max:255'],
            'report_date' => ['required', 'date_format:Y-m-d'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'items' => ['required', 'array', 'min:1', 'max:200'],
            'items.*.description' => ['required', 'string', 'max:255'],
            'items.*.quantity' => ['required', 'numeric', 'gt:0', 'max:9999999.999'],
            'items.*.unit_rate' => ['required', 'numeric', 'min:0', 'max:9999999999999.99'],
            'items.*.tax_type' => ['required', 'in:percentage,amount'],
            'items.*.tax_value' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
        ]);

        foreach ($validated['items'] as $index => $item) {
            if ($item['tax_type'] === 'percentage' && (float) $item['tax_value'] > 100) {
                throw ValidationException::withMessages([
                    "items.{$index}.tax_value" => 'Tax percentage must be between 0 and 100.',
                ]);
            }
        }

        $report = DB::transaction(function () use ($request, $validated) {
            $items = [];
            $subtotalTotal = 0;
            $taxTotal = 0;

            foreach ($validated['items'] as $index => $item) {
                $subtotal = round((float) $item['quantity'] * (float) $item['unit_rate'], 2);
                $taxAmount = $item['tax_type'] === 'percentage'
                    ? round($subtotal * (float) $item['tax_value'] / 100, 2)
                    : round((float) $item['tax_value'], 2);
                if ($subtotal > 9999999999999.99 || $taxAmount > 9999999999999.99) {
                    throw ValidationException::withMessages([
                        "items.{$index}.unit_rate" => 'This item total exceeds the supported report amount.',
                    ]);
                }
                $subtotalTotal += $subtotal;
                $taxTotal += $taxAmount;
                $items[] = [
                    ...$item,
                    'subtotal' => $subtotal,
                    'tax_amount' => $taxAmount,
                    'total' => round($subtotal + $taxAmount, 2),
                ];
            }

            if ($subtotalTotal + $taxTotal > 9999999999999.99) {
                throw ValidationException::withMessages([
                    'items' => 'The report total exceeds the supported amount.',
                ]);
            }

            $report = ManualSalesReport::create([
                'code' => 'MSR-'.$validated['report_date'].'-'.Str::upper(Str::random(6)),
                'vendor_name' => $validated['vendor_name'],
                'report_date' => $validated['report_date'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'subtotal' => round($subtotalTotal, 2),
                'tax_total' => round($taxTotal, 2),
                'grand_total' => round($subtotalTotal + $taxTotal, 2),
                'created_by' => $request->user()->id,
            ]);

            $report->items()->createMany($items);

            return $report;
        });

        return to_route('manual-sales-reports.print', $report)
            ->with('success', 'Manual sales report saved successfully.');
    }

    public function print(Request $request, ManualSalesReport $manualSalesReport): Response
    {
        $this->authorizeReportAccess($request, $manualSalesReport);
        $manualSalesReport->load(['items', 'creator:id,name']);

        return Inertia::render('Dashboard/ManualSalesReports/Print', [
            'report' => $manualSalesReport,
        ]);
    }

    private function authorizeReportAccess(Request $request, ManualSalesReport $report): void
    {
        abort_unless(
            $request->user()->isSuperAdmin() || $report->created_by === $request->user()->id,
            403
        );
    }

    private function ensureReportTablesExist(): void
    {
        abort_unless(
            Schema::hasTable('manual_sales_reports')
                && Schema::hasTable('manual_sales_report_items'),
            503,
            'Manual sales reports are unavailable until the database migrations have been applied.'
        );
    }
}
