# Promotions & Loyalty

Back to the documentation index: `docs/README.md`

## Purpose

A promotion and loyalty engine designed to increase sales and customer retention.

## Current Features

### Pricing Rules (Promotion Engine)

- **Standard Discount** — percentage or fixed-amount discounts per product or category.
- **Quantity Break** — special pricing for purchases of specified quantities (tiered pricing).
- **Bundle Price** — special pricing for product bundles.
- **Buy X Get Y** — purchase a specific product to receive another product at a special price.
- **Customer Scope** — promotions can be restricted to all customers, walk-in customers, registered customers, members, or specific tiers.
- **Schedule** — promotions can be scheduled with start and end dates.
- **Preview** — view the impact of a promotion before checkout.

### Customer Vouchers

- Customer-specific vouchers with unique codes.
- Minimum order requirements and validity periods.
- Vouchers can be redeemed at checkout.

### Loyalty Program

- **Tiers:** Regular → Silver → Gold → Platinum.
- **Points:** Earn points per transaction and redeem them for discounts.
- **Automatic Tier Sync:** Tiers are automatically upgraded based on total spending.
- **Settings:** Enable/disable earning and redemption, configure earning rates, and set point values.

### Multi-Price Lists

- Special pricing for customer groups (all, walk-in, registered, and member).
- Priority: the matching price list with the highest priority is applied.
- Product-specific prices within each price list.

## Database

- `pricing_rules` + `pricing_rule_qty_breaks` + `pricing_rule_bundle_items` + `pricing_rule_buy_get_items`
- `customer_vouchers` (per customer)
- `loyalty_point_histories` (earning and redemption history)
- `price_lists` + `price_list_items`

## Pages and Routes

| Route | Module |
|-------|--------|
| `pricing-rules.index` | Pricing Rules (CRUD) |
| `pricing-rules.preview` | Promotion preview |
| `customer-vouchers.*` | Customer vouchers |
| `price-lists.index` | Price lists (settings) |
| `price-lists.show` | Price list details and price editing |
| `settings.loyalty` | Loyalty settings |

## Pricing Workflow at Checkout

1. Cart items are evaluated by `PricingService` against all active rules.
2. Rules are sorted by priority and matched against the customer scope.
3. Discounts are allocated per item, producing the subtotal after promotions.
4. Vouchers are validated and loyalty point redemption is calculated.
5. VAT is added to determine the final grand total.

## Notes

- Pricing rules can overlap; rules with higher priority take precedence.
- Quantity breaks apply tiered prices based on the quantity purchased for a specific product.
- Bundles offer special prices for predefined product sets.
- Buy X Get Y allows customers to purchase item A and receive a discount on item B.