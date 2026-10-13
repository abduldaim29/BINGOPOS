# Offline Mode

Offline mode helps cashiers complete prepared checkouts when the connection is temporarily lost. This feature is not a full POS mode that operates without a server.

## Behavior

- Selected master data is available through the PWA cache-first strategy.
- Checkout transactions are added to the IndexedDB `pending_transactions` queue when offline.
- The queue is sent to `POST /api/v1/pos/transactions/sync` when the connection is restored.
- `client_uuid` ensures synchronization remains idempotent.
- The server remains the source of truth for pricing and final validation.

## Limitations

- The main cart is server-based, so adding new products while offline is limited.
- Stock conflicts or price changes are resolved through server validation when the queue is flushed.

## Related Files

- `resources/js/Utils/offlineDb.js`
- `app/Http/Controllers/Api/PosApiController.php`
- `docs/testing-manual.md`