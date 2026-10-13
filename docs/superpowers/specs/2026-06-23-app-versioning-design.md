# App Versioning

A single source of truth for the application version, displayed in the UI.

## Source of Truth

- `.env`: `APP_VERSION=v1.0.0`
- `config/app.php`: `'version' => env('APP_VERSION', 'v1.0.0')`
- Updated manually with each release to match the Git tag.

## Backend

- `HandleInertiaRequests.php` shares `appVersion` through Inertia shared props.

## Frontend Display

- **Sidebar** (`DashboardLayout`): Replace the hardcoded `v1.0.0` with `{appVersion}`.
- **POSLayout**: Display a small `v1.0.0` label in the right area of the navbar.

## Files Changed

1. `.env.example` — Add `APP_VERSION=v1.0.0`.
2. `config/app.php` — Add the `'version'` key.
3. `HandleInertiaRequests.php` — Add `appVersion` to shared props.
4. `Sidebar.jsx` — Use the prop.
5. `POSLayout.jsx` — Display the version in the navbar.