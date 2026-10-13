# Point of Sale Documentation

This documentation is intended for developers who want to set up the application, understand module workflows, and maintain the application.

## Table of Contents

### Onboarding

- `docs/getting-started.md` — initial setup
- `docs/configuration.md` — environment, payment, tax, and printer settings

### Architecture

- `docs/architecture-overview.md` — tech stack, middleware, and service layer
- `docs/feature-index.md` — index of all modules

### POS & Transactions

- `docs/features/pos-transactions.md` — cart, hold/resume, and multi-payment checkout
- `docs/features/sales-returns.md` — sales returns, refunds, and store credit
- `docs/features/cashier-shifts.md` — opening and closing cashier shifts
- `docs/features/customer-portal.md` — public invoices and online receivables payments 🆕
- `docs/features/dine-in.md` — QR menu, self-ordering, and floor plan 🆕

### Inventory & Warehouse

- `docs/features/inventory-stock.md` — products, stock opname, and stock mutations
- `docs/features/multi-warehouse.md` — multiple warehouses and stock transfers 🆕
- `docs/features/unit-conversion.md` — multiple units of measurement (pcs, box, kg) 🆕

### Purchasing & Finance

- `docs/features/purchasing-chain.md` — purchase orders (POs), goods receiving, and supplier returns 🆕
- `docs/features/payables-suppliers.md` — supplier payables
- `docs/features/receivables.md` — customer receivables
- `docs/features/tax-management.md` — VAT, NPWP, and NIB 🆕

### Pricing & Loyalty

- `docs/features/promotions-loyalty.md` — pricing rules, vouchers, loyalty, and price lists 🆕

### CRM

- `docs/features/member-management.md` — member CRUD operations
- `docs/features/crm-segments.md` — segments, campaigns, and reminders 🆕

### Settings & Administration

- `docs/features/settings-payments.md` — payment gateways, bank accounts, store profile, and sales target
- `docs/features/rbac-users-roles.md` — users, roles, and permissions
- `docs/features/audit-logs.md` — audit trail

### Reports & Documents

- `docs/features/reports-documents.md` — sales, profit, insights, and PDF documents

### Tools & Integrations

- `docs/features/import-export.md` — CSV/Excel import and export 🆕
- `docs/features/mobile-pos.md` — PWA and camera-based barcode scanner 🆕
- `docs/features/thermal-printer.md` — ESC/POS and WebUSB 🆕

### Release & Roadmap

- `CHANGELOG.md` — application release history
- Public `/roadmap` page — completed releases and future development direction

## How to Read the Documentation

1. If this is your first time, start with `docs/getting-started.md`.
2. To understand the structure, read `docs/architecture-overview.md`.
3. To work on a specific module, open `docs/feature-index.md` and navigate to the relevant feature document.
4. For access issues, check `docs/features/rbac-users-roles.md`.

## Notes

- The documentation covers features available in the repository and describes their operational limitations.
- Release identity follows the Git tag and `APP_VERSION`.
- Each feature document covers its purpose, routes, permissions, and user workflows.