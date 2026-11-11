<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Profit;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\User;
use App\Services\OutletAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class SalesReportController extends Controller
{
    /**
     * Display the sales report.
     */
    public function index(Request $request, OutletAccessService $outletAccessService)
    {
        $hasCostSnapshots = Schema::hasColumn('transaction_details', 'cost_total');
        $hasTransactionTaxSnapshots = Schema::hasColumn('transactions', 'taxable_amount');
        $hasDetailTaxSnapshots = Schema::hasColumn('transaction_details', 'tax_total')
            && Schema::hasColumn('transaction_details', 'tax_type');
        $hasDetailTaxSnapshots = Schema::hasColumn('transaction_details', 'tax_total')
            && Schema::hasColumn('transaction_details', 'tax_type');
        $hasSalesReturnTables = Schema::hasTable('sales_returns')
            && Schema::hasTable('sales_return_items');
        $hasReturnCostSnapshots = $hasSalesReturnTables
            && Schema::hasColumn('sales_return_items', 'cost_total');
        $hasReturnSalesSnapshots = $hasSalesReturnTables
            && Schema::hasColumn('sales_return_items', 'net_sales_total')
            && Schema::hasColumn('sales_return_items', 'tax_refund_total');

        $warehouseIds = $outletAccessService->warehousesFor($request->user())->pluck('id');
        $activeOutlet = $outletAccessService->activeOutlet($request);
        if ($activeOutlet) {
            $warehouseIds = $outletAccessService->warehousesFor($request->user())
                ->where('outlet_id', $activeOutlet->id)
                ->pluck('id');
        }
        $filters = [
            'start_date' => $request->input('start_date'),
            'end_date' => $request->input('end_date'),
            'invoice' => $request->input('invoice'),
            'cashier_id' => $request->input('cashier_id'),
            'customer_id' => $request->input('customer_id'),
            'warehouse_id' => $warehouseIds->contains((int) $request->input('warehouse_id')) ? $request->input('warehouse_id') : null,
        ];
        $requestedPerPage = (int) $request->input('per_page', 10);
        $perPage = in_array($requestedPerPage, [10, 25, 50], true)
            ? $requestedPerPage
            : 10;

        $detailColumns = [
            'id',
            'transaction_id',
            'product_id',
            'unit_id',
            'qty',
            'price',
            'variation_name',
            'discount_total',
        ];
        if ($hasCostSnapshots) {
            $detailColumns[] = 'cost_total';
        }
        if ($hasDetailTaxSnapshots) {
            $detailColumns[] = 'tax_total';
            $detailColumns[] = 'tax_type';
        }

        $baseListQuery = $this->applyFilters(
            Transaction::query()
                ->with([
                    'cashier:id,name',
                    'customer:id,name',
                    'warehouse:id,code,name',
                    'details:'.implode(',', $detailColumns),
                    'details.product:id,title',
                    'details.unit:id,name,symbol',
                ])
                ->withCount('details')
                ->withCount('profits as recorded_profit_rows')
                ->withSum('profits as recorded_profit', 'total')
                ->withSum('details as total_items', 'qty'),
            $filters,
            $warehouseIds
        )->orderByDesc('created_at');
        if ($hasSalesReturnTables) {
            $baseListQuery
                ->withSum([
                    'salesReturns as completed_return_total' => fn ($query) => $query->where('status', 'completed'),
                ], 'total_return_amount')
                ->withSum([
                    'salesReturns as completed_refund_total' => fn ($query) => $query->where('status', 'completed'),
                ], 'refund_amount')
                ->withSum([
                    'salesReturns as completed_credit_total' => fn ($query) => $query->where('status', 'completed'),
                ], 'credited_amount')
                ->with([
                    'salesReturns' => fn ($query) => $query
                        ->where('status', 'completed')
                        ->with('items'),
                ]);
        }

        $transactions = (clone $baseListQuery)
            ->paginate($perPage)
            ->withQueryString();
        if ($hasSalesReturnTables) {
            $transactions->getCollection()->each(function (Transaction $transaction) use ($hasCostSnapshots, $hasDetailTaxSnapshots) {
                $returnItems = $transaction->salesReturns->flatMap(fn ($salesReturn) => $salesReturn->items);
                $invoiceDiscounts = $this->invoiceDiscountAllocations(
                    $transaction,
                    $transaction->details->sortBy('id')->values()
                );
                $returnNetSalesComplete = true;
                $returnNetSalesTotal = 0;
                $returnRestockCost = 0;
                $returnedQtyByDetail = $returnItems
                    ->groupBy('transaction_detail_id')
                    ->map(fn ($items) => (int) $items->sum('qty_return'));

                foreach ($returnItems as $item) {
                    $detail = $transaction->details->firstWhere('id', $item->transaction_detail_id);
                    $netSales = $item->net_sales_total;
                    if (
                        $netSales === null
                        && $hasDetailTaxSnapshots
                        && $detail
                        && $detail->tax_total !== null
                        && $detail->tax_type !== null
                    ) {
                        $returnedSubtotal = $this->allocateReturnedAmount(
                            (int) $detail->price,
                            (int) $item->qty_returned_before,
                            (int) $item->qty_return,
                            (int) $detail->qty
                        );
                        $taxRefund = $detail->tax_type === 'inclusive'
                            ? $this->allocateReturnedAmount(
                                (int) $detail->tax_total,
                                (int) $item->qty_returned_before,
                                (int) $item->qty_return,
                                (int) $detail->qty
                            )
                            : 0;
                        $discountRefund = $this->allocateReturnedAmount(
                            (int) ($invoiceDiscounts[$detail->id] ?? 0),
                            (int) $item->qty_returned_before,
                            (int) $item->qty_return,
                            (int) $detail->qty
                        );
                        $netSales = max(0, $returnedSubtotal - $taxRefund - $discountRefund);
                    }
                    if ($netSales === null) {
                        $returnNetSalesComplete = false;
                    } else {
                        $returnNetSalesTotal += (int) $netSales;
                    }
                }

                foreach ($returnItems->where('restock_to_inventory', true) as $item) {
                    $returnedCost = $item->cost_total;
                    if ($returnedCost === null && $hasCostSnapshots) {
                        $detail = $transaction->details->firstWhere('id', $item->transaction_detail_id);
                        if ($detail?->cost_total !== null) {
                            $returnedCost = $this->allocateReturnedAmount(
                                (int) $detail->cost_total,
                                (int) $item->qty_returned_before,
                                (int) $item->qty_return,
                                (int) $detail->qty
                            );
                        }
                    }
                    if ($returnedCost !== null) {
                        $returnRestockCost += (int) $returnedCost;
                    }
                }
                foreach ($transaction->details as $detail) {
                    $detail->setAttribute(
                        'returned_qty',
                        (int) ($returnedQtyByDetail[$detail->id] ?? 0)
                    );
                }

                $transaction->setAttribute(
                    'completed_return_net_sales_total',
                    $returnNetSalesComplete
                        ? $returnNetSalesTotal
                        : null
                );
                $transaction->setAttribute('completed_return_restock_cost', $returnRestockCost);
                $transaction->setAttribute(
                    'completed_return_items_count',
                    $returnItems->count()
                );
                $transaction->setAttribute(
                    'total_items',
                    max(0, (int) $transaction->total_items - (int) $returnItems->sum('qty_return'))
                );
                $transaction->setAttribute(
                    'completed_return_financials_complete',
                    $returnNetSalesComplete
                );
                $transaction->unsetRelation('salesReturns');
            });
        }

        $aggregateQuery = $this->applyFilters(Transaction::query(), $filters, $warehouseIds);

        $taxSnapshotSelect = $hasTransactionTaxSnapshots
            ? 'COUNT(taxable_amount) as tax_snapshot_count, COALESCE(SUM(taxable_amount), 0) as taxable_amount_total'
            : '0 as tax_snapshot_count, 0 as taxable_amount_total';
        $totals = (clone $aggregateQuery)
            ->selectRaw('
                COUNT(*) as orders_count,
                COALESCE(SUM(grand_total), 0) as invoice_total,
                COALESCE(SUM(
                    grand_total
                    - COALESCE(tax_total, 0)
                    - COALESCE(shipping_cost, 0)
                ), 0) as revenue_total,
                COALESCE(SUM(tax_total), 0) as tax_total,
                COALESCE(SUM(
                    COALESCE(discount, 0)
                    + COALESCE(loyalty_discount_total, 0)
                    + COALESCE(customer_voucher_discount, 0)
                ), 0) as transaction_discount_total,
                COALESCE(
                    SUM(
                        CASE
                            WHEN tax_rate IS NOT NULL
                            THEN tax_rate * (
                                grand_total
                                - COALESCE(tax_total, 0)
                                - COALESCE(shipping_cost, 0)
                            )
                            ELSE 0
                        END
                    ) / NULLIF(
                        SUM(
                            CASE
                                WHEN tax_rate IS NOT NULL
                                THEN grand_total
                                    - COALESCE(tax_total, 0)
                                    - COALESCE(shipping_cost, 0)
                                ELSE 0
                            END
                        ),
                        0
                    ),
                    0
                ) as recorded_tax_rate
            ')
            ->selectRaw($taxSnapshotSelect)
            ->first();

        $transactionIds = (clone $aggregateQuery)->select('id');
        $hasTransactions = (int) ($totals->orders_count ?? 0) > 0;
        $returnAmountsByTransaction = $hasSalesReturnTables
            ? SalesReturn::query()
                ->where('status', 'completed')
                ->selectRaw('
                    transaction_id,
                    COALESCE(SUM(total_return_amount), 0) as return_total,
                    COALESCE(SUM(refund_amount), 0) as refund_total,
                    COALESCE(SUM(credited_amount), 0) as credit_total
                ')
                ->groupBy('transaction_id')
            : DB::query()
                ->selectRaw('
                    NULL as transaction_id,
                    0 as return_total,
                    0 as refund_total,
                    0 as credit_total
                ')
                ->whereRaw('1 = 0');
        $returnTotals = $hasSalesReturnTables && $hasTransactions
            ? DB::query()
                ->fromSub(
                    (clone $returnAmountsByTransaction)->whereIn('transaction_id', clone $transactionIds),
                    'return_amounts'
                )
                ->selectRaw('
                    COALESCE(SUM(return_total), 0) as return_total,
                    COALESCE(SUM(refund_total), 0) as refund_total,
                    COALESCE(SUM(credit_total), 0) as credit_total
                ')
                ->first()
            : (object) ['return_total' => 0, 'refund_total' => 0, 'credit_total' => 0];

        $returnItemsByDetail = $hasSalesReturnTables
            ? SalesReturnItem::query()
                ->join('sales_returns', 'sales_returns.id', '=', 'sales_return_items.sales_return_id')
                ->where('sales_returns.status', 'completed')
                ->selectRaw('
                    sales_return_items.transaction_detail_id,
                    SUM(sales_return_items.qty_return) as returned_qty,
                    SUM(sales_return_items.subtotal) as returned_amount,
                    COUNT(*) as return_item_count
                ')
                ->groupBy('sales_return_items.transaction_detail_id')
            : DB::query()
                ->selectRaw('
                    NULL as transaction_detail_id,
                    0 as returned_qty,
                    0 as returned_amount,
                    0 as return_item_count
                ')
                ->whereRaw('1 = 0');

        $derivedReturnCostExpression = $hasCostSnapshots
            ? '(ROUND(returned_details.cost_total * (sales_return_items.qty_returned_before + sales_return_items.qty_return) / NULLIF(returned_details.qty, 0))
                - ROUND(returned_details.cost_total * sales_return_items.qty_returned_before / NULLIF(returned_details.qty, 0)))'
            : 'NULL';
        $returnedCostExpression = $hasReturnCostSnapshots
            ? 'COALESCE(sales_return_items.cost_total, '.$derivedReturnCostExpression.')'
            : $derivedReturnCostExpression;
        $priorLinePriceExpression = '(SELECT COALESCE(SUM(previous_details.price), 0)
            FROM transaction_details as previous_details
            WHERE previous_details.transaction_id = returned_details.transaction_id
                AND previous_details.id < returned_details.id)';
        $transactionLinePriceExpression = '(SELECT COALESCE(SUM(all_details.price), 0)
            FROM transaction_details as all_details
            WHERE all_details.transaction_id = returned_details.transaction_id)';
        $invoiceDiscountExpression = '(COALESCE(returned_transactions.discount, 0)
            + COALESCE(returned_transactions.loyalty_discount_total, 0)
            + COALESCE(returned_transactions.customer_voucher_discount, 0))';
        $allocatedInvoiceDiscountExpression = "CASE
            WHEN $transactionLinePriceExpression <= 0 THEN 0
            WHEN returned_details.id = (
                SELECT MAX(last_details.id)
                FROM transaction_details as last_details
                WHERE last_details.transaction_id = returned_details.transaction_id
            )
            THEN $invoiceDiscountExpression
                - ROUND($invoiceDiscountExpression * $priorLinePriceExpression / $transactionLinePriceExpression)
            ELSE ROUND($invoiceDiscountExpression * ($priorLinePriceExpression + returned_details.price) / $transactionLinePriceExpression)
                - ROUND($invoiceDiscountExpression * $priorLinePriceExpression / $transactionLinePriceExpression)
            END";
        $allocateReturnAmountExpression = fn (string $amount) => "(
            ROUND(($amount) * (sales_return_items.qty_returned_before + sales_return_items.qty_return) / NULLIF(returned_details.qty, 0))
            - ROUND(($amount) * sales_return_items.qty_returned_before / NULLIF(returned_details.qty, 0))
        )";
        $returnedSubtotalExpression = $allocateReturnAmountExpression('returned_details.price');
        $returnedInvoiceDiscountExpression = $allocateReturnAmountExpression('('.$allocatedInvoiceDiscountExpression.')');
        $derivedReturnTaxExpression = $hasDetailTaxSnapshots
            ? 'CASE WHEN returned_details.tax_total IS NULL OR returned_details.tax_type IS NULL THEN NULL
                WHEN returned_details.tax_type <> \'inclusive\' THEN 0
                ELSE '.$allocateReturnAmountExpression('returned_details.tax_total').'
            END'
            : 'NULL';
        $derivedReturnNetSalesExpression = $hasDetailTaxSnapshots
            ? 'CASE WHEN returned_details.tax_total IS NULL OR returned_details.tax_type IS NULL THEN NULL
                WHEN '.$returnedSubtotalExpression.'
                    - COALESCE('.$derivedReturnTaxExpression.', 0)
                    - '.$returnedInvoiceDiscountExpression.' < 0 THEN 0
                ELSE '.$returnedSubtotalExpression.'
                    - COALESCE('.$derivedReturnTaxExpression.', 0)
                    - '.$returnedInvoiceDiscountExpression.'
            END'
            : 'NULL';
        $returnedNetSalesExpression = $hasReturnSalesSnapshots
            ? 'COALESCE(sales_return_items.net_sales_total, '.$derivedReturnNetSalesExpression.')'
            : $derivedReturnNetSalesExpression;
        $returnedTaxExpression = $hasReturnSalesSnapshots
            ? 'COALESCE(sales_return_items.tax_refund_total, '.$derivedReturnTaxExpression.')'
            : $derivedReturnTaxExpression;
        $unknownReturnSalesExpression = "($returnedNetSalesExpression IS NULL OR $returnedTaxExpression IS NULL)";
        $returnItemRows = $hasSalesReturnTables
            ? SalesReturnItem::query()
                ->join('sales_returns', 'sales_returns.id', '=', 'sales_return_items.sales_return_id')
                ->join('transaction_details as returned_details', 'returned_details.id', '=', 'sales_return_items.transaction_detail_id')
                ->join('transactions as returned_transactions', 'returned_transactions.id', '=', 'returned_details.transaction_id')
                ->where('sales_returns.status', 'completed')
                ->selectRaw("
                    returned_details.transaction_id,
                    sales_return_items.qty_return as return_qty,
                    $returnedNetSalesExpression as return_net_sales_total,
                    $returnedTaxExpression as return_tax_refund_total,
                    CASE WHEN sales_return_items.restock_to_inventory = 1
                        THEN COALESCE($returnedCostExpression, 0)
                        ELSE 0
                    END as returned_restock_cost,
                    CASE WHEN $unknownReturnSalesExpression THEN 1 ELSE 0 END
                        as unknown_return_financial_count
                ")
            : null;
        $returnItemFinancials = $hasSalesReturnTables
            ? DB::query()
                ->fromSub($returnItemRows, 'return_rows')
                ->selectRaw('
                    transaction_id,
                    COUNT(*) as return_item_count,
                    COALESCE(SUM(return_qty), 0) as return_qty,
                    COALESCE(SUM(return_net_sales_total), 0) as return_net_sales_total,
                    COALESCE(SUM(return_tax_refund_total), 0) as return_tax_refund_total,
                    COALESCE(SUM(returned_restock_cost), 0) as returned_restock_cost,
                    COALESCE(SUM(unknown_return_financial_count), 0) as unknown_return_financial_count
                ')
                ->groupBy('transaction_id')
            : null;

        $itemsSoldBeforeReturns = $hasTransactions
            ? TransactionDetail::whereIn('transaction_id', clone $transactionIds)->sum('qty')
            : 0;
        $returnedItems = $hasSalesReturnTables && $hasTransactions
            ? (int) DB::query()
                ->fromSub(
                    (clone $returnItemFinancials)->whereIn('transaction_id', clone $transactionIds),
                    'return_items'
                )
                ->sum('return_qty')
            : 0;
        $itemsSold = max(0, (int) $itemsSoldBeforeReturns - $returnedItems);
        $returnItemTotals = $hasSalesReturnTables && $hasTransactions
            ? DB::query()
                ->fromSub(
                    (clone $returnItemFinancials)->whereIn('transaction_id', clone $transactionIds),
                    'return_items'
                )
                ->selectRaw('
                    COALESCE(SUM(return_net_sales_total), 0) as return_net_sales_total,
                    COALESCE(SUM(return_tax_refund_total), 0) as return_tax_refund_total,
                    COALESCE(SUM(unknown_return_financial_count), 0) as unknown_return_financial_count
                ')
                ->first()
            : (object) [
                'return_net_sales_total' => 0,
                'return_tax_refund_total' => 0,
                'unknown_return_financial_count' => 0,
            ];

        $detailSnapshotSelects = [
            'COUNT(*) as details_count',
            $hasCostSnapshots
                ? 'COUNT(cost_total) as cost_snapshot_count, COALESCE(SUM(cost_total), 0) as cost_total'
                : '0 as cost_snapshot_count, 0 as cost_total',
            'COALESCE(SUM(discount_total), 0) as promotion_discount_total',
        ];
        $detailTotals = $hasTransactions
            ? TransactionDetail::whereIn('transaction_id', clone $transactionIds)
                ->selectRaw(implode(', ', $detailSnapshotSelects))
                ->first()
            : (object) [
                'details_count' => 0,
                'cost_snapshot_count' => 0,
                'cost_total' => 0,
                'promotion_discount_total' => 0,
            ];
        $promotionDiscountTotal = $hasTransactions
            ? (int) $detailTotals->promotion_discount_total
            : 0;
        $discountTotal = (int) ($totals->transaction_discount_total ?? 0)
            + (int) $promotionDiscountTotal;
        $returnTotal = (int) $returnTotals->return_total;
        $refundTotal = (int) $returnTotals->refund_total;
        $creditTotal = (int) $returnTotals->credit_total;
        $returnNetSalesTotal = (int) $returnItemTotals->return_net_sales_total;
        $returnTaxRefundTotal = (int) $returnItemTotals->return_tax_refund_total;
        $returnFinancialsComplete = (int) $returnItemTotals->unknown_return_financial_count === 0;
        $grossSalesTotal = (int) ($totals->invoice_total ?? 0)
            + $discountTotal
            - $returnTotal;
        $transactionFinancials = (clone $aggregateQuery)->select([
            'transactions.id',
            'transactions.grand_total',
            'transactions.tax_total',
            'transactions.shipping_cost',
            'transactions.discount',
            'transactions.loyalty_discount_total',
            'transactions.customer_voucher_discount',
        ]);
        if ($hasSalesReturnTables) {
            $transactionFinancials
                ->leftJoinSub($returnAmountsByTransaction, 'return_amounts', 'return_amounts.transaction_id', '=', 'transactions.id')
                ->leftJoinSub($returnItemFinancials, 'return_item_financials', 'return_item_financials.transaction_id', '=', 'transactions.id')
                ->addSelect(DB::raw('COALESCE(return_amounts.return_total, 0) as completed_return_total'))
                ->addSelect(DB::raw('COALESCE(return_item_financials.return_item_count, 0) as completed_return_items_count'))
                ->addSelect(DB::raw('COALESCE(return_item_financials.return_net_sales_total, 0) as completed_return_net_sales_total'))
                ->addSelect(DB::raw('COALESCE(return_item_financials.returned_restock_cost, 0) as completed_return_restock_cost'))
                ->addSelect(DB::raw('COALESCE(return_item_financials.unknown_return_financial_count, 0) = 0 as completed_return_financials_complete'));
        } else {
            $transactionFinancials
                ->addSelect(DB::raw('0 as completed_return_total'))
                ->addSelect(DB::raw('0 as completed_return_items_count'))
                ->addSelect(DB::raw('0 as completed_return_net_sales_total'))
                ->addSelect(DB::raw('0 as completed_return_restock_cost'))
                ->addSelect(DB::raw('1 as completed_return_financials_complete'));
        }
        $detailFinancials = TransactionDetail::query()
            ->selectRaw(
                'transaction_id, COUNT(*) as details_count, '.
                ($hasCostSnapshots
                    ? 'COUNT(cost_total) as cost_snapshot_count, COALESCE(SUM(cost_total), 0) as cost_total'
                    : '0 as cost_snapshot_count, 0 as cost_total')
            )
            ->groupBy('transaction_id');
        $profitFinancials = Profit::query()
            ->selectRaw('transaction_id, COUNT(*) as profit_rows_count, COALESCE(SUM(total), 0) as profit_total')
            ->groupBy('transaction_id');
        $returnFinancials = $returnItemFinancials ?? DB::query()
            ->selectRaw('
                NULL as transaction_id,
                0 as return_item_count,
                0 as return_qty,
                0 as return_net_sales_total,
                0 as return_tax_refund_total,
                0 as returned_restock_cost,
                0 as unknown_return_financial_count
            ')
            ->whereRaw('1 = 0');
        $costRecovery = DB::query()
            ->fromSub($transactionFinancials, 'filtered_transactions')
            ->leftJoinSub($detailFinancials, 'detail_financials', 'detail_financials.transaction_id', '=', 'filtered_transactions.id')
            ->leftJoinSub($profitFinancials, 'profit_financials', 'profit_financials.transaction_id', '=', 'filtered_transactions.id')
            ->leftJoinSub($returnFinancials, 'return_financials', 'return_financials.transaction_id', '=', 'filtered_transactions.id')
            ->selectRaw("
                SUM(
                    CASE
                        WHEN detail_financials.details_count > 0
                            AND detail_financials.cost_snapshot_count = detail_financials.details_count
                            AND COALESCE(return_financials.unknown_return_financial_count, 0) = 0
                        THEN detail_financials.cost_total - COALESCE(return_financials.returned_restock_cost, 0)
                        WHEN detail_financials.details_count > 0
                            AND detail_financials.cost_snapshot_count = 0
                            AND COALESCE(profit_financials.profit_rows_count, 0) = detail_financials.details_count
                                + COALESCE(return_financials.return_item_count, 0)
                            AND COALESCE(return_financials.unknown_return_financial_count, 0) = 0
                        THEN filtered_transactions.grand_total
                            - COALESCE(filtered_transactions.tax_total, 0)
                            - COALESCE(filtered_transactions.shipping_cost, 0)
                            - COALESCE(filtered_transactions.completed_return_net_sales_total, 0)
                            - COALESCE(profit_financials.profit_total, 0)
                        ELSE 0
                    END
                ) as cost_total,
                SUM(
                    CASE
                        WHEN detail_financials.details_count > 0
                            AND (
                                (
                                    detail_financials.cost_snapshot_count = detail_financials.details_count
                                    AND COALESCE(return_financials.unknown_return_financial_count, 0) = 0
                                )
                                OR (
                                    detail_financials.cost_snapshot_count = 0
                                    AND COALESCE(profit_financials.profit_rows_count, 0) = detail_financials.details_count
                                        + COALESCE(return_financials.return_item_count, 0)
                                    AND COALESCE(return_financials.unknown_return_financial_count, 0) = 0
                                )
                            )
                        THEN 1
                        ELSE 0
                    END
                ) as cost_complete_count
            ")
            ->first();

        $costIsComplete = (! $hasTransactions
                || (int) $costRecovery->cost_complete_count === (int) $totals->orders_count)
            && $returnFinancialsComplete;
        $costTotal = $costIsComplete ? (int) $costRecovery->cost_total : null;
        $netSalesTotal = $returnFinancialsComplete
            ? (int) ($totals->revenue_total ?? 0) - $returnNetSalesTotal
            : null;
        $grossProfitTotal = $costIsComplete
            ? $netSalesTotal - $costTotal
            : null;
        $taxSnapshotsComplete = ! $hasTransactions
            || ($hasTransactionTaxSnapshots
                && (int) $totals->tax_snapshot_count === (int) $totals->orders_count
                && $returnFinancialsComplete);
        $taxIsComplete = ! $hasTransactions || $returnFinancialsComplete;
        $taxableAmountTotal = (int) ($totals->taxable_amount_total ?? 0);
        $reportedTaxTotal = max(0, (int) ($totals->tax_total ?? 0) - $returnTaxRefundTotal);
        $hasCompletedReturns = $returnTotal > 0;
        $taxRateSource = $taxSnapshotsComplete && $taxableAmountTotal > 0 && ! $hasCompletedReturns
            ? 'taxable_amount_snapshots'
            : 'recorded_transaction_rates';
        $effectiveTaxRate = ! $hasTransactions
            ? 0
            : ($taxSnapshotsComplete && $taxableAmountTotal > 0 && ! $hasCompletedReturns
                ? round(($reportedTaxTotal / $taxableAmountTotal) * 100, 2)
                : round((float) ($totals->recorded_tax_rate ?? 0), 2));

        $analyticsTransactionQuery = clone $aggregateQuery;
        $analyticsTransactionQuery->leftJoinSub(
            $returnAmountsByTransaction,
            'return_amounts',
            'return_amounts.transaction_id',
            '=',
            'transactions.id'
        )->leftJoinSub(
            $returnItemFinancials ?? DB::query()->selectRaw('
                NULL as transaction_id,
                0 as return_net_sales_total
            ')->whereRaw('1 = 0'),
            'return_item_financials',
            'return_item_financials.transaction_id',
            '=',
            'transactions.id'
        );
        $analyticsDetailQuery = TransactionDetail::query()
            ->leftJoinSub($returnItemsByDetail, 'returned_items', 'returned_items.transaction_detail_id', '=', 'transaction_details.id')
            ->whereIn('transaction_details.transaction_id', clone $transactionIds);

        $analytics = [
            'daily_sales' => (clone $analyticsTransactionQuery)
                ->selectRaw('
                    DATE(created_at) as date,
                    SUM(
                        grand_total
                        - COALESCE(tax_total, 0)
                        - COALESCE(shipping_cost, 0)
                        - COALESCE(return_item_financials.return_net_sales_total, 0)
                    ) as total
                ')
                ->groupByRaw('DATE(created_at)')
                ->orderByRaw('DATE(created_at)')
                ->get(),
            'payment_methods' => (clone $analyticsTransactionQuery)
                ->selectRaw("
                    COALESCE(payment_method, 'unknown') as label,
                    COUNT(*) as orders,
                    COALESCE(SUM(grand_total - COALESCE(return_amounts.return_total, 0)), 0) as total
                ")
                ->groupBy('payment_method')
                ->orderByDesc('total')
                ->get(),
            'order_types' => (clone $analyticsTransactionQuery)
                ->selectRaw("
                    COALESCE(order_type, 'in_store') as label,
                    COUNT(*) as orders,
                    COALESCE(SUM(grand_total - COALESCE(return_amounts.return_total, 0)), 0) as total
                ")
                ->groupBy('order_type')
                ->orderByDesc('orders')
                ->get(),
            'categories' => $hasTransactions
                ? (clone $analyticsDetailQuery)
                    ->leftJoin('products', 'products.id', '=', 'transaction_details.product_id')
                    ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
                    ->selectRaw("
                        COALESCE(categories.name, 'Uncategorized') as label,
                        SUM(transaction_details.price - COALESCE(returned_items.returned_amount, 0)) as total,
                        SUM(CASE
                            WHEN transaction_details.qty - COALESCE(returned_items.returned_qty, 0) > 0
                            THEN transaction_details.qty - COALESCE(returned_items.returned_qty, 0)
                            ELSE 0
                        END) as quantity
                    ")
                    ->groupBy('categories.id', 'categories.name')
                    ->orderByDesc('total')
                    ->limit(8)
                    ->get()
                : collect(),
            'top_products' => $hasTransactions
                ? (clone $analyticsDetailQuery)
                    ->leftJoin('products', 'products.id', '=', 'transaction_details.product_id')
                    ->selectRaw("
                        transaction_details.product_id as product_id,
                        products.title as label,
                        SUM(transaction_details.price - COALESCE(returned_items.returned_amount, 0)) as total,
                        SUM(CASE
                            WHEN transaction_details.qty - COALESCE(returned_items.returned_qty, 0) > 0
                            THEN transaction_details.qty - COALESCE(returned_items.returned_qty, 0)
                            ELSE 0
                        END) as quantity
                    ")
                    ->groupBy('transaction_details.product_id', 'products.title')
                    ->orderByDesc('total')
                    ->limit(8)
                    ->get()
                : collect(),
        ];

        $summary = [
            'orders_count' => (int) ($totals->orders_count ?? 0),
            'revenue_total' => $netSalesTotal,
            'gross_sales_total' => $grossSalesTotal,
            'returns_total' => $returnTotal,
            'cash_refund_total' => $refundTotal,
            'store_credit_total' => $creditTotal,
            'returned_items' => (int) $returnedItems,
            'tax_total' => $taxIsComplete ? $reportedTaxTotal : null,
            'tax_complete' => $taxIsComplete,
            'tax_rate' => $effectiveTaxRate,
            'tax_rate_source' => $taxRateSource,
            'cost_total' => $costTotal,
            'cost_complete' => $costIsComplete,
            'discount_total' => $discountTotal,
            'items_sold' => (int) $itemsSold,
            'return_financials_complete' => $returnFinancialsComplete,
            'profit_total' => $grossProfitTotal,
            'profit_margin' => $costIsComplete && $netSalesTotal > 0
                ? round(($grossProfitTotal / $netSalesTotal) * 100, 1)
                : ($costIsComplete ? 0 : null),
            'average_order' => ($totals->orders_count ?? 0) > 0
                && $netSalesTotal !== null
                ? (int) round($netSalesTotal / $totals->orders_count)
                : null,
            'net_sales_complete' => $returnFinancialsComplete,
        ];

        return Inertia::render('Dashboard/Reports/Sales', [
            'transactions' => $transactions,
            'summary' => $summary,
            'analytics' => $analytics,
            'filters' => $filters,
            'cashiers' => User::select('id', 'name')->orderBy('name')->get(),
            'customers' => Customer::select('id', 'name')->orderBy('name')->get(),
            'warehouses' => $outletAccessService->warehousesFor($request->user()),
        ]);
    }

    /**
     * Apply table filters.
     */
    protected function applyFilters($query, array $filters, $warehouseIds = null)
    {
        return $query->when($warehouseIds !== null, fn ($q) => $q->whereIn('warehouse_id', $warehouseIds))
            ->when($filters['invoice'] ?? null, fn ($q, $invoice) => $q->where('invoice', 'like', '%'.$invoice.'%'))
            ->when($filters['cashier_id'] ?? null, fn ($q, $cashier) => $q->where('cashier_id', $cashier))
            ->when($filters['customer_id'] ?? null, fn ($q, $customer) => $q->where('customer_id', $customer))
            ->when($filters['start_date'] ?? null, fn ($q, $start) => $q->whereDate('created_at', '>=', $start))
            ->when($filters['end_date'] ?? null, fn ($q, $end) => $q->whereDate('created_at', '<=', $end))
            ->when($filters['warehouse_id'] ?? null, fn ($q, $warehouse) => $q->where('warehouse_id', $warehouse));
    }

    private function invoiceDiscountAllocations(Transaction $transaction, $details): array
    {
        $invoiceDiscountTotal = (int) $transaction->discount
            + (int) $transaction->loyalty_discount_total
            + (int) $transaction->customer_voucher_discount;
        $subtotal = (int) $details->sum('price');
        $cumulativeLineTotal = 0;
        $allocatedDiscount = 0;
        $allocations = [];

        foreach ($details as $index => $detail) {
            $cumulativeLineTotal += (int) $detail->price;
            $allocatedDiscountThroughLine = $subtotal <= 0
                ? 0
                : ($index === $details->count() - 1
                    ? $invoiceDiscountTotal
                    : (int) round(
                        $invoiceDiscountTotal
                        * $cumulativeLineTotal
                        / $subtotal
                    ));
            $allocations[$detail->id] = $allocatedDiscountThroughLine - $allocatedDiscount;
            $allocatedDiscount = $allocatedDiscountThroughLine;
        }

        return $allocations;
    }

    private function allocateReturnedAmount(int $total, int $qtyReturnedBefore, int $qtyReturn, int $qtySold): int
    {
        $qtySold = max(1, $qtySold);
        $before = min($qtySold, max(0, $qtyReturnedBefore));
        $through = min($qtySold, $before + $qtyReturn);

        return (int) round($total * $through / $qtySold)
            - (int) round($total * $before / $qtySold);
    }
}