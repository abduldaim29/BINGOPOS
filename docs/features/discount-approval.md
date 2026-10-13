# Discount Approval

Discount approval controls discounts that exceed policy limits before checkout is completed.

## Workflow

1. Cashier creates a discount request on the transaction.
2. System saves status `pending` and discount details.
3. User with approval permission reviews the request.
4. Request can be `approved` or `rejected` with notes.
5. Checkout only uses discounts that have been approved.

## Audit and Permission

Approval saves status changes and actor on audit log. Cashier and approver access is separated through discount approval permission.

## Central Files

- `app/Http/Controllers/Apps/DiscountApprovalController.php`
- `app/Models/DiscountApprovalLog.php`
- `docs/features/pos-transactions.md`
