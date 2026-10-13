# Getting Started

Return to the documentation index: `docs/README.md`

## Purpose

This guide helps new developers run the application from scratch until they can log in and access the dashboard modules.

## Minimum Requirements

- PHP 8.3+ as required by Laravel 13
- Composer
- Node.js 18+ + npm
- MySQL / MariaDB
- Standard Laravel PHP extensions
- Chrome/Chromium (for WhatsApp Gateway — optional)

For production deployments that use automation, configure the Laravel queue worker and scheduler. Run `php artisan schedule:run` every minute. The WhatsApp Gateway also requires a separate Node.js service and a process manager such as PM2.

## Setup Steps

```bash
cp .env.example .env
composer install
PUPPETEER_SKIP_DOWNLOAD=true npm install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
# Start all local processes
composer run dev
# Open http://localhost:8000 after the server starts
```

## Recommended Bootstrapping Sequence

1. Configure the database settings in `.env`.
2. Run `php artisan migrate --seed`.
3. Run `php artisan storage:link`.
4. Run `composer run dev`.
5. Open `http://localhost:8000`; on the first installation, the application automatically opens the `/setup` wizard.
6. Complete the wizard to create the admin account, store profile, categories, and main warehouse.
7. Log in using the account created in the setup wizard.

## Seed Data

`DatabaseSeeder` creates only:

- Permissions
- Roles
- Initial payment settings
- Dine-in settings
- Main warehouse `PUSAT`

There is no default user or sample data in the main seeder. The `PUSAT` outlet is created as a central, non-selling warehouse. On the first installation, open the application root, and the `/setup` wizard will open automatically to create the admin account.

To explicitly seed the complete demo dataset:

```bash
php artisan db:seed --class=DemoSeeder --force
```

`DemoSeeder` creates demo outlets `MAL`, `TKB`, and `PUT`, demo users, products, transactions, shifts, purchasing, inventory, pricing, dine-in, and feature coverage. Sales transactions are created only at selling outlets; no real payment gateway calls are made.

The following compatibility alias is also available:

```bash
php artisan seed:demo --force
```

`DatabaseSeeder` is safe for installation and production. Do not run `DemoSeeder` or `seed:demo` against a production database because demo operational data will be regenerated.

Important notes:

- Features that depend on new permissions should always be tested after running `db:seed`.
- If permissions appear out of sync, log out and log back in after seeding is complete.

## After the Application Starts

Perform these minimum checks:

1. `dashboard/settings/store`
2. `dashboard/settings/payments`
3. `dashboard/settings/bank-accounts`
4. `dashboard/settings/target`

## Multi-Branch Scenario

If the store has more than one branch, use the following scenario:

1. During the initial installation (`/setup`), enter at least one branch in the "Branches" step. For example, for Cafe UD Djaya:
   - `PUSAT` (head office) is created automatically as a central, non-selling warehouse.
   - `MAL` / Malabar (selling branch)
   - `TKB` / Taman Kencana (selling branch)
   - `PUT` / Puter (selling branch)
2. The Super Admin account is automatically associated with every outlet. New cashiers are created through `Users`, with an outlet assignment and one default outlet.
3. Initial branch stock: transfer from `PUSAT → WH-MAL/WH-TKB/WH-PUT` through the **Stock Transfer** menu, or enter stock through **Stock Opname**.
4. Per-branch settings (logo, receipt, payment gateway, bank account, printer, WhatsApp, and target) are available on the Settings pages using the outlet switcher in the navbar.
5. Close the shift before switching outlets — the outlet selector is locked while a cashier shift is active.

## Quick Validation Tips

- Open the main dashboard.
- Open the cashier transaction screen.
- Check transaction history.
- Check stock opname / cashier shift / audit logs if their feature migrations are available.

## Common Errors

- Images not displaying: run `php artisan storage:link`.
- Payment webhook not working: check `APP_URL`.
- New module returning error 500: check whether the feature migration has been run.
- Reminders, reorder alerts, or campaigns not running: check the queue worker and `schedule:run`.
- WhatsApp messages not being sent: check `WA_SERVICE_URL`, device status, `wa_enabled`, and the Node.js service.