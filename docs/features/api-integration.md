# API & Integration
API v1 provides token-based access for mobile applications, point-of-sale devices, and external integrations.
## Authentication
- Login and registration are available at `/api/v1/auth/*`.
- Protected endpoints use Sanctum Bearer tokens.
- Login tokens include the user's permission-based abilities.
- Master data endpoints check the corresponding abilities.
## Main Endpoints
- Master data: products, customers, categories, warehouses, suppliers.
- POS: shifts, product scanning, cart, hold/resume, checkout, transactions.
- Offline sync: `POST /api/v1/pos/transactions/sync`.
- Payment webhooks: `/api/webhooks/midtrans` and `/api/webhooks/xendit`.
## API Documentation
In an active installation, Scramble documentation is available at `/docs/api`, and the OpenAPI JSON is available at `/docs/api.json`.
Access to production documentation can be protected using `SCRAMBLE_DOCS_TOKEN`.