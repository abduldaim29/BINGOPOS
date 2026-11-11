# VAT Tax Management

Back to the documentation index: `docs/README.md`

## Purpose

Supports tax on transactions, with exclusive/inclusive modes per product and optional Pakistan FBR identifiers (NTN/CNIC and STRN) on the Brand Profile.

## Definitions

| Term | Meaning |
|---------|------|
| Tax Exclusive | The product price **does not yet include** VAT. VAT is added to the grand total. |
| Tax Inclusive | The product price **already includes** VAT. VAT is separated for reporting. |
| NTN | National Tax Number used for income-tax registration with FBR; for individuals, CNIC may serve as the registration number. |
| STRN | Sales Tax Registration Number for entities registered for sales tax. |
| VAT (PPN) | Value Added Tax (default 18%). |

## Current Features

- VAT per product (exclusive/inclusive), with different rates allowed for different products.
- Tax type and rate are configured per product.
- Checkout tax calculation automatically adds VAT to the grand total.
- VAT line displayed in the checkout preview, printed invoices, PDF invoices, 80mm and 58mm PDF receipts, and thermal receipts.
- The grand total includes VAT.
- Brand NTN/CNIC and STRN details are available under Settings → Brand Profile.
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

- `brand_ntn` — brand NTN/CNIC.
- `brand_strn` — brand STRN.
- `tax_default_rate` — default tax rate for new products.

## Pages and Routes

| Route | Function |
|-------|--------|
| `settings.store` | Configure Brand Profile NTN/CNIC and STRN. |

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
- NTN/CNIC and STRN settings are optional and can be left blank when not applicable.