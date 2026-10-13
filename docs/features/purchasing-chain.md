# Purchasing Chain

Back to the documentation index: `docs/README.md`

## Purpose

A formal supplier purchasing module covering Purchase Orders, Goods Receiving, and Supplier Returns. It completes the inventory cycle from purchasing through stock receipt.

## Current Features

### Purchase Order (PO)

- Create purchase orders by selecting a supplier and adding product items.
- Specify quantity and purchase price for each item.
- Automatically generate document numbers (`PO-YYYYmmdd-XXXX`).
- Status lifecycle: `draft` → `ordered` → `partial_received` / `completed` → `cancelled`.
- Filter by status, supplier, and document number.

### Goods Receiving (GR)

- Receive goods against a purchase order, either in full or partially.
- Record the received quantity for each item and add discrepancy notes.
- Automatically update the PO status (`partial_received` or `completed`).
- Enter a **batch number** and **expiration date** for each item to support batch tracking.
- Increase stock in the destination warehouse specified by the PO.
- Automatically create a payable with a 30-day due date.

### Supplier Return

- Return goods to the supplier from a Goods Receiving record.
- Status lifecycle: `draft` → `completed` / `cancelled`.
- Adjust stock by decreasing inventory in the originating warehouse.
- Adjust the payable balance when applicable.
- Record a return reason for each item.

## Pages and Routes

| Page | Route | Method |
|---------|-------|--------|
| PO List | `purchase-orders.index` | GET |
| Create PO | `purchase-orders.create` | GET |
| Save PO | `purchase-orders.store` | POST |
| PO Details | `purchase-orders.show` | GET |
| Place PO | `purchase-orders.place` | POST |
| Cancel PO | `purchase-orders.cancel` | POST |
| GR List | `goods-receivings.index` | GET |
| Create GR | `goods-receivings.create` | GET |
| Save GR | `goods-receivings.store` | POST |
| GR Details | `goods-receivings.show` | GET |
| SR List | `supplier-returns.index` | GET |
| Create SR | `supplier-returns.create` | GET |
| Save SR | `supplier-returns.store` | POST |
| SR Details | `supplier-returns.show` | GET |
| Complete SR | `supplier-returns.complete` | POST |
| Cancel SR | `supplier-returns.cancel` | POST |

## Permissions

| Permission | Purpose |
|-----------|-----------|
| `purchase-orders-access` | View PO lists and details |
| `purchase-orders-create` | Create POs |
| `purchase-orders-update` | Place or cancel POs |
| `goods-receivings-access` | View GR lists and details |
| `goods-receivings-create` | Create GRs |
| `supplier-returns-access` | View SR lists and details |
| `supplier-returns-create` | Create SRs |
| `supplier-returns-update` | Complete or cancel SRs |

## User Workflow

1. **Create PO** → Select a supplier, add items, and save as a draft.
2. **Place PO** → Change the status from `draft` to `ordered`.
3. **Goods Receiving** → Select an ordered PO, enter the received quantities and batch details, then save.
4. **Supplier Return** (if needed) → Select a GR, choose the items to return, and complete the return.
5. **Payable** → A payable is automatically created when goods are received. Manage and settle it through the Payables module.

## Data Integration

- `purchase_orders` → `purchase_order_items` → Goods Receiving updates `qty_received` by incrementing the received quantity.
- `goods_receivings` → `goods_receiving_items` → Increases stock and creates stock mutation records.
- `supplier_returns` → `supplier_return_items` → Decreases stock and creates stock mutation records.
- `payables` → Automatically created from GR with `due_date` set to 30 days later.
- `product_batches` → Automatically created from GR when `batch_number` is provided.
- `warehouse_id` in the PO → Propagated to the GR.
- Audit logs → Record every status transition.