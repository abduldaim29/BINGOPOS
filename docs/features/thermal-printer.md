# Thermal Printer

Back to the documentation index: `docs/README.md`

## Purpose

Print receipts directly to thermal printers using the ESC/POS protocol through browser-based WebUSB, or through server-side text generation.

## Current Features

### ThermalPrintService (Server-Side)

- Generate receipt text in monospace format.
- Support 80mm (48 characters) and 58mm (32 characters) paper sizes.
- Format includes store header, invoice information, item list, subtotal, discount, VAT, total, payment details, and footer.
- Output formats: plain text (`generateReceiptText`) and HTML (`generateReceiptHtml`).

### Thermal Print Route

- `GET /dashboard/documents/transactions/{invoice}/print/thermal` — HTML receipt.
- Can be opened in a new tab for printing through the browser.

### Printer Settings

- Paper size: 80mm / 58mm.
- Auto-print toggle (automatically print after a transaction).

## ESC/POS WebUSB (Client-Side)

Print ESC/POS bytes directly to a printer through WebUSB without opening the browser's print dialog.

- **Byte generator:** `resources/js/Utils/escpos.js`
  - `buildReceiptBytes(data, paperSize)` — supports 58mm/80mm paper sizes and automatic cutting using `GS V`.
  - `drawerKickBytes(pin)` — uses `ESC p` to open the cash drawer.
- **Connector:** `requestPrinter()` / `getPrinter()` / `printBytes()` — uses WebUSB and filters for printer-class devices (class 7).
- **Buttons under Settings > Printer:** Connect Printer, Test Print, Open Cash Drawer (Kick), and Disconnect.
- **Auto-print:** After checkout for non-QRIS transactions, provided auto-print is enabled, the printer is connected, and the transaction status is not pending. Automatic cash drawer kick is also supported for cash payments (`Print.jsx`).

> **Note:** WebUSB is available only in Chromium-based browsers such as Chrome, Edge, and Opera, and requires a user gesture (clicking the "Connect Printer" button). Other browsers can still print using `window.print()`.

## Routes

| Route | Method | Function |
|-------|--------|--------|
| `pdf.transactions.thermal` | GET | Thermal HTML receipt |
| `settings.printer` | GET | Printer settings page |
| `settings.printer.update` | POST | Save printer settings |

## Receipt Format (80mm)

```text
            YOUR STORE
        123 Example Street
        Phone: 021-123456
--------------------------------
No: TRX-XXXXXXXXXX
Date: 22/06/2026 14:30
Cashier: Arya
Customer: General Customer
--------------------------------
Product A
2x @ 10,000           20,000
Product B
1x @ 15,000           15,000
--------------------------------
Subtotal              35,000
VAT                    3,850
--------------------------------
TOTAL                 38,850
Cash                  50,000
Change                11,150
--------------------------------
        Thank you
```

## Notes

- For network printing, use `NetworkPrintConnector` or `WindowsPrintConnector` (not yet available in the codebase).
- Shift X/Z reports also use `ThermalPrintService` through `generateShiftReportText`.