# Inventory & Stock

Back to the documentation index: `docs/README.md`

## Purpose

Maintain stock accuracy through product master data, stock opname, and stock movement history.

## Current Features

- Product CRUD operations
- Initial stock when creating a product
- Stock cannot be changed directly when editing a product
- Stock opname workflow: draft → finalized
- Stock mutation list
- Low-stock notifications
- Multi-warehouse stock management through `product_warehouse`
- Batch/expiry tracking and FEFO allocation
- Composite products/kits
- Reorder points and purchase order recommendations

## Pages and Routes

- `dashboard/products`
- `dashboard/stock-opnames`
- `dashboard/stock-mutations`

## Permissions

- `products-access`, `products-create`, `products-edit`, `products-delete`
- `stock-opnames-access`, `stock-opnames-create`, `stock-opnames-finalize`
- `stock-mutations-access`

## User Workflow

1. A product is created with initial stock.
2. Initial stock generates an initial stock mutation.
3. A stock opname is created as a draft.
4. Products are added to the stock opname session.
5. Physical stock quantities are entered for each item.
6. Finalization updates product stock and creates a stock adjustment mutation.

## Data Integration

- `products`
- `stock_opnames`
- `stock_opname_items`
- `stock_mutations`
- `product_notification_reads`

## Important Business Implications

- Editing a product is no longer a method for changing stock.
- Sales returns and stock opname can add stock back.
- Mutation history serves as the primary inventory audit trail.

## Current Limitations

- `products.stock` is still maintained as an aggregate for compatibility; operational stock per warehouse is stored in `product_warehouse`.
- Certain historical records may have a nullable `warehouse_id`.
- Not all legacy mutation sources are represented using the same pivot structure.

## Central Files

- `app/Http/Controllers/Apps/ProductController.php`
- `app/Http/Controllers/Apps/StockOpnameController.php`
- `app/Http/Controllers/Apps/StockMutationController.php`
- `app/Services/StockMutationService.php`