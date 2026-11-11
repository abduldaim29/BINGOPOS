# Configuration

Return to the documentation index: `docs/README.md`

## Important Environment Variables

| Variable | Purpose |
|----------|---------|
| `APP_URL` | Webhook URL, public invoice, customer portal link, payment callback |
| `APP_VERSION` | Application version (displayed in the sidebar and POS navbar) |
| `DB_DATABASE` | Database name (default: `point_of_sales`) |
| `MIDTRANS_SERVER_KEY` | Midtrans server key |
| `MIDTRANS_CLIENT_KEY` | Midtrans client key (frontend) |
| `XENDIT_SECRET_KEY` | Xendit secret key |
| `XENDIT_PUBLIC_KEY` | Xendit public key |
| `XENDIT_CALLBACK_TOKEN` | Xendit webhook verification callback token |
| `AUTH_PUBLIC_REGISTRATION` | Enable public registration (`true`/`false`, default: `false`) |

The runtime version displayed by the application comes from `APP_VERSION`. Its value must match the Git release tag, for example, `v2.10.4`.

## APP_URL

`APP_URL` must be public (not `localhost`) when using:

- Midtrans/Xendit webhooks
- Public invoice sharing
- Customer portal links
- Payment gateway callbacks

## Payment Gateway

Configuration at `dashboard/settings/payments`:

- **Cash** — no configuration required
- **Bank Transfer** — requires an active bank account
- **Midtrans** — requires a server key, client key, and production mode
- **Xendit** — requires a secret key, public key, callback token, and production mode

Setup details: `docs/features/settings-payments.md`

## Bank Accounts

Configuration at `dashboard/settings/bank-accounts`:

- Used for manual bank transfer payments
- Display order can be configured
- Can be deactivated without being deleted

## Tax & Legal Information

At `dashboard/settings/store`, the Brand Profile stores these optional Pakistan tax identifiers:

- **NTN** — National Tax Number; individuals may enter their CNIC where it serves as their FBR registration number.
- **STRN** — Sales Tax Registration Number, when registered for sales tax.
- Product tax type and rate are configured on individual product records.

## Printer Settings

Configuration at `dashboard/settings/printer`:

- **Paper Size** — 80mm or 58mm
- **Auto-print** — automatically print receipts after transactions (via WebUSB)
- Thermal printers connect via WebUSB (Chrome/Edge browser)

## Store Profile

Configuration at `dashboard/settings/store`:

- Name, address, phone, email, website, and city
- Store logo
- NTN/CNIC and STRN (for Pakistan tax purposes)

## Sales Target

Configuration at `dashboard/settings/target`:

- Monthly sales target
- Displayed on the dashboard as a progress bar

Campaigns and scheduled reminders require the Laravel scheduler and queue worker to be running.

## Multi-Warehouse

Configuration at `dashboard/settings/warehouses`:

- **Main Warehouse** — central warehouse, created automatically during seeding
- **Branch Warehouse** — store branch that also sells directly
- **Stock Warehouse** — buffer warehouse that does not sell directly
- Product stock is separated by warehouse in the `product_warehouse` table

## External Dependency Notes

- `laravolt/indonesia` — Indonesian province/city/district/village data
- `barryvdh/laravel-dompdf` — generate PDF invoices, receipts, and shipping labels
- `picqer/php-barcode-generator` — barcodes in PDF documents
- `maatwebsite/excel` — CSV and Excel import/export
- Midtrans & Xendit — payment gateways