# RBAC, Users, Roles

Back to the documentation index: `docs/README.md`

## Purpose

Managing access control based on roles and permissions for all dashboard modules.

## Current Features

- User management
- Role management
- Permission list
- Route protection with permission middleware
- permission map shared to frontend via Inertia

## Pages and Routes

- `dashboard/users`
- `dashboard/roles`
- `dashboard/permissions`

## Common Permissions

Each module uses its own permissions, for example:

- `transactions-access`
- `sales-returns-*`
- `stock-opnames-*`
- `cashier-shifts-*`
- `audit-logs-access`

## Authorization Workflow

1. Permissions are seeded in `PermissionSeeder`
2. Roles are defined in `RoleSeeder`
3. The admin user is created through the first-install setup wizard at `/setup`
4. Routes use the `permission:*` middleware
5. frontend reads the permission map from `HandleInertiaRequests`

## Super Admin Notes

- The user `super-admin` receives the role `super-admin`
- The backend treats the role `super-admin` as a consistent permission bypass for `can`, `canAny`, and the Spatie middleware
- `UserSeeder` is only used for demo/test data, not by `DatabaseSeeder`
- The Spatie permission cache must be reset during seeding to ensure new permissions are consistently recognized
- The old role `permission-access` is normalized to `permissions-access` during seeding to avoid ambiguous RBAC naming

## Frontend Integration

Frontend reads:

- `auth.permissions`
- `auth.super`

This is used to display or hide specific menus and actions.

Main frontend helpers:

- `resources/js/Utils/authorization.js`
- `resources/js/Utils/Permission.jsx`

## Current Limitations

- The backend remains the primary source of truth
- The frontend is only for UI gating, not final security

## Central Files

- `database/seeders/PermissionSeeder.php`
- `database/seeders/RoleSeeder.php`
- `database/seeders/UserSeeder.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `resources/js/Utils/Menu.jsx`
