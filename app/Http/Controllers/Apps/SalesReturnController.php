<?php

namespace App\Http\Controllers\Apps;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSalesReturnRequest;
use App\Http\Requests\UpdateSalesReturnRequest;
use App\Models\CustomerCredit;
use App\Models\ProductWarehouse;
use App\Models\Profit;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Transaction;
use App\Models\TransactionDetail;
use App\Models\Outlet;
use App\Models\Warehouse;
use App\Services\AuditLogService;
use App\Services\CashierShiftService;
use App\Services\OutletAccessService;
use App\Services\StockMutationService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SalesReturnController extends Controller
{
    public function __construct(
        private readonly StockMutationService $stockMutationService,
        private readonly CashierShiftService $cashierShiftService,
        private readonly AuditLogService $auditLogService,
        private readonly OutletAccessService $outletAccessService
    ) {}

    public function index(Request $request): Response
    {
        $this->ensureSalesReturnTablesExist();

        $validatedFilters = $request->validate([
            'code' => ['nullable', 'string', 'max:100'],
            'invoice' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'return_type' => ['nullable', 'in:refund_cash,store_credit'],
            'status' => ['nullable', 'in:draft,completed'],
        ]);
        $filters = [
            'code' => $validatedFilters['code'] ?? '',
            'invoice' => $validatedFilters['invoice'] ?? '',
            'date_from' => $validatedFilters['date_from'] ?? '',
            'date_to' => $validatedFilters['date_to'] ?? '',
            'return_type' => $validatedFilters['return_type'] ?? '',
            'status' => $validatedFilters['status'] ?? '',
        ];
        $warehouseIds = $this->outletAccessService->warehousesFor($request->user())->pluck('id');
        $activeOutlet = $this->outletAccessService->activeOutlet($request);
        if ($activeOutlet) {
            $warehouseIds = $this->outletAccessService->warehousesFor($request->user())
                ->where('outlet_id', $activeOutlet->id)
                ->pluck('id');
        }

        $returnsQuery = SalesReturn::query()
            ->with([
                'transaction:id,invoice,grand_total,created_at',
                'customer:id,name',
                'cashier:id,name',
                'items:id,sales_return_id,qty_return',
            ])
            ->where(function (Builder $query) use ($warehouseIds) {
                $query->whereIn('warehouse_id', $warehouseIds);
                if (Outlet::active()->count() <= 1) {
                    $query->orWhereNull('warehouse_id');
                }
            })
            ->when(
                ! $request->user()->isSuperAdmin(),
                fn (Builder $query) => $query->where('cashier_id', $request->user()->id)
            )
            ->when($filters['code'], fn (Builder $query, $code) => $query->where('code', 'like', '%'.$code.'%'))
            ->when($filters['invoice'], fn (Builder $query, $invoice) => $query->whereHas(
                'transaction',
                fn (Builder $transactionQuery) => $transactionQuery->where('invoice', 'like', '%'.$invoice.'%')
            ))
            ->when($filters['date_from'], fn (Builder $query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($filters['date_to'], fn (Builder $query, $date) => $query->whereDate('created_at', '<=', $date))
            ->when($filters['return_type'], fn (Builder $query, $type) => $query->where('return_type', $type))
            ->when($filters['status'], fn (Builder $query, $status) => $query->where('status', $status))
            ->latest('created_at');

        $salesReturns = $returnsQuery->paginate(10)->withQueryString();
        $summary = (clone $returnsQuery)
            ->reorder()
            ->selectRaw('
                COUNT(*) as returns_count,
                COALESCE(SUM(total_return_amount), 0) as returned_total,
                COALESCE(SUM(refund_amount), 0) as refunded_total,
                COALESCE(SUM(credited_amount), 0) as credited_total
            ')
            ->first();

        return Inertia::render('Dashboard/SalesReturns/Index', [
            'salesReturns' => $salesReturns,
            'filters' => $filters,
            'summary' => [
                'returns_count' => (int) ($summary->returns_count ?? 0),
                'returned_total' => (int) ($summary->returned_total ?? 0),
                'refunded_total' => (int) ($summary->refunded_total ?? 0),
                'credited_total' => (int) ($summary->credited_total ?? 0),
            ],
            'canCreateSalesReturn' => $request->user()->can('sales-returns-create'),
        ]);
    }

    public function printDailySales(Request $request): Response
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
        ]);
        $date = Carbon::parse($validated['date'])->toDateString();
        $filters = ['date_from' => $date, 'date_to' => $date, 'invoice' => ''];
        $salesQuery = $this->dailySalesQuery($request, $filters);
        $summary = (clone $salesQuery)
            ->reorder()
            ->selectRaw('COUNT(*) as orders_count, COALESCE(SUM(grand_total), 0) as revenue_total')
            ->first();

        $sales = (clone $salesQuery)
            ->with(['details.product', 'details.unit', 'warehouse.outlet'])
            ->withSum('details as items_sold', 'qty')
            ->reorder()
            ->orderBy('created_at')
            ->get();

        return Inertia::render('Dashboard/SalesReturns/DailySalesPrint', [
            'sales' => $sales,
            'date' => $date,
            'autoPrint' => $request->boolean('auto_print'),
            'summary' => [
                'orders_count' => (int) ($summary->orders_count ?? 0),
                'revenue_total' => (int) ($summary->revenue_total ?? 0),
                'items_sold' => (int) $sales->sum('items_sold'),
                'item_subtotal' => (int) $sales->sum(fn (Transaction $sale) => $sale->details->sum(fn ($detail) => (int) $detail->price + (int) $detail->discount_total)),
                'promotion_discount_total' => (int) $sales->sum(fn (Transaction $sale) => $sale->details->sum('discount_total')),
                'discount_total' => (int) $sales->sum(fn (Transaction $sale) => (int) $sale->discount + (int) $sale->loyalty_discount_total + (int) $sale->customer_voucher_discount),
                'tax_total' => (int) $sales->sum('tax_total'),
                'shipping_total' => (int) $sales->sum('shipping_cost'),
            ],
        ]);
    }

    private function dailySalesQuery(Request $request, array $salesFilters): Builder
    {
        $warehouseIds = $this->outletAccessService->warehousesFor($request->user())->pluck('id');
        $activeOutlet = $this->outletAccessService->activeOutlet($request);
        if ($activeOutlet) {
            $warehouseIds = $this->outletAccessService->warehousesFor($request->user())
                ->where('outlet_id', $activeOutlet->id)
                ->pluck('id');
        }

        return Transaction::query()
            ->with([
                'customer:id,name',
                'cashier:id,name',
                'warehouse:id,code,name,outlet_id',
            ])
            ->where(function (Builder $query) use ($warehouseIds) {
                $query->whereIn('warehouse_id', $warehouseIds);
                if (Outlet::active()->count() <= 1) {
                    $query->orWhereNull('warehouse_id');
                }
            })
            ->when(! $request->user()->isSuperAdmin(), fn (Builder $query) => $query->where('cashier_id', $request->user()->id))
            ->when($salesFilters['date_from'] ?? null, fn (Builder $query, $date) => $query->whereDate('created_at', '>=', $date))
            ->when($salesFilters['date_to'] ?? null, fn (Builder $query, $date) => $query->whereDate('created_at', '<=', $date))
            ->when($salesFilters['invoice'] ?? null, fn (Builder $query, $invoice) => $query->where('invoice', 'like', '%'.$invoice.'%'))
            ->orderByDesc('created_at');
    }

    public function create(Request $request, Transaction $transaction): Response|RedirectResponse
    {
        $this->ensureSalesReturnTablesExist();

        $transaction = $this->resolveAccessibleTransaction($request, $transaction->id);

        if (! $this->transactionHasReturnableItems($transaction)) {
            return to_route('transactions.history')->with('error', 'All items in this transaction have already been returned.');
        }

        return Inertia::render('Dashboard/SalesReturns/Create', [
            'transaction' => $this->transformTransactionForEditor($transaction),
        ]);
    }

    public function store(StoreSalesReturnRequest $request, Transaction $transaction): RedirectResponse
    {
        $this->ensureSalesReturnTablesExist();

        $transaction = $this->resolveAccessibleTransaction($request, $transaction->id);
        $payload = $this->prepareDraftPayload($transaction, $request->validated());

        $salesReturn = DB::transaction(function () use ($request, $transaction, $payload) {
            $salesReturn = SalesReturn::create([
                'code' => $this->generateCode(),
                'transaction_id' => $transaction->id,
                'customer_id' => $transaction->customer_id,
                'cashier_id' => $request->user()?->id,
                'status' => 'draft',
                'return_type' => $payload['return_type'],
                'refund_amount' => $payload['refund_amount'],
                'credited_amount' => $payload['credited_amount'],
                'total_return_amount' => $payload['total_return_amount'],
                'notes' => $payload['notes'],
            ]);

            $salesReturn->items()->createMany($payload['items']);

            return $salesReturn;
        });

        $salesReturn->load('items.product');
        $this->auditLogService->log(
            event: 'sales_return.created',
            module: 'sales_returns',
            auditable: $salesReturn,
            description: 'Sales return draft created.',
            after: $this->salesReturnAuditPayload($salesReturn),
        );

        return to_route('sales-returns.show', $salesReturn)->with('success', 'Sales return draft created successfully.');
    }

    public function show(Request $request, SalesReturn $salesReturn): Response
    {
        $this->ensureSalesReturnTablesExist();

        $salesReturn = $this->resolveAccessibleSalesReturn($request, $salesReturn->id);

        return Inertia::render('Dashboard/SalesReturns/Show', [
            'salesReturn' => $this->transformSalesReturn($salesReturn),
            'transaction' => $this->transformTransactionForEditor($salesReturn->transaction, $salesReturn),
        ]);
    }

    public function printInvoice(Request $request, SalesReturn $salesReturn): Response
    {
        $this->ensureSalesReturnTablesExist();
        $salesReturn = $this->resolveAccessibleSalesReturn($request, $salesReturn->id);

        return Inertia::render('Dashboard/SalesReturns/Print', [
            'salesReturn' => $this->transformSalesReturn($salesReturn),
            'transaction' => [
                'invoice' => $salesReturn->transaction?->invoice,
                'created_at' => optional($salesReturn->transaction?->created_at)?->toISOString(),
                'payment_method' => $salesReturn->transaction?->payment_method,
                'cashier' => $salesReturn->transaction?->cashier?->only(['id', 'name']),
            ],
        ]);
    }

    public function update(UpdateSalesReturnRequest $request, SalesReturn $salesReturn): RedirectResponse
    {
        $this->ensureSalesReturnTablesExist();

        $salesReturn = $this->resolveAccessibleSalesReturn($request, $salesReturn->id);
        $this->ensureDraft($salesReturn);
        $before = $this->salesReturnAuditPayload($salesReturn);

        $payload = $this->prepareDraftPayload($salesReturn->transaction, $request->validated(), $salesReturn->id);

        DB::transaction(function () use ($salesReturn, $payload) {
            $salesReturn->update([
                'return_type' => $payload['return_type'],
                'refund_amount' => $payload['refund_amount'],
                'credited_amount' => $payload['credited_amount'],
                'total_return_amount' => $payload['total_return_amount'],
                'notes' => $payload['notes'],
            ]);

            $salesReturn->items()->delete();
            $salesReturn->items()->createMany($payload['items']);
        });

        $salesReturn->refresh();
        $salesReturn->load('items.product');
        $this->auditLogService->log(
            event: 'sales_return.updated',
            module: 'sales_returns',
            auditable: $salesReturn,
            description: 'Sales return draft updated.',
            before: $before,
            after: $this->salesReturnAuditPayload($salesReturn),
        );

        return back()->with('success', 'Sales return draft updated successfully.');
    }

    public function complete(Request $request, SalesReturn $salesReturn): RedirectResponse
    {
        $this->ensureSalesReturnTablesExist();

        $salesReturn = $this->resolveAccessibleSalesReturn($request, $salesReturn->id);
        $this->ensureDraft($salesReturn);
        $before = $this->salesReturnAuditPayload($salesReturn);

        DB::transaction(function () use ($request, $salesReturn) {
            $activeShift = $this->cashierShiftService->requireActiveShiftForUser(
                $request->user()->id,
                lockForUpdate: true
            );

            $salesReturn->load([
                'transaction.receivable',
                'items.product',
                'items.transactionDetail',
            ]);

            if ($salesReturn->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'sales_return' => 'The return draft does not contain any items.',
                ]);
            }

            $returnedQtyMap = $this->getCompletedReturnedQtyMap(
                $salesReturn->transaction_id,
                excludeSalesReturnId: $salesReturn->id,
            );

            foreach ($salesReturn->items as $item) {
                $detail = $item->transactionDetail;

                if (! $detail || $item->qty_return < 1) {
                    throw ValidationException::withMessages([
                        'sales_return' => 'Each return item must have a quantity of at least 1.',
                    ]);
                }

                $returnedBefore = (int) ($returnedQtyMap[$detail->id] ?? 0);
                $remainingQty = (int) $detail->qty - $returnedBefore;

                if ($item->qty_return > $remainingQty) {
                    throw ValidationException::withMessages([
                        'sales_return' => 'A return item exceeds the remaining quantity available for return.',
                    ]);
                }
            }

            foreach ($salesReturn->items as $item) {
                $isRecipeSale = $item->transactionDetail?->recipeConsumptions()->exists() ?? false;
                // Prepared recipe ingredients remain consumed when the finished item is returned.
                if ($item->restock_to_inventory && $item->product && ! $isRecipeSale) {
                    $product = $item->product()->lockForUpdate()->first();

                    if ($product) {
                        $stockBefore = (int) $product->stock;
                        $stockAfter = $stockBefore + (int) $item->qty_return;

                        $product->update([
                            'stock' => $stockAfter,
                        ]);

                        // Restock to transaction warehouse
                        $transactionWarehouseId = $salesReturn->transaction->warehouse_id;
                        if ($transactionWarehouseId) {
                            ProductWarehouse::where([
                                'product_id' => $product->id,
                                'warehouse_id' => $transactionWarehouseId,
                            ])->increment('stock', (int) $item->qty_return);
                        }

                        $this->stockMutationService->recordSalesReturnRestock(
                            product: $product,
                            salesReturn: $salesReturn,
                            stockBefore: $stockBefore,
                            stockAfter: $stockAfter,
                            reason: $item->return_reason,
                            userId: $request->user()?->id,
                        );
                    }
                }

                $detail = $item->transactionDetail;
                $detailCost = $detail->cost_total !== null
                    ? $this->allocateReturnedAmount(
                        (int) $detail->cost_total,
                        (int) $item->qty_returned_before,
                        (int) $item->qty_return,
                        (int) $detail->qty
                    )
                    : null;
                $returnedCost = $item->cost_total
                    ?? $detailCost;
                if ($item->net_sales_total !== null && (! $item->restock_to_inventory || $returnedCost !== null)) {
                    $profitAdjustment = $item->restock_to_inventory
                        ? $returnedCost - (int) $item->net_sales_total
                        : -(int) $item->net_sales_total;

                    Profit::create([
                        'transaction_id' => $salesReturn->transaction_id,
                        'total' => $profitAdjustment,
                    ]);
                }
            }

            $salesReturn->loadMissing('transaction.receivable');
            $settlement = $this->calculateSettlement(
                $salesReturn->transaction,
                (int) $salesReturn->total_return_amount,
                $salesReturn->return_type
            );

            $salesReturn->update([
                'cashier_shift_id' => $activeShift->id,
                'warehouse_id' => $salesReturn->transaction->warehouse_id,
                'return_type' => $settlement['return_type'],
                'refund_amount' => $settlement['refund_amount'],
                'credited_amount' => $settlement['credited_amount'],
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            if ($salesReturn->transaction->payment_method === 'pay_later' && $salesReturn->transaction->receivable) {
                $receivable = $salesReturn->transaction->receivable()->lockForUpdate()->first();

                if ($receivable) {
                    $receivable->update([
                        'total' => $settlement['receivable_total_after'],
                        'status' => $this->determineReceivableStatus(
                            total: $settlement['receivable_total_after'],
                            paid: (int) $receivable->paid,
                            dueDate: $receivable->due_date,
                        ),
                    ]);
                }
            }

            if (
                $salesReturn->return_type === 'store_credit'
                && $salesReturn->customer_id
                && $salesReturn->credited_amount > 0
            ) {
                CustomerCredit::create([
                    'customer_id' => $salesReturn->customer_id,
                    'sales_return_id' => $salesReturn->id,
                    'amount' => $salesReturn->credited_amount,
                    'balance' => $salesReturn->credited_amount,
                    'notes' => 'Store credit from sales return '.$salesReturn->code,
                ]);
            }
        });

        $salesReturn->refresh();
        $salesReturn->load('items.product');
        $this->auditLogService->log(
            event: 'sales_return.completed',
            module: 'sales_returns',
            auditable: $salesReturn,
            description: 'Sales return completed.',
            before: $before,
            after: $this->salesReturnAuditPayload($salesReturn),
        );

        return back()->with('success', 'Sales return completed successfully.');
    }

    private function salesReturnAuditPayload(SalesReturn $salesReturn): array
    {
        return [
            'code' => $salesReturn->code,
            'status' => $salesReturn->status,
            'return_type' => $salesReturn->return_type,
            'refund_amount' => (int) $salesReturn->refund_amount,
            'credited_amount' => (int) $salesReturn->credited_amount,
            'total_return_amount' => (int) $salesReturn->total_return_amount,
            'transaction_id' => (int) $salesReturn->transaction_id,
            'items_summary' => $salesReturn->items->map(fn (SalesReturnItem $item) => [
                'product_id' => $item->product_id,
                'product_title' => $item->product?->title,
                'qty_return' => (int) $item->qty_return,
                'subtotal_return' => (int) $item->subtotal_return,
                'restock_to_inventory' => (bool) $item->restock_to_inventory,
            ])->values()->all(),
        ];
    }

    private function resolveAccessibleTransaction(Request $request, int $transactionId): Transaction
    {
        $transaction = Transaction::query()
            ->with([
                'cashier:id,name',
                'customer:id,name',
                'receivable',
                'details.product:id,title,barcode,sku,buy_price',
                'details.salesReturnItems.salesReturn:id,status',
            ])
            ->when(! $request->user()->isSuperAdmin(), fn (Builder $query) => $query->where('cashier_id', $request->user()->id))
            ->findOrFail($transactionId);

        $warehouse = $transaction->warehouse_id
            ? Warehouse::find($transaction->warehouse_id)
            : null;
        abort_unless($this->outletAccessService->canUseWarehouse($request->user(), $warehouse), 404);

        return $transaction;
    }

    private function resolveAccessibleSalesReturn(Request $request, int $salesReturnId): SalesReturn
    {
        $salesReturn = SalesReturn::query()
            ->with([
                'customer:id,name',
                'cashier:id,name',
                'transaction.cashier:id,name',
                'transaction.customer:id,name',
                'transaction.receivable',
                'transaction.details.product:id,title,barcode,sku,buy_price',
                'transaction.details.salesReturnItems.salesReturn:id,status',
                'items.product:id,title,barcode,sku,buy_price',
                'items.transactionDetail:id,transaction_id,product_id,qty,price',
            ])
            ->when(! $request->user()->isSuperAdmin(), function (Builder $query) use ($request) {
                $query->whereHas('transaction', fn (Builder $builder) => $builder->where('cashier_id', $request->user()->id));
            })
            ->findOrFail($salesReturnId);

        $warehouse = $salesReturn->transaction?->warehouse_id
            ? Warehouse::find($salesReturn->transaction->warehouse_id)
            : null;
        abort_unless($this->outletAccessService->canUseWarehouse($request->user(), $warehouse), 404);

        return $salesReturn;
    }

    private function transformTransactionForEditor(Transaction $transaction, ?SalesReturn $salesReturn = null): array
    {
        $draftItems = collect($salesReturn?->items ?? [])
            ->keyBy('transaction_detail_id');

        return [
            'id' => $transaction->id,
            'invoice' => $transaction->invoice,
            'created_at' => $transaction->getRawOriginal('created_at')
                ? Carbon::parse($transaction->getRawOriginal('created_at'))->toISOString()
                : null,
            'cashier' => $transaction->cashier ? [
                'id' => $transaction->cashier->id,
                'name' => $transaction->cashier->name,
            ] : null,
            'customer' => $transaction->customer ? [
                'id' => $transaction->customer->id,
                'name' => $transaction->customer->name,
            ] : null,
            'grand_total' => (int) $transaction->grand_total,
            'payment_method' => $transaction->payment_method,
            'payment_status' => $transaction->payment_status,
            'receivable' => $transaction->receivable ? [
                'id' => $transaction->receivable->id,
                'total' => (int) $transaction->receivable->total,
                'paid' => (int) $transaction->receivable->paid,
                'status' => $transaction->receivable->status,
                'remaining' => (int) $transaction->receivable->remaining,
            ] : null,
            'details' => $transaction->details->map(function (TransactionDetail $detail) use ($draftItems) {
                $completedReturnedQty = (int) $detail->salesReturnItems
                    ->filter(fn (SalesReturnItem $item) => $item->salesReturn?->status === 'completed')
                    ->sum('qty_return');

                $draftItem = $draftItems->get($detail->id);
                $qtySold = (int) $detail->qty;

                return [
                    'id' => $detail->id,
                    'product_id' => $detail->product_id,
                    'product' => $detail->product ? [
                        'id' => $detail->product->id,
                        'title' => $detail->product->title,
                        'barcode' => $detail->product->barcode,
                        'sku' => $detail->product->sku,
                    ] : null,
                    'qty' => $qtySold,
                    'price' => (int) $detail->price,
                    'returned_completed_qty' => $completedReturnedQty,
                    'remaining_returnable_qty' => max(0, $qtySold - $completedReturnedQty),
                    'draft_item' => $draftItem ? [
                        'qty_return' => (int) $draftItem->qty_return,
                        'return_reason' => $draftItem->return_reason,
                        'restock_to_inventory' => (bool) $draftItem->restock_to_inventory,
                        'subtotal' => (int) $draftItem->subtotal,
                    ] : null,
                ];
            })->values(),
        ];
    }

    private function transformSalesReturn(SalesReturn $salesReturn): array
    {
        return [
            'id' => $salesReturn->id,
            'code' => $salesReturn->code,
            'status' => $salesReturn->status,
            'return_type' => $salesReturn->return_type,
            'refund_amount' => (int) $salesReturn->refund_amount,
            'credited_amount' => (int) $salesReturn->credited_amount,
            'total_return_amount' => (int) $salesReturn->total_return_amount,
            'notes' => $salesReturn->notes,
            'created_at' => optional($salesReturn->created_at)?->toISOString(),
            'completed_at' => optional($salesReturn->completed_at)?->toISOString(),
            'cashier' => $salesReturn->cashier ? [
                'id' => $salesReturn->cashier->id,
                'name' => $salesReturn->cashier->name,
            ] : null,
            'customer' => $salesReturn->customer ? [
                'id' => $salesReturn->customer->id,
                'name' => $salesReturn->customer->name,
            ] : null,
            'transaction' => [
                'id' => $salesReturn->transaction?->id,
                'invoice' => $salesReturn->transaction?->invoice,
            ],
            'items' => $salesReturn->items->map(function (SalesReturnItem $item) {
                return [
                    'id' => $item->id,
                    'transaction_detail_id' => $item->transaction_detail_id,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'title' => $item->product->title,
                        'barcode' => $item->product->barcode,
                        'sku' => $item->product->sku,
                    ] : null,
                    'qty_sold' => (int) $item->qty_sold,
                    'qty_returned_before' => (int) $item->qty_returned_before,
                    'qty_return' => (int) $item->qty_return,
                    'unit_price' => (int) $item->unit_price,
                    'subtotal' => (int) $item->subtotal,
                    'return_reason' => $item->return_reason,
                    'restock_to_inventory' => (bool) $item->restock_to_inventory,
                ];
            })->values(),
        ];
    }

    private function transactionHasReturnableItems(Transaction $transaction): bool
    {
        return $transaction->details->contains(function (TransactionDetail $detail) {
            $completedReturnedQty = (int) $detail->salesReturnItems
                ->filter(fn (SalesReturnItem $item) => $item->salesReturn?->status === 'completed')
                ->sum('qty_return');

            return $completedReturnedQty < (int) $detail->qty;
        });
    }

    private function prepareDraftPayload(Transaction $transaction, array $validated, ?int $excludeSalesReturnId = null): array
    {
        $orderedDetails = $transaction->details->sortBy('id')->values();
        $details = $orderedDetails->keyBy('id');
        $returnedQtyMap = $this->getCompletedReturnedQtyMap($transaction->id, $excludeSalesReturnId);
        $invoiceDiscounts = $this->invoiceDiscountAllocations($transaction, $orderedDetails);
        $hasTaxSnapshots = Schema::hasColumn('transaction_details', 'tax_total')
            && Schema::hasColumn('transaction_details', 'tax_type');

        $returnType = $validated['return_type'];

        if (! $transaction->customer_id) {
            $returnType = 'refund_cash';
        }

        $items = collect($validated['items'])
            ->map(function (array $item) use ($details, $returnedQtyMap, $invoiceDiscounts, $hasTaxSnapshots) {
                $detail = $details->get((int) $item['transaction_detail_id']);

                if (! $detail) {
                    throw ValidationException::withMessages([
                        'items' => 'A return item does not match the original transaction.',
                    ]);
                }

                $qtyReturn = (int) ($item['qty_return'] ?? 0);

                if ($qtyReturn < 1) {
                    return null;
                }

                $qtyReturnedBefore = (int) ($returnedQtyMap[$detail->id] ?? 0);
                $remainingQty = (int) $detail->qty - $qtyReturnedBefore;
                $subtotal = $this->allocateReturnedAmount(
                    (int) $detail->price,
                    $qtyReturnedBefore,
                    $qtyReturn,
                    (int) $detail->qty
                );
                $invoiceDiscountForReturn = $this->allocateReturnedAmount(
                    (int) ($invoiceDiscounts[$detail->id] ?? 0),
                    $qtyReturnedBefore,
                    $qtyReturn,
                    (int) $detail->qty
                );

                if ($qtyReturn > $remainingQty) {
                    throw ValidationException::withMessages([
                        'items' => 'The return quantity exceeds the remaining quantity available for return.',
                    ]);
                }

                if (blank($item['return_reason'] ?? null)) {
                    throw ValidationException::withMessages([
                        'items' => 'A return reason is required for every returned item.',
                    ]);
                }

                $returnItem = [
                    'transaction_detail_id' => $detail->id,
                    'product_id' => $detail->product_id,
                    'qty_sold' => (int) $detail->qty,
                    'qty_returned_before' => $qtyReturnedBefore,
                    'qty_return' => $qtyReturn,
                    'unit_price' => (int) round((int) $detail->price / max(1, (int) $detail->qty)),
                    'subtotal' => $subtotal,
                    'return_reason' => trim($item['return_reason']),
                    'restock_to_inventory' => (bool) ($item['restock_to_inventory'] ?? true),
                ];
                if (Schema::hasColumn('sales_return_items', 'cost_total')) {
                    $returnItem['cost_total'] = $detail->cost_total === null
                        ? null
                        : $this->allocateReturnedAmount(
                            (int) $detail->cost_total,
                            $qtyReturnedBefore,
                            $qtyReturn,
                            (int) $detail->qty
                        );
                }
                if (
                    Schema::hasColumn('sales_return_items', 'net_sales_total')
                    && Schema::hasColumn('sales_return_items', 'tax_refund_total')
                    && $hasTaxSnapshots
                    && $detail->tax_total !== null
                    && $detail->tax_type !== null
                ) {
                    $embeddedTax = $detail->tax_type === 'inclusive'
                        ? (int) $detail->tax_total
                        : 0;
                    $taxRefundTotal = $detail->tax_type === 'inclusive'
                        ? $this->allocateReturnedAmount(
                            (int) $detail->tax_total,
                            $qtyReturnedBefore,
                            $qtyReturn,
                            (int) $detail->qty
                        )
                        : 0;
                    $returnItem['net_sales_total'] = max(
                        0,
                        $subtotal - $taxRefundTotal - $invoiceDiscountForReturn
                    );
                    $returnItem['tax_refund_total'] = $taxRefundTotal;
                }

                return $returnItem;
            })
            ->filter()
            ->values();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'Select at least one return item with a quantity greater than 0.',
            ]);
        }

        $totalReturnAmount = (int) $items->sum('subtotal');
        $settlement = $this->calculateSettlement($transaction, $totalReturnAmount, $returnType);

        return [
            'return_type' => $settlement['return_type'],
            'notes' => $validated['notes'] ?? null,
            'refund_amount' => $settlement['refund_amount'],
            'credited_amount' => $settlement['credited_amount'],
            'total_return_amount' => $totalReturnAmount,
            'items' => $items->all(),
        ];
    }

    private function invoiceDiscountAllocations(Transaction $transaction, Collection $details): array
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
            $allocatedDiscountThroughLine = $index === $details->count() - 1
                ? $invoiceDiscountTotal
                : (int) round(
                    $invoiceDiscountTotal
                    * $cumulativeLineTotal
                    / max(1, $subtotal)
                );
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

    private function calculateSettlement(Transaction $transaction, int $totalReturnAmount, string $returnType): array
    {
        $resolvedReturnType = ! $transaction->customer_id && $returnType === 'store_credit'
            ? 'refund_cash'
            : $returnType;

        $refundAmount = 0;
        $creditedAmount = 0;
        $receivableTotalAfter = null;

        if ($transaction->payment_method === 'pay_later' && $transaction->receivable) {
            $currentTotal = (int) $transaction->receivable->total;
            $paid = (int) $transaction->receivable->paid;
            $receivableTotalAfter = max(0, $currentTotal - $totalReturnAmount);
            $settlementAmount = max(0, $paid - $receivableTotalAfter);

            if ($resolvedReturnType === 'store_credit') {
                $creditedAmount = $settlementAmount;
            } elseif ($resolvedReturnType === 'refund_cash') {
                $refundAmount = $settlementAmount;
            }
        } elseif ($transaction->payment_status === 'paid') {
            if ($resolvedReturnType === 'store_credit') {
                $creditedAmount = $totalReturnAmount;
            } elseif ($resolvedReturnType === 'refund_cash') {
                $refundAmount = $totalReturnAmount;
            }
        }

        return [
            'return_type' => $resolvedReturnType,
            'refund_amount' => $refundAmount,
            'credited_amount' => $creditedAmount,
            'receivable_total_after' => $receivableTotalAfter,
        ];
    }

    private function determineReceivableStatus(int $total, int $paid, $dueDate): string
    {
        if ($paid >= $total) {
            return 'paid';
        }

        if ($paid > 0) {
            return 'partial';
        }

        if ($dueDate && now()->startOfDay()->gt($dueDate->copy()->startOfDay())) {
            return 'overdue';
        }

        return 'unpaid';
    }

    private function getCompletedReturnedQtyMap(int $transactionId, ?int $excludeSalesReturnId = null): Collection
    {
        return SalesReturnItem::query()
            ->selectRaw('transaction_detail_id, COALESCE(SUM(qty_return), 0) as total_qty')
            ->whereHas('salesReturn', function (Builder $query) use ($transactionId, $excludeSalesReturnId) {
                $query->where('transaction_id', $transactionId)
                    ->where('status', 'completed');

                if ($excludeSalesReturnId) {
                    $query->where('id', '!=', $excludeSalesReturnId);
                }
            })
            ->groupBy('transaction_detail_id')
            ->pluck('total_qty', 'transaction_detail_id');
    }

    private function ensureDraft(SalesReturn $salesReturn): void
    {
        if (! $salesReturn->isDraft()) {
            throw ValidationException::withMessages([
                'sales_return' => 'A completed sales return can no longer be modified.',
            ]);
        }
    }

    private function ensureSalesReturnTablesExist(): void
    {
        if (! Schema::hasTable('sales_returns') || ! Schema::hasTable('sales_return_items')) {
            abort(503, 'The sales return feature is not ready. Run the database migrations first.');
        }
    }

    private function generateCode(): string
    {
        do {
            $code = 'SR-'.now()->format('YmdHis').'-'.Str::upper(Str::random(4));
        } while (SalesReturn::where('code', $code)->exists());

        return $code;
    }
}