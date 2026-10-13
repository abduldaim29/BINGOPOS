# Customers & Regions

Back to the documentation index: `docs/README.md`

## Purpose

Provide richer customer master data than basic POS functionality, including Indonesian regional addresses and transaction history.

## Current Features

- Customer CRUD operations
- Create customers from the dashboard
- Create customers via AJAX from the POS
- Complete address data with Indonesian administrative regions
- Customer transaction history

## Pages and Routes

- `dashboard/customers`
- `customers.storeAjax`
- `customers.history`
- `regions.regencies`
- `regions.districts`
- `regions.villages`

## Permissions

- `customers-access`
- `customers-create`
- `customers-edit`
- `customers-delete`
- Customer history uses `transactions-access`

## User Workflow

1. The user creates or edits a customer.
2. Region options are loaded hierarchically, from province to village.
3. The customer can be selected during checkout.
4. The customer's transaction history can be accessed from the dashboard.

## Data Integration

- `customers`
- Transactions associated with customers
- Regional data from `laravolt/indonesia`

## Current Limitations

- Customers without complete information can still be used in transactions.
- Customer history focuses on transaction history rather than loyalty.

## Central Files

- `app/Http/Controllers/Apps/CustomerController.php`
- `app/Http/Controllers/RegionController.php`
- `resources/js/Pages/Dashboard/Customers`