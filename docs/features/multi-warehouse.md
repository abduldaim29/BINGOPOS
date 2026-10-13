# Multi-Warehouse

Back to the documentation index: `docs/README.md`

## Purpose

Separate product stock by physical location (main warehouse, branch store, backup warehouse). Supports businesses with more than one operational location.

## Definitions

| Term | Meaning |
|---------|------|
| Main Warehouse | The main warehouse, created automatically during seeding |
| Branch Warehouse | A branch store that also sells directly to customers |
| Stock Warehouse | A backup warehouse that does not sell directly to customers |

## Current Features

### Warehouse CRUD

- Add, edit, and delete warehouses.
- Types: main, branch, warehouse.
- Active/inactive status.
- Display order.
- Guard: warehouses with existing stock cannot be deleted.
- Guard: the main warehouse cannot be deleted.

### Product-Warehouse Pivot

- Stock is stored per product per warehouse in `product_warehouse`.
- When a new warehouse is created, all products are automatically synchronized with a stock quantity of 0.
- During seeding, all existing product stock is moved to the PUSAT warehouse.

### Warehouse in Shifts

- Cashiers select a warehouse when opening a shift.
- The warehouse cannot be changed after the shift is opened.
- Administrators can view the originating warehouse in shift details.

### Warehouse in Transactions

- The POS displays only products with stock greater than 0 in the active shift's warehouse.
- The cart stores `warehouse_id`.
- Checkout decrements stock in the warehouse pivot.
- Transactions are recorded with `warehouse_id`.
- Product searches by barcode return only products available in the active shift's warehouse.

### Warehouse in Purchasing

- Purchase orders have a `warehouse_id` for the destination warehouse.
- Goods receipts automatically inherit the warehouse from the purchase order.
- Supplier returns decrement stock from the originating warehouse.
- Stock opname allows warehouse selection and reads stock from the warehouse pivot.

### Inter-Warehouse Stock Transfers

- Transfer stock between warehouses (source → destination).
- Statuses: draft → in_transit → completed / cancelled.
- Send: decrease source stock and record a stock mutation.
- Receive: increase destination stock and record a stock mutation.
- Cancel: if the transfer is in transit, return stock to the source.
- Validate stock availability before sending.

## Pages and Routes

| Route | Function |
|-------|----------|
| `settings.warehouses.index` | List of warehouses (inline CRUD) |
| `stock-transfers.index` | List of stock transfers |
| `stock-transfers.create` | Create a new transfer |
| `stock-transfers.show` | Transfer details and actions (send/receive/cancel) |

## Permissions

| Permission | Purpose |
|-----------|-----------|
| `warehouses-access` | View the list of warehouses |
| `warehouses-create` | Add a new warehouse |
| `warehouses-update` | Edit a warehouse |
| `warehouses-delete` | Delete a warehouse |
| `stock-transfers-access` | View the list of transfers |
| `stock-transfers-create` | Create a transfer |
| `stock-transfers-send` | Send a transfer (decrement source stock) |
| `stock-transfers-receive` | Receive a transfer (increment destination stock) |
| `stock-transfers-cancel` | Cancel a transfer |

## User Workflow

1. **Admin:** Configure warehouses in Settings → Warehouses.
2. **Cashier:** Open a shift and select a warehouse.
3. **POS:** Display only products with stock in the shift's warehouse.
4. **Checkout:** Decrement stock from the shift's warehouse.
5. **Purchase Order (PO):** Specify the destination warehouse.
6. **Goods Receipt (GR):** Receive items into the purchase order's warehouse.
7. **Stock Opname:** Select a warehouse and count physical stock.
8. **Stock Transfer:** Send items between warehouses.

## Technical Notes

- All stock and transaction tables have a nullable `warehouse_id` for backward compatibility.
- If `warehouse_id` is null, the system falls back to `products.stock` for legacy single-warehouse support.
- Seed data: the PUSAT warehouse (main) is created automatically, and existing stock is moved to the pivot table.