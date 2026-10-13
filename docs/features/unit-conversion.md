# Unit Conversion (Multi-Unit)

Back to the documentation index: `docs/README.md`

## Purpose

Allows a single product to be sold in multiple units—such as pieces, boxes, cartons, and kilograms—with automatic stock conversion and different prices for each unit.

## Definitions

| Term | Meaning |
|---------|------|
| Base Unit | The primary unit used for inventory. All stock quantities are stored in the base unit. |
| Conversion Factor | The conversion factor to the base unit (e.g., 1 box = 12 pieces). |

## Current Features

- Eight default units: PCS, BOX, CARTON, KG, LITER, METER, PACK, and DUS.
- Products can have multiple units with different conversion factors.
- Different purchase and selling prices for each unit.
- A designated base unit for inventory.
- Unit-specific barcodes.
- POS checkout uses base-unit quantities to check stock availability.
- Inventory is managed in base units and automatically converted during checkout.

## Database

- `units` table — unit master data (`code`, `name`, `symbol`).
- `product_units` pivot table — (`product_id`, `unit_id`, `is_base`, `conversion_factor`, `buy_price`, `sell_price`, `barcode`).
- `carts` — `unit_id` + `conversion_factor`.
- `transaction_details` — `unit_id` + `conversion_factor`.

## Service

`UnitConversionService` methods:

| Method | Function |
|--------|--------|
| `toBaseUnit(product, unitId, qty)` | Converts a quantity from a specified unit to the base unit. |
| `fromBaseUnit(product, unitId, baseQty)` | Converts base-unit stock into a quantity in the specified unit. |
| `getPrice(product, unitId, type)` | Gets the price for a specified unit (buy/sell). |
| `getUnitLabel(product, unitId)` | Gets the unit label for display. |

## Workflow

1. **Admin:** Configure the base unit and additional units for each product using a database seeder or direct database insertion.
2. **POS:** Products with multiple units display a unit-selection dropdown, and the price updates automatically.
3. **Checkout:** Quantities are converted to base units for stock validation and deduction.
4. **Stock mutations:** All inventory mutations are recorded in base units.

## Notes

- Existing products are assumed to use PCS as the base unit, with a conversion factor of `1`.
- A unit cannot be deleted while it is still assigned to a product.
- Unit-specific prices are stored in the pivot table rather than calculated from the base price multiplied by the conversion factor.