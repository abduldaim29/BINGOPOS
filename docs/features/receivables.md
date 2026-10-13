# Receivables

Back to the documentation index: `docs/README.md`

## Purpose

Records customer receivables arising from `pay_later` transactions and provides a workflow for installment payments.

## Current Features

- Receivables list.
- Filter by status, customer, invoice, and due date.
- Receivable details.
- Partial payments.
- Statuses: `unpaid`, `partial`, `paid`, `overdue`.
- Receivable PDF.
- Due-date and overdue reminders through CRM automation.
- Direct delivery via WhatsApp when the service is enabled and the device is connected.

## Pages and Routes

- `dashboard/receivables`
- `receivables.show`
- `receivables.pay`
- `pdf.receivables.show`

## Permissions

- `receivables-access`
- `receivables-pay`

## User Workflow

1. A `pay_later` checkout creates a receivable.
2. The user monitors the receivables list.
3. The user records a payment.
4. The system updates the `paid` amount, `remaining` balance, and `status`.

## Data Integration

- `receivables`
- `receivable_payments`
- `transactions`
- `customers`
- `bank_accounts`

## Important Business Effects

- Receivable payments also affect the `payment_status` of the associated transaction.
- A sales return can adjust the total receivable if the return originates from a credit transaction.

## Reminders and Delivery

Reminders can be created for upcoming due dates, overdue payments, and repeat orders. The scheduler command periodically generates reminder tasks.

Delivery can use the WhatsApp Gateway when `wa_enabled=true` and the device is connected. Otherwise, campaigns can be handled through WhatsApp links or manual follow-ups.

There is no separate approval workflow for recording receivable payments.

## Central Files

- `app/Http/Controllers/Apps/ReceivableController.php`
- `resources/js/Pages/Dashboard/Receivables`