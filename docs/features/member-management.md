# Member Management

Back to the documentation index: `docs/README.md`

## Purpose

Provide a complete member module built on top of `customers` and `loyalty`, without creating a separate entity apart from the core customer.

## Current Features

- List new members from the dashboard
- Quick member list from POS
- Upgrade regular customers to members
- Search members by name and member number
- Active/inactive member status without deleting history
- Transaction history, points, vouchers, and member segment
- Integration of member benefits with pricing rules, loyalty points, and customer vouchers

## Pages and Routes

- `dashboard/members`
- `members.index`
- `members.create`
- `members.store`
- `members.show`
- `members.edit`
- `members.update`
- `customers.upgrade-member`
- `customers.storeAjax`

## Permissions

This module reuses the existing customer permissions:

- `customers-access`
- `customers-create`
- `customers-edit`
- `customers-delete`

## User Workflow

1. Admin registers members from the dashboard or POS
2. The system automatically issues a `member_code` if the customer doesn't have one
3. Members can receive benefits such as pricing, vouchers, and earn/redeem points
4. If benefits need to be discontinued, members can simply be deactivated without deleting the customer and history

## Data Integration

- `customers`
- `transactions`
- `loyalty_point_histories`
- `customer_vouchers`
- `pricing_rules`

## Operational Notes

- Inactive member status retains member number and history so audit and CRM history are not lost
- POS customer picker supports searching by `name`, `phone`, and `member_code`
- Upgrading a member from POS only changes the loyalty status, not creating a new customer

## Central Files

- `app/Http/Controllers/Apps/MemberController.php`
- `app/Http/Controllers/Apps/CustomerController.php`
- `resources/js/Pages/Dashboard/Members`
- `resources/js/Components/POS/CustomerSelect.jsx`
- `resources/js/Components/POS/AddCustomerModal.jsx`
