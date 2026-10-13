# Settings & Payments

Back to the documentation index: `docs/README.md`

## Purpose

Manages business configuration and payments used by the application operationally.

## Current Features

- Payment gateway settings.
- Bank account management.
- Store profile settings.
- Sales target.

## Pages and Routes

- `dashboard/settings/payments`
- `dashboard/settings/bank-accounts`
- `dashboard/settings/store`
- `dashboard/settings/target`

## Permissions

- `payment-settings-access`
- `dashboard-access` for store profile and targets

## User Workflow

1. The admin configures the payment gateway.
2. The admin adds active bank accounts.
3. The admin sets the store profile.
4. The admin sets the sales target.

## Data Integration

- `payment_settings`
- `bank_accounts`
- `settings`
- transactions and receivable/payable payments that use bank accounts

## Important Business Effects

- Payment gateway settings affect checkout.
- Active bank accounts affect manual transfers and other financial payments.
- An incorrect `APP_URL` can make webhooks unusable.

## Current Limitations

- Payment gateway still requires provider configuration outside the application.
- Webhook warnings are displayed, but public deployment remains the environment's responsibility.

## Central Files

- `app/Http/Controllers/Apps/PaymentSettingController.php`
- `app/Http/Controllers/Apps/BankAccountController.php`
- `app/Http/Controllers/Apps/SettingController.php`
