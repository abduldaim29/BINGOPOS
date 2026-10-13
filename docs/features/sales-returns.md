# Sales Returns

Back to the documentation index: `docs/README.md`

## Purpose

Corrects completed sales transactions through partial or full returns while keeping inventory, profit, and receivables synchronized.

## Current Features

- Create draft sales returns from transaction history.
- Update draft returns.
- Complete returns.
- Cash refunds.
- Store credit.
- Restock returned items into inventory.
- Adjust receivables for `pay_later` transactions.
- Sales return history.

## Pages and Routes

- `dashboard/transactions/history`
- `dashboard/sales-returns`
- `sales-returns.create`
- `sales-returns.store`
- `sales-returns.show`
- `sales-returns.update`
- `sales-returns.complete`

## Permissions

- `sales-returns-access`
- `sales-returns-create`
- `sales-returns-complete`

## User Workflow

1. The user opens transaction history.
2. If a transaction has a returnable quantity remaining, the return button is displayed.
3. The user creates a draft return from the original transaction.
4. The user selects the return quantities, reasons, and restocking options.
5. The user saves the draft.
6. The user completes the return.
7. The system updates inventory, profit, and receivables where applicable.

## Data Integration

- `sales_returns`
- `sales_return_items`
- `customer_credits`
- `transactions`
- `transaction_details`
- `profits`
- `receivables`
- `stock_mutations`

## Important Business Effects

- Completed returns can add returned items back into stock.
- Returns associated with receivable transactions can reduce the total receivable balance.
- Receivable overpayments can be converted into refunds or customer credit.

## Current Limitations

- This feature depends on the return-table migrations.
- Item exchange workflows are not included.
- Shipping costs are excluded from the return amount.

## Central Files

- `app/Http/Controllers/Apps/SalesReturnController.php`
- `resources/js/Pages/Dashboard/SalesReturns`