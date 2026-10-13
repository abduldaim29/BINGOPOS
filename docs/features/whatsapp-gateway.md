# WhatsApp Gateway

Automatically sends WhatsApp messages through CRM campaigns, receivable reminders, and invoice sharing.

## How It Works

```text
Laravel App ──HTTP──> whatsapp-service (Node.js) ──> WhatsApp Web
                              │
                       Puppeteer (headless Chrome)
```

- `whatsapp-service/` is an Express server running on port 3001 that uses `whatsapp-web.js`.
- The session is stored in the `session/` folder and persists across server restarts, so rescanning the QR code is not required after every restart.
- Laravel calls the Node.js service over HTTP (cURL) through `WhatsAppService.php`.

## Setup

```bash
cd whatsapp-service
npm install
npm start
# → Running on port 3001
```

## Settings Page

`Dashboard > Settings > WhatsApp`

| Feature | Function |
|-------|--------|
| Service URL | Node.js service address (default: `http://localhost:3001`) |
| Connect | Initializes the WhatsApp client and generates a QR code. |
| QR Scan | Scan using WhatsApp > Linked Devices > Link a Device. |
| Disconnect | Deletes the session and disconnects. |
| Auto Send | Automatically sends receivable reminders and invoices through campaigns. |
| Test Send | Sends a test message to a specified phone number. |

## Node.js Service Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/start` | POST | Initializes the WhatsApp client and starts QR code generation. |
| `/status` | GET | Returns `{connected, phone, qr, starting}`. |
| `/send` | POST | Sends a message using `{target, message}`. |
| `/disconnect` | POST | Deletes the session and disconnects. |

## Campaign Integration

In `CrmAutomationService@processCampaign()`:

- If the gateway is enabled (`wa_enabled=true`) and connected, it sends actual WhatsApp messages to each customer.
- Updates the log status to `sent` after a successful send.
- Falls back to a `wa.me` link if the gateway is unavailable.

## Permissions

- `whatsapp-settings-access` — View the settings page.
- `whatsapp-settings-update` — Change configuration and connect/disconnect.

## Technical Notes

- Requires Chrome/Chromium on the server (used internally by Puppeteer).
- Sessions persist through `LocalAuth`, so rescanning is not required after every restart.
- **Rate limits:** WhatsApp Web has sending limits. Avoid sending more than 100 messages consecutively.
- **Terms of Service:** `whatsapp-web.js` uses WhatsApp Web unofficially.
- **Production deployment:** Run with PM2:

```bash
pm2 start whatsapp-service/server.js --name wa-service
```