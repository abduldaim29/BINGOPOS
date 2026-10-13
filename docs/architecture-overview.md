# Architecture Overview

Back to the documentation index: `docs/README.md`

## Stack

- **Backend:** Laravel 13 (PHP 8.3+)
- **Frontend:** Inertia.js 3 + React 19, Vite 5
- **Styling:** Tailwind CSS 3 (custom theme in `tailwind.config.js`)
- **Authentication/RBAC:** Spatie Laravel Permission + Laravel Breeze
- **Database:** MySQL (default); in-memory SQLite for testing
- **Payment Gateways:** Midtrans, Xendit, Safepay

## Important Directory Structure

- `routes/web.php` — Approximately 190+ dashboard, public sharing, and portal routes.
- `routes/api.php` — Midtrans, Xendit and Safepay webhooks (without authentication), REST `/api/v1/*` endpoints for master data and POS.
- `app/Http/Controllers/Apps/` — Controllers for individual dashboard modules (approximately 36 files).
- `app/Http/Controllers/Reports/` — Report controllers (sales, profit, insights).
- `app/Http/Controllers/DocumentController.php` — PDF documents.
- `app/Http/Controllers/PublicPortalController.php` — Customer self-service portal.
- `app/Http/Middleware/` — Nine custom middleware classes.
- `app/Http/Middleware/HandleInertiaRequests.php` — Global shared props (authentication, permissions, notifications, shift, store profile, active outlet, security, and printer settings).
- `app/Models/` — 59 models.
- `app/Services/` — Business logic layer (26 services, including `PaymentGatewayManager`, `TransactionTenderService`, `PricingService`, `OutletAccessService`, and `CashierShiftService`).
- `app/Services/Payments/` — `MidtransGateway`, `XenditGateway`.
- `resources/js/Pages/Dashboard/` — Inertia page components (approximately 115 files across 39 directories).
- `resources/js/Pages/Public/` — Public Inertia pages (customer portal).
- `resources/js/Layouts/` — Five layouts: `POSLayout`, `DashboardLayout`, `AuthenticatedLayout`, `GuestLayout`, and `PublicLayout`.
- `resources/js/Utils/` — ESC/POS (WebUSB), offline database (IndexedDB), tours (`driver.js`), and authorization utilities.
- `database/migrations/` — 97 migrations.
- `database/seeders/` — Core seeders (`PermissionSeeder`, `RoleSeeder`, `PaymentSettingSeeder`, `DineInSettingsSeeder`) and demo/coverage seeders (`UserSeeder`, `SampleDataSeeder`, `OperationalCoreSeeder`, `FeatureCoverageSeeder`, `FeatureDemoSeeder`) that are run explicitly.

### Seeders

`DatabaseSeeder` runs `PermissionSeeder`, `RoleSeeder`, `PaymentSettingSeeder`, and `DineInSettingsSeeder`, then ensures that the main `PUSAT` warehouse exists. The `UserSeeder`, `SampleDataSeeder`, `OperationalCoreSeeder`, `FeatureCoverageSeeder`, and `FeatureDemoSeeder` seeders are opt-in for demonstrations or testing.

## General Request Flow

1. Dashboard routes are protected by `auth` + `verified` + `permission`.
2. Controllers prepare data using Models and Services.
3. Inertia renders React pages from `resources/js/Pages/Dashboard/**/*.jsx`.
4. User permissions are shared with the frontend through `HandleInertiaRequests.php`.
5. The frontend uses permissions to control button and menu visibility.

## Middleware

| Alias | Class | Function |
|-------|-------|--------|
| `permission` | Spatie PermissionMiddleware | Protects routes based on permission strings. |
| `role` | Spatie RoleMiddleware | Protects routes based on roles. |
| `role_or_permission` | Spatie RoleOrPermissionMiddleware | Protects routes based on a role OR a permission. |
| `active_shift` | EnsureActiveCashierShift | Requires an active shift for POS operations (cart, hold, checkout). |
| `step_up` | EnsureRecentPasswordConfirmation | Requires password confirmation for sensitive actions (role/user CRUD, payment settings, bank accounts, and payment confirmation). |
| `bot.guard` | EnsureBotGuard | Honeypot and timer-based anti-bot protection for login, registration, and forgot-password forms. |
| `registration.enabled` | EnsurePublicRegistrationEnabled | Disables public registration (disabled by default). |
| `setup.notinstalled` | EnsureNotInstalled | Redirects to `/setup` when `app_setup_completed=false`. |
| `abilities` | CheckAbilities (Sanctum) | Checks token abilities for master-data API endpoints. |
| `SetLocale` | (web group) | Locale priority: user column → session → cookie → Accept-Language (default `id`). |
| `SecureHeaders` | (web group) | Sets `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`. |
| `EnforceAbsoluteSessionLifetime` | (web group) | Forces logout after the session lifetime expires (`SECURITY_SESSION_ABSOLUTE_LIFETIME_SECONDS`, default 12 hours). |
| `HandleInertiaRequests` | (web group) | Injects shared props into all Inertia pages. |

## Service Layer

| Service | Function |
|---------|--------|
| `AuditLogService` | Records important changes with before/after snapshots. |
| `CashierShiftService` | Shift lifecycle: open, close, force-close, summary. |
| `StockMutationService` | Records all stock changes with an audit trail. |
| `PricingService` | Promotion engine: quantity breaks, bundles, buy-X-get-Y. |
| `LoyaltyService` | Points, tiers, and vouchers — earn/redeem. |
| `TaxService` | Calculates exclusive/inclusive VAT per item. |
| `UnitConversionService` | Converts between units (pcs ↔ box ↔ kg). |
| `BatchService` | FEFO batch allocation and expiration alerts. |
| `ReorderService` | Identifies products needing restocking and creates draft POs. |
| `PriceListService` | Special pricing by customer group. |
| `StockTransferService` | Manages the lifecycle of stock transfers between warehouses. |
| `ThermalPrintService` | Generates ESC/POS receipt text. |
| `CrmAutomationService` | Campaigns, reminders, and automation. |
| `CustomerSegmentationService` | Automatic and manual customer segmentation. |
| `PurchaseOrderService` | PO lifecycle: draft, place, cancel. |
| `GoodsReceivingService` | Receives goods, updates stock, and creates payables. |
| `SupplierReturnService` | Supplier returns and stock/payable adjustments. |
| `ReceivableService` | Aging, statements, and collection statistics. |
| `PayableAgingService` | Supplier payable aging. |
| `PaymentGatewayManager` | Dispatches payments to Midtrans/Xendit/Safepay via HTTP API calls (no direct SDKs). |
| `WhatsAppService` | HTTP wrapper for the Node.js `whatsapp-web.js` service. |

## Module Integration Patterns

- **Transaction** is the central entity: details, profits, receivables, sales returns, campaign logs, and discount approvals.
- **Product** is the central inventory entity: stock opname, stock mutations, batches, composite products, pricing rules, price list items, and units.
- **Warehouse** is a new dimension: nearly all stock and transaction tables have a `warehouse_id`.
- **Audit Log** spans modules: every important change is recorded through `AuditLogService`.

## Multi-Warehouse Data Flow

```text id="5t2p7r"
Cashier opens shift → selects warehouse
    ↓
POS checks stock in product_warehouse (product_id + warehouse_id)
    ↓
Checkout → decrements stock in product_warehouse
         → transaction.warehouse_id = shift.warehouse_id
    ↓
PO → warehouse_id
GR → inherits warehouse from PO and increments stock in the pivot table
Stock Transfer → source → send → receive → destination
Stock Opname → selects warehouse and reads stock from the pivot table
```

## WhatsApp Gateway Architecture

```text id="f4k2m8"
┌─────────────────────────┐     HTTP      ┌──────────────────────┐
│  Laravel App            │  ──────────→  │  whatsapp-service    │
│                         │  ←──────────  │  (Node.js :3001)     │
│  WhatsAppService.php    │               │                      │
│  CrmAutomationService   │               │  whatsapp-web.js     │
│  SettingController      │               │  Puppeteer/Chrome    │
└─────────────────────────┘               └──────────┬───────────┘
                                                     │
                                                WhatsApp Web
```

- `whatsapp-service/` is a Node.js Express server running `whatsapp-web.js`.
- Laravel communicates with this service over HTTP.
- WhatsApp sessions are stored in `whatsapp-service/session/` and persist across restarts.
- Requires Node.js and Chrome on the server (used internally by Puppeteer).

## Feature Documentation Pattern

Each feature document in `docs/features/` covers:

- Module purpose.
- Available features.
- Pages and routes.
- Required permissions.
- User workflow.
- Data integration.
- Technical notes and limitations.