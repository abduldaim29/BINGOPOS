## Audit Logs

Return to the documentation index: `docs/README.md`

## Purpose

Provide audit trail for important changes in sensitive modules so developers and admins can trace changes.

## Current Features

- list audit log
- filter by user, module, event, date, and keyword
- detail audit log
- before / after payload
- meta data
- ip address and user agent

## Pages and Routes

- `dashboard/audit-logs`
- `audit-logs.show`

## Permission

- `audit-logs-access`

## Integrated Modules

Currently audit log is used on several important actions such as:

- payment settings update
- cashier shift open / close / force close
- sales return create / update / complete
- transaction payment confirmation
- and other admin modules that call `AuditLogService`

## Data Integration

- `audit_logs`
- relation to `users`
- polymorphic relation to the audited model when available

## Important Business Implications

- audit log is not a replacement for authorization
- audit log helps analyze changes, especially on configuration, transactions, and inventory-adjacent flow

## Current Limitations

- event coverage depends on controller/service that explicitly calls `AuditLogService`
- not all CRUD operations are automatically logged

## Central Files

- `app/Http/Controllers/Apps/AuditLogController.php`
- `app/Services/AuditLogService.php`
