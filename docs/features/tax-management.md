# VAT Tax Management

Back to the documentation index: `docs/README.md`

## Purpose

Supports VAT (Value Added Tax) on transactions, with exclusive/inclusive modes per product, store NPWP/NIB details, and a configurable default tax rate.

## Definitions

| Term | Meaning |
|---------|------|
| Tax Exclusive | The product price **does not yet include** VAT. VAT is added to the grand total. |
| Tax Inclusive | The product price **already includes** VAT. VAT is separated for reporting. |
| NPWP | Taxpayer Identification Number — the store's tax identification. |
| VAT (PPN) | Value Added Tax (default 18%). |

## Current Features

- VAT per product (exclusive/inclusive), with different rates allowed for different products.
- The default VAT rate can be configured under Settings → Store Profile (default: 18.00%).
- Checkout tax calculation automatically adds VAT to the grand total.
- VAT line displayed in the checkout preview, printed invoices, PDF invoices, 80mm and 58mm PDF receipts, and thermal receipts.
- The grand total includes VAT.
- Store NPWP and NIB details are available under Settings → Store Profile.
- Reports include VAT in the grand total.

## Database

### Products

- `tax_type` — `exclusive` or `inclusive`.
- `tax_rate` — percentage (decimal 5,2), default `18.00`.

### Transactions

- `tax_rate` — the applied tax rate (nullable).
- `tax_total` — total VAT amount in Pakistani rupees (PKR).
- `customer_npwp` — customer NPWP (optional).

### Settings

- `store_npwp` — store NPWP.
- `store_nib` — store NIB.
- `tax_default_rate` — default tax rate for new products.

## Pages and Routes

| Route | Function |
|-------|--------|
| `settings.store` | Configure NPWP, NIB, and the default VAT rate. |

## Calculation Workflow

### Exclusive (default)

```text
Product price: Rs 10,000
VAT 18%:       Rs  1,800
Total:         Rs 11,800
```

### Inclusive

```text
Product price: Rs 11,800 (VAT included)
VAT 18%:       Rs  1,800 (calculated: 11800 - (11800 / 1.18))
Total:         Rs 10,000 + Rs 1,800
```

## Notes

- Tax affects only `grand_total`; it does not affect discounts, vouchers, or loyalty points.
- Shipping costs are also subject to VAT at the same rate.
- If `tax_rate = 0`, VAT is not calculated.
- NPWP/NIB settings are optional and can be left blank.