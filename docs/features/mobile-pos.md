# Mobile POS / PWA

Back to the documentation index: `docs/README.md`

## Purpose

Access the POS from a tablet or mobile phone with camera-based barcode scanning, home screen installation, and fullscreen mode.

## Current Features

### Camera Barcode Scanner

- Library: `html5-qrcode`
- Scan barcodes using the rear-facing camera (`environment-facing`).
- Automatically search for products after scanning.
- Fullscreen scanner modal — open the camera, scan, and close automatically.
- Camera button in the POS search bar.

### Progressive Web App (PWA)

- `manifest.json` — name, icons, standalone display mode, and theme color.
- `sw.js` — service worker for caching assets and master data API responses.
- Theme-color meta tag.
- Home screen installation prompt (Android Chrome).
- Offline support (cache-first strategy for master data).
- Offline checkout: prepared transactions are queued in IndexedDB (`pending_transactions`) and automatically synchronized when the connection is restored (`Utils/offlineDb.js`, endpoint `POST /api/v1/pos/transactions/sync`).
- Adding new products to the cart while offline remains limited because the main cart is server-based.

### Fullscreen Mode

- Fullscreen button in the POS header.
- Hide browser chrome.
- Toggle between entering and exiting fullscreen mode.

### Touch Optimization

- All interactive elements use `min-h-touch` (44px) and `min-w-touch`.
- Safe spacing between buttons.
- Responsive layout for landscape tablets.

## Related Files

| File | Function |
|------|----------|
| `resources/js/Components/POS/BarcodeScanner.jsx` | Camera scanner component |
| `public/manifest.json` | PWA manifest |
| `public/sw.js` | Service worker |
| `resources/js/app.jsx` | Service worker registration |
| `resources/js/Layouts/POSLayout.jsx` | Fullscreen toggle |
| `resources/js/Context/OnlineStatusContext.jsx` | Online/offline detection |

## How to Use

### Barcode Scanner

1. Click the camera icon in the POS search bar.
2. Allow camera access.
3. Point the camera at the product barcode.
4. The scanner automatically searches for the product and closes.

### PWA Installation

1. Open the application in Chrome on Android.
2. Wait for the "Add to Home Screen" prompt.
3. Install the application — it opens without browser chrome.

### Fullscreen

1. Click the fullscreen icon in the POS header.
2. The browser enters fullscreen mode.
3. Click the icon again to exit.