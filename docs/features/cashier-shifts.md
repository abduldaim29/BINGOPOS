# Cashier Shifts

Back to documentation index: `docs/README.md`

## Purpose

Control cashier work sessions so that cashier transactions have a clear shift context, including opening cash, closing cash, and operational summaries.

## Current Features

- Open shift
- List shifts
- Shift details
- Close shift
- Force close for authorized users
- Summary of expected cash, actual cash, discrepancies, transactions, and sales returns

## Pages and Routes

- `dashboard/cashier-shifts`
- `cashier-shifts.store`
- `cashier-shifts.show`
- `cashier-shifts.close`

## Permission

- `cashier-shifts-access`
- `cashier-shifts-open`
- `cashier-shifts-close`
- `cashier-shifts-force-close`

## User Flow

1. The cashier opens a shift with opening cash
2. Certain transaction routes require an active shift
3. During the active shift, transactions and sales returns are recorded within the shift context
4. When closing, the cashier fills in the actual cash
5. The system calculates the difference and generates a shift summary

## Data Integration

- `cashier_shifts`
- cash / non-cash transactions
- sales returns
- middleware `active_shift`

## Important Business Implications

- Without an active shift, core transaction operations are blocked
- Close shift is used for operational cash reconciliation

## Current Limitations

- Shift is not intended as an approval workflow
- Force close is limited to specific users

## Central Files

- `app/Http/Controllers/Apps/CashierShiftController.php`
- `app/Services/CashierShiftService.php`
- `app/Http/Middleware/EnsureActiveCashierShift.php`
