# Payables & Suppliers

Back to the documentation index: `docs/README.md`

## Purpose

Manage supplier master data and record supplier debts along with their repayments.

## Current Features

- Supplier CRUD operations
- Payables list
- Payable details
- Supplier debt payments
- Debt status
- Payable PDF documents
- Payables generated from goods receiving against purchase orders
- Supplier returns that adjust stock and payable balances

## Pages and Routes

- `dashboard/suppliers`
- `dashboard/payables`
- `payables.show`
- `payables.pay`
- `pdf.payables.show`

## Permissions

- `suppliers-access`
- `payables-access`
- `payables-pay`

## User Workflow

1. Administrators or cashiers manage supplier data.
2. Supplier debts are recorded in the payables module.
3. Payments are recorded in installments until the debt is fully paid.
4. Users can view debt details and documents.

## Data Integration

- `suppliers`
- `payables`
- `payable_payments`
- `bank_accounts`

## Important Business Implications

- Payables are more than master data; debt status determines the visibility of operational liabilities.
- Supplier debt PDF documents are available for administrative purposes.

## Purchasing Integration

Purchase orders and goods receiving serve as sources of supplier liabilities. Goods receiving can create or update payables and carry warehouse context. Supplier returns adjust stock and the related liability balance according to the operational workflow.

## Central Files

- `app/Http/Controllers/Apps/SupplierController.php`
- `app/Http/Controllers/Apps/PayableController.php`
- `resources/js/Pages/Dashboard/Suppliers`
- `resources/js/Pages/Dashboard/Payables`