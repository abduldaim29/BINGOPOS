# WhatsApp Gateway via whatsapp-web.js

Native WhatsApp integration using `whatsapp-web.js`. Users scan a QR code from the Settings page, and messages are sent automatically through campaigns.

## Architecture

```text
Laravel App ←→ Node.js Service (whatsapp-service/) ←→ WhatsApp Web (via Puppeteer)
```

- **Node.js service:** Express server at `localhost:3001` that manages WhatsApp sessions.
- **Laravel:** `WhatsAppService.php` provides a cURL wrapper for the Node.js service, called by Campaign and Settings modules.
- **React:** Settings page with a QR code scanner and connection status.

## Node.js Service (`whatsapp-service/`)

Four endpoints:

| Endpoint | Method | Function |
|----------|--------|----------|
| `/start` | POST | Initializes or starts the WhatsApp client, reusing an existing session if available. |
| `/status` | GET | Returns `{connected, phone, qr}`. |
| `/send` | POST | Sends `{target, message}`. |
| `/disconnect` | POST | Deletes the session and disconnects. |

Session persistence is handled by `LocalAuth`, which stores session data in the `session/` folder.

## Laravel Backend

### `WhatsAppService.php`

- `start(): array` — Calls `POST /start`.
- `status(): array` — Calls `GET /status`.
- `send(string $target, string $message): bool` — Calls `POST /send`.
- `disconnect(): bool` — Calls `POST /disconnect`.
- `isAvailable(): bool` — Checks whether `WA_SERVICE_URL` is configured.

### `SettingController` — Additional Methods

- `whatsapp()` — Renders the settings page with device status and QR code.
- `updateWhatsapp()` — Saves preferences, including the auto-send toggle.
- `testWhatsapp()` — Sends a test message to the owner's phone number.

### `CrmAutomationService`

- In `processCampaign()`, sends actual WhatsApp messages through the Node.js service when WhatsApp is available.
- Updates the `CustomerCampaignLog` status to `sent` after a successful send.
- Falls back to a `wa.me` link if sending fails.

## Routes

```text
GET  /settings/whatsapp            → whatsapp
POST /settings/whatsapp            → updateWhatsapp
POST /settings/whatsapp/test       → testWhatsapp
POST /settings/whatsapp/disconnect → disconnect (calls Node.js)
```

## Permissions

- `whatsapp-settings-access`
- `whatsapp-settings-update`

## Files

- `whatsapp-service/package.json`
- `whatsapp-service/server.js`
- `whatsapp-service/.gitignore`
- `app/Services/WhatsAppService.php`
- `resources/js/Pages/Dashboard/Settings/Whatsapp.jsx`
- `routes/web.php` (modified)
- `database/seeders/PermissionSeeder.php` (modified)
- `app/Services/CrmAutomationService.php` (modified)