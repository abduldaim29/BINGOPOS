# POS & Transactions

Back to the documentation index: `docs/README.md`

## Table of Contents

- Purpose
- Current Features
- Pages and Routes
- Permissions
- User Workflow
- Data Integration
- Current Limitations
- Central Files

## Purpose

Provide a fast cashier workflow for product search, cart management, checkout, hold/resume, and transaction document distribution.

## Current Features

- Search for products by barcode or keyword.
- Multi-item cart.
- Update cart quantities.
- Hold transactions.
- Resume held carts.
- Clear held carts.
- Checkout with cash, split payments (maximum of two tenders), bank transfer, Midtrans, Xendit, and pay later.
- Print invoices, receipts, and shipping labels.
- Share public invoices.
- Add customers directly from the POS.

## Pages and Routes

- `dashboard/transactions`
- `dashboard/transactions/history`
- `transactions.searchProduct`
- `transactions.addToCart`
- `transactions.updateCart`
- `transactions.destroyCart`
- `transactions.hold`
- `transactions.resume`
- `transactions.clearHold`
- `transactions.held`
- `transactions.store`
- `transactions.print`
- `transactions.public`

## Permissions

- `transactions-access`

Certain transactional operations also require the `active_shift` middleware.

## User Workflow

1. The cashier opens the transactions page.
2. If a shift is active, the cashier can search for products and build a cart.
3. The cart can be held and resumed later.
4. Checkout creates the transaction, transaction details, profit records, and stock deductions.
5. If `pay_later` is selected, the system creates a receivable.
6. The user is redirected to the print document or invoice.

## Data Integration

- `transactions`
- `transaction_details`
- `profits`
- `receivables`
- `bank_accounts`
- `payment_settings`

## Current Limitations

- Split payments are unavailable offline; split-payment refunds are recorded as cash refunds in this version.
- Cart operations and checkout depend on an active shift.
- Payment gateways require valid configuration.
- Checkout remains the central point for sales-related stock changes.

## Central Files

- `routes/web.php`
- `app/Http/Controllers/Apps/TransactionController.php`
- `resources/js/Pages/Dashboard/Transactions`