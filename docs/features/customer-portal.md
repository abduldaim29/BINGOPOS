# Customer Portal (Self-Service)

Back to the documentation index: `docs/README.md`

## Purpose

Customers can view invoices, check payment statuses, and pay outstanding receivables online without logging in — simply by using a shared link.

## Current Features

- **Invoice details** — view items, prices, discounts, VAT, and total.
- **Payment status** — Paid, Pending, Unpaid.
- **Transaction history** — for the same customer (via access token).
- **Online receivables payment** — if the status is `pay_later` and the invoice is unpaid, a "Pay Now" button redirects to the payment gateway.
- **Token-based access** — a unique, unpredictable URL for each transaction (UUID v4).
- **Guest layout** — public pages that do not require login.
- **Share button** — on the transaction print page, copies the portal link to the clipboard.

## Security

- Access token: UUID v4 — unpredictable.
- Each token is restricted to a single invoice and cannot access other invoices.
- No sensitive data is displayed.
- Rate limiting per IP address.

## Database

- `transactions.access_token` — unique UUID.
- `receivables.access_token` — unique UUID.
- Tokens are automatically generated when a transaction is created.

## Pages and Routes

| Route | Function | Authentication |
|-------|----------|----------------|
| `portal.transaction` | View transaction details | Token-based |
| `portal.receivable.pay` | Pay receivables via payment gateway | Token-based |

## Sharing Workflow

1. The cashier completes checkout.
2. On the print page, click the "Share" button.
3. The portal link is automatically copied to the clipboard.
4. The cashier sends the link to the customer via WhatsApp.
5. The customer opens the link, views the invoice, and pays if necessary.
