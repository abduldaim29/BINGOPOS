# Reports & Documents

Back to the documentation index: `docs/README.md`

## Purpose

Provides operational visibility through reports and documents that are ready to print or share.

## Current Features

- Sales reports.
- Profit reports.
- Advanced Sales Insights.
- Public and internal transaction invoices.
- Thermal receipts in 58mm and 80mm formats.
- Shipping labels.
- Receivable PDFs.
- Payable PDFs.

## Pages and Routes

- `dashboard/reports/sales`
- `dashboard/reports/profits`
- `dashboard/reports/insights`
- `pdf.transactions.invoice`
- `pdf.transactions.receipt`
- `pdf.transactions.shipping`
- `pdf.receivables.show`
- `pdf.payables.show`

## Permissions

- `reports-access`
- `profits-access`
- `reports-insights-access`
- Document access follows the permissions of the originating module, such as `transactions-access`, `receivables-access`, and `payables-access`.

## User Workflow

1. The user opens the sales or profit report.
2. The user filters the data.
3. The user opens the relevant transaction or financial document.
4. The document can be used for printing or sharing.

## Data Integration

- `transactions`
- `transaction_details`
- `profits`
- `receivables`
- `payables`
- `settings` for store identity and details.

## Advanced Sales Insights

The insights dashboard provides operational metrics such as hourly sales, cashier performance, repeat customers, and trend summaries to help business owners make data-driven decisions.

## Important Business Effects

- Sales and profit reports depend on the quality of transaction data.
- Sales returns and inventory corrections can affect operational insights in related reports.

## Current Limitations

- Metric coverage depends on the available transaction, customer, and shift data.
- Analytics do not replace full accounting reports or comprehensive forecasting.

## Central Files

- `app/Http/Controllers/Reports/SalesReportController.php`
- `app/Http/Controllers/Reports/ProfitReportController.php`
- `app/Http/Controllers/DocumentController.php`