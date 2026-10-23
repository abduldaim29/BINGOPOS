<?php

namespace App\Services;

use App\Models\CashierShift;
use App\Models\SalesReturn;
use App\Models\ShiftCashMovement;
use App\Models\Transaction;
use App\Models\TransactionTender;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CashierShiftService
{
    public function getActiveShiftForUser(int $userId): ?CashierShift
    {
        return CashierShift::query()
            ->with(['user:id,name', 'openedBy:id,name'])
            ->open()
            ->where('user_id', $userId)
            ->latest('opened_at')
            ->first();
    }

    public function requireActiveShiftForUser(int $userId, bool $lockForUpdate = false): CashierShift
    {
        $query = CashierShift::query()
            ->open()
            ->where('user_id', $userId)
            ->latest('opened_at');

        if ($lockForUpdate) {
            $query->lockForUpdate();
        }

        $shift = $query->first();

        if (! $shift) {
            throw ValidationException::withMessages([
                'shift' => 'The cashier shift has not been opened.',
            ]);
        }

        return $shift;
    }

    public function openShift(User $cashier, User $actor, int $openingCash, ?string $notes = null, ?int $warehouseId = null): CashierShift
    {
        $existing = CashierShift::query()
            ->open()
            ->where('user_id', $cashier->id)
            ->exists();

        if ($existing) {
            throw ValidationException::withMessages([
                'opening_cash' => 'This cashier already has an active shift.',
            ]);
        }

        return CashierShift::create([
            'user_id' => $cashier->id,
            'opened_by' => $actor->id,
            'opened_at' => now(),
            'opening_cash' => $openingCash,
            'expected_cash' => $openingCash,
            'notes' => $notes,
            'warehouse_id' => $warehouseId,
            'status' => CashierShift::STATUS_OPEN,
        ]);
    }

    public function calculateSummary(CashierShift $shift): array
    {
        $transactions = Transaction::query()
            ->where('cashier_shift_id', $shift->id);

        $transactionSummary = (clone $transactions)
            ->selectRaw('COUNT(*) as transactions_count')
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN payment_method = ? AND payment_status = ? THEN grand_total ELSE 0 END), 0) as cash_sales_total',
                ['cash', 'paid']
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN payment_method != ? THEN grand_total ELSE 0 END), 0) as non_cash_sales_total',
                ['cash']
            )
            ->first();

        $salesReturns = SalesReturn::query()
            ->where('cashier_shift_id', $shift->id)
            ->where('status', 'completed');

        // Split payments: cash tender portions must count toward the drawer,
        // while the parent row's payment_method ('split') places grand_total in the non-cash bucket.
        $splitCashTenderTotal = (int) TransactionTender::query()
            ->whereHas('transaction', fn ($q) => $q
                ->where('cashier_shift_id', $shift->id)
                ->where('payment_method', 'split')
                ->where('payment_status', 'paid'))
            ->where('method', TransactionTender::METHOD_CASH)
            ->sum('cash_received');

        // Split payments: the non-cash portion equals grand_total minus cash tenders.
        $cashSalesTotal = (int) $transactionSummary->cash_sales_total + $splitCashTenderTotal;
        $nonCashSalesTotal = (int) $transactionSummary->non_cash_sales_total - $splitCashTenderTotal;

        $returnSummary = (clone $salesReturns)
            ->selectRaw('COUNT(*) as sales_returns_count')
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN return_type = ? THEN refund_amount ELSE 0 END), 0) as cash_refund_total',
                ['refund_cash']
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN return_type != ? THEN COALESCE(credited_amount, 0) ELSE 0 END), 0) as non_cash_refund_total',
                ['refund_cash']
            )
            ->first();

        $cashMovementSummary = $shift->cashMovements()
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) as cash_in_total',
                [ShiftCashMovement::TYPE_IN]
            )
            ->selectRaw(
                'COALESCE(SUM(CASE WHEN type = ? THEN amount ELSE 0 END), 0) as cash_out_total',
                [ShiftCashMovement::TYPE_OUT]
            )
            ->first();

        $cashRefundTotal = (int) $returnSummary->cash_refund_total;
        $nonCashRefundTotal = (int) $returnSummary->non_cash_refund_total;
        $transactionsCount = (int) $transactionSummary->transactions_count;
        $salesReturnsCount = (int) $returnSummary->sales_returns_count;
        $cashInTotal = (int) $cashMovementSummary->cash_in_total;
        $cashOutTotal = (int) $cashMovementSummary->cash_out_total;

        $expectedCash = (int) $shift->opening_cash + $cashSalesTotal - $cashRefundTotal + $cashInTotal - $cashOutTotal;

        return [
            'cash_sales_total' => $cashSalesTotal,
            'non_cash_sales_total' => $nonCashSalesTotal,
            'cash_refund_total' => $cashRefundTotal,
            'non_cash_refund_total' => $nonCashRefundTotal,
            'cash_in_total' => $cashInTotal,
            'cash_out_total' => $cashOutTotal,
            'transactions_count' => $transactionsCount,
            'sales_returns_count' => $salesReturnsCount,
            'expected_cash' => $expectedCash,
        ];
    }

    public function recordCashMovement(CashierShift $shift, User $actor, string $type, int $amount, ?string $note = null): ShiftCashMovement
    {
        if (! $shift->isOpen()) {
            throw ValidationException::withMessages([
                'shift' => 'The shift is already closed. Cash movements cannot be recorded.',
            ]);
        }

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'The amount must be greater than zero.',
            ]);
        }

        if (! in_array($type, [ShiftCashMovement::TYPE_IN, ShiftCashMovement::TYPE_OUT], true)) {
            throw ValidationException::withMessages([
                'type' => 'Invalid cash movement type.',
            ]);
        }

        return ShiftCashMovement::create([
            'cashier_shift_id' => $shift->id,
            'type' => $type,
            'amount' => $amount,
            'note' => $note,
            'user_id' => $actor->id,
        ]);
    }

    public function closeShift(
        CashierShift $shift,
        User $actor,
        int $actualCash,
        ?string $closeNotes = null,
        bool $forceClose = false
    ): CashierShift {
        if (! $shift->isOpen()) {
            throw ValidationException::withMessages([
                'shift' => 'A closed shift cannot be modified.',
            ]);
        }

        return DB::transaction(function () use ($shift, $actor, $actualCash, $closeNotes, $forceClose) {
            $lockedShift = CashierShift::query()->lockForUpdate()->findOrFail($shift->id);

            if (! $lockedShift->isOpen()) {
                throw ValidationException::withMessages([
                    'shift' => 'A closed shift cannot be modified.',
                ]);
            }

            $summary = $this->calculateSummary($lockedShift);
            $cashDifference = $actualCash - $summary['expected_cash'];

            $lockedShift->update([
                'actual_cash' => $actualCash,
                'expected_cash' => $summary['expected_cash'],
                'cash_sales_total' => $summary['cash_sales_total'],
                'non_cash_sales_total' => $summary['non_cash_sales_total'],
                'cash_refund_total' => $summary['cash_refund_total'],
                'non_cash_refund_total' => $summary['non_cash_refund_total'],
                'transactions_count' => $summary['transactions_count'],
                'sales_returns_count' => $summary['sales_returns_count'],
                'cash_difference' => $cashDifference,
                'closed_at' => now(),
                'closed_by' => $actor->id,
                'close_notes' => $closeNotes,
                'status' => $forceClose
                    ? CashierShift::STATUS_FORCE_CLOSED
                    : CashierShift::STATUS_CLOSED,
            ]);

            return $lockedShift->fresh(['user:id,name', 'openedBy:id,name', 'closedBy:id,name']);
        });
    }

    public function summarizeForDisplay(?CashierShift $shift): ?array
    {
        if (! $shift) {
            return null;
        }

        $summary = $this->calculateSummary($shift);

        return [
            'id' => $shift->id,
            'status' => $shift->status,
            'opening_cash' => (int) $shift->opening_cash,
            'opened_at' => optional($shift->opened_at)?->toISOString(),
            'notes' => $shift->notes,
            'warehouse' => $shift->warehouse ? [
                'id' => $shift->warehouse->id,
                'code' => $shift->warehouse->code,
                'name' => $shift->warehouse->name,
            ] : null,
            'user' => $shift->user ? [
                'id' => $shift->user->id,
                'name' => $shift->user->name,
            ] : null,
            ...$summary,
        ];
    }

    public function visibleToUser(Builder $query, User $user): Builder
    {
        if ($user->isSuperAdmin() || $user->can('cashier-shifts-force-close')) {
            return $query;
        }

        return $query->where('user_id', $user->id);
    }
}
