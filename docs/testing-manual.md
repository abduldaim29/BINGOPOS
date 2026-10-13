# Manual Testing Checklist

A manual testing checklist for scenarios that require real devices or credentials and cannot be automated with the test suite. Run these tests whenever a major release affects the relevant areas.

Return to the documentation index: `docs/README.md`

## 1. QRIS End-to-End (Sandbox)

**Prerequisites:** Midtrans or Xendit is enabled under Settings > Payment with sandbox credentials, and `APP_URL` is public (webhooks require a public URL — localhost cannot receive callbacks).

- [ ] Complete POS checkout using **QRIS** → redirect to the print page, with the QR code displayed.
- [ ] Scan the QR code using a sandbox e-wallet application (GoPay/ShopeePay Midtrans sandbox, or Xendit simulation).
- [ ] Transaction status automatically changes from `pending` to `paid` (polling approximately every 4 seconds), without a manual reload.
- [ ] The printed receipt displays the `PAID` status after payment.
- [ ] Webhook is received: `payment_status` is updated in the database and `payment_reference` is populated.
- [ ] **Unpaid** QRIS transactions are not printed automatically (auto-print skips transactions while pending).

## 2. Real ESC/POS Printer

**Prerequisites:** A 58mm/80mm USB thermal printer and a Chromium-based browser (Chrome/Edge/Opera).

- [ ] Go to Settings > Printer → **Connect Printer** → select the printer device in the WebUSB prompt.
- [ ] **Test Print** → a dummy receipt prints and cuts cleanly (auto-cut), with the correct paper width.
- [ ] **Open Drawer (Kick)** → the cash drawer opens (if connected through the printer, pin 2).
- [ ] **Disconnect** → the connection is released, and the button returns to "Connect Printer".
- [ ] Complete a cash checkout with auto-print enabled → the receipt prints automatically and the drawer kick is triggered.
- [ ] Complete a non-cash checkout (QRIS/bank transfer) → auto-print works without triggering the drawer kick.
- [ ] Change paper size from 58mm to 80mm and back → receipt width adjusts accordingly (32 vs. 48 characters).
- [ ] In a non-Chromium browser (Firefox/Safari), the WebUSB button does not cause an error, and manual printing via `window.print()` still works.

## 3. Offline Sync

**Prerequisites:** POS is open, a cashier shift is active, and products are cached (open POS while online first).

- [ ] Disable the connection (DevTools offline mode / disconnect Wi-Fi) → the amber "Transaction saved offline" banner appears.
- [ ] Add a product to the cart **while offline** → the operation fails with a clear toast message (the cart is server-side).
- [ ] Check out with a cart that was already populated before going offline → the transaction enters the IndexedDB queue, and the "N transactions waiting to sync" indicator appears.
- [ ] Restore the connection → transactions are submitted automatically, with a success toast for each item.
- [ ] Refresh the POS page while the queue still contains items → the queue is flushed again when the page mounts.
- [ ] Queue item associated with a **closed shift** → syncing fails with the reason "Cashier shift is not open," and the item remains in the queue.
- [ ] Stock decreases according to the synchronized items; server-side prices are used, not client-side prices.
- [ ] Submit the same queue twice (double flush) → no duplicate transactions are created (idempotency via `client_uuid`).