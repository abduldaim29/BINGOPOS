# Dine-In Feature (QR Menu)

## Summary

The dine-in module allows customers to scan a QR code at their table to view the menu and place orders directly from their phone. Orders are sent to the staff dashboard for confirmation, then processed at the cashier.

## Workflow

```
Customer scans QR
  → View menu & select items
  → Select payment method (cashier)
  → Order sent → status: submitted

Staff views order in dashboard
  → Accept (accept) → stock deducted, proceed to cashier
  → Or Reject (reject) with reason

If paying at cashier:
  → Staff processes at cashier page as usual
```

## Database

### Table: `dine_areas`
Area/grouping tables (example: Indoor, Outdoor, VIP).

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Area name |
| `sort_order` | integer | Display order |
| `is_active` | boolean | Area active/inactive |

### Table: `dine_tables`
Individual tables with QR token.

| Field | Type | Description |
|-------|------|-------------|
| `dine_area_id` | foreignId | Relation to area (nullable) |
| `name` | string | Table name (example: M1, Outdoor-1) |
| `token` | uuid | UUID auto-generate (unik per meja) |
| `capacity` | integer | Capacity in people |
| `pos_x` | integer | Grid X position (0-24) |
| `pos_y` | integer | Grid Y position (0-14) |
| `shape` | enum | `circle` or `square` |
| `is_active` | boolean | Table active/inactive |

### Table: `dine_orders`
Header customer order.

| Field | Type | Description |
|-------|------|-------------|
| `dine_table_id` | foreignId | Table destination |
| `customer_id` | foreignId | (nullable) |
| `access_token` | uuid | Unique token for status page |
| `status` | enum | submitted/accepted/completed/rejected/cancelled |
| `notes` | text | Order notes |
| `payment_option` | enum | pay_at_counter / pay_online |
| `payment_method` | string | midtrans/xendit/cash/safepay (nullable) |
| `payment_status` | string | pending/paid/failed (nullable) |
| `payment_reference` | string | Reference from gateway (nullable) |
| `payment_url` | string | Payment URL (nullable) |
| `cashier_id` | foreignId | Cashier who confirmed (nullable) |
| `transaction_id` | foreignId | Related transaction (nullable) |
| `subtotal` | integer | Total order |
| `item_count` | integer | Item count |

### Table: `dine_order_items`
Items in the order.

| Field | Type | Description |
|-------|------|-------------|
| `dine_order_id` | foreignId | Order header |
| `product_id` | foreignId | Ordered product |
| `unit_id` | foreignId | Unit (nullable) |
| `qty` | integer | Quantity |
| `price` | integer | Price at order time |
| `note` | string | Item note (nullable) |

## Settings

Controlled via the `Setting` table:

| Key | Default | Description |
|-----|---------|-------------|
| `dine_in_enabled` | true | Dine-in feature active |
| `dine_in_self_order_enabled` | true | Customers can order themselves |
| `dine_in_pay_online_enabled` | true | Legacy setting; online payment not yet available and endpoint only accepts `pay_at_counter` |

## Routes

### Admin (dashboard)

| Method | Route | Middleware |
|--------|-------|-----------|
| GET | `/dashboard/dine-areas` | permission:dine-tables-access |
| POST | `/dashboard/dine-areas` | permission:dine-tables-create |
| PATCH | `/dashboard/dine-areas/{area}` | permission:dine-tables-access |
| DELETE | `/dashboard/dine-areas/{area}` | permission:dine-tables-access |
| GET | `/dashboard/dine-tables` | permission:dine-tables-access |
| POST | `/dashboard/dine-tables` | permission:dine-tables-create |
| PATCH | `/dashboard/dine-tables/{table}` | permission:dine-tables-update |
| DELETE | `/dashboard/dine-tables/{table}` | permission:dine-tables-delete |
| GET | `/dashboard/dine-tables/{table}/qr` | permission:dine-tables-access |
| GET | `/dashboard/dine-orders` | permission:dine-orders-access |
| POST | `/dashboard/dine-orders/{order}/accept` | permission:dine-orders-process |
| POST | `/dashboard/dine-orders/{order}/reject` | permission:dine-orders-process |

### Public

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/dine/{token}` | Public menu page |
| POST | `/dine/{token}/order` | Submit order |
| GET | `/dine-order/{accessToken}` | Order status page |
| GET | `/dine-order/{accessToken}/check` | Polling status endpoint (JSON) |

## Permissions

| Permission | Description |
|------------|-------------|
| `dine-tables-access` | View areas & tables |
| `dine-tables-create` | Add areas/tables |
| `dine-tables-update` | Edit table positions |
| `dine-tables-delete` | Delete tables |
| `dine-orders-access` | View order list |
| `dine-orders-process` | Accept/reject orders |

**Role cashier** gets: `dine-orders-access` + `dine-orders-process`

## Main Features

### Floor Plan Editor (SVG Grid)
- Display grid SVG 25x15 cell (40px/cell)
- Drag-and-drop tables for repositioning
- List mode as alternative
- Filter by area

### QR Code Generation
- QR contains URL: `{APP_URL}/dine/{token}`
- Generated via `simplesoftwareio/simple-qrcode`
- Download PNG from dashboard

### Self-Order Customer
- Select category & products
- Real-time cart
- Optional notes per item
- Current option: Pay at Counter (`pay_at_counter`)

### Polling Status
- Status page auto-refreshes every 5 seconds when status = submitted
- Visual notifications per status (waiting/accepted/completed/rejected)

### Conversion by Staff
- Accept: stock deducted immediately, order ready for processing
- Reject: with optional reason
- Confirmation from cashier via POS page like regular transaction

## Payment

Currently, endpoint `/dine/{token}/order` only accepts `payment_option: pay_at_counter`.
`pay_online` is not yet connected to the payment gateway and will be rejected by the backend validation.

## Technical Notes

- QR generator: `simplesoftwareio/simple-qrcode`
- Status polling: fetch JSON every 5 seconds (without broadcast/realtime dependency)
- Stock is deducted when `accept` — not when submitted
- Core POS (`TransactionController`) is NOT modified
- Cart remains based on `cashier_id` — not affected by dine-in
