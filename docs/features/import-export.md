# Import / Export CSV & Excel

Back to the documentation index: `docs/README.md`

## Purpose

Import master data (products and customers) from spreadsheets. Export data to Excel for backup or further analysis.

## Current Features

### Export

- **Products** — barcode, SKU, name, category, purchase price, selling price, stock, minimum stock, maximum stock, tax type, and tax rate.
- **Customers** — name, phone, address, province, city, district, village, membership status, tier, and points.
- **Transactions** — invoice, date, cashier, customer, payment method, status, subtotal, discount, shipping cost, VAT, and grand total. Data can be filtered by date and warehouse.

### Import

- **Products** — upload Excel/CSV files, automatically create categories if they do not exist, and update existing records when a barcode matches (`updateOrCreate`).
- **Customers** — upload Excel/CSV files and validate required columns.

### Templates

- Download blank Excel templates with the appropriate headers for data preparation.

## Routes

| Route | Method | Function |
|-------|--------|----------|
| `export.products` | GET | Download product Excel file |
| `export.customers` | GET | Download customer Excel file |
| `export.transactions` | GET | Download transaction Excel file with filters |
| `import.products` | POST | Upload product import file |
| `import.customers` | POST | Upload customer import file |
| `import.template/{type}` | GET | Download template (products/customers) |

## Permissions

| Permission | Purpose |
|-----------|-----------|
| `products-export` | Download product Excel file |
| `products-import` | Upload product import file |
| `customers-export` | Download customer Excel file |
| `customers-import` | Upload customer import file |

## Template Formats

### Product Template

| barcode | sku | name | description | category | purchase_price | selling_price | stock | min_stock | max_stock | tax_type | tax_rate |
|---------|-----|------|-------------|----------|----------------|---------------|-------|-----------|-----------|----------|----------|

### Customer Template

| name | phone | address |
|------|-------|---------|

## Notes

- Product imports use `updateOrCreate` based on the barcode, making re-imports safe.
- Categories are created automatically if they do not already exist.
- Supported file formats: `.xlsx`, `.xls`, `.csv` (maximum 5 MB).
- Imports are processed in batches of 100 records for better performance.
- Export/import buttons are available on the Products and Customers pages.