import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

const money = (value) =>
    `Rs ${Number(value || 0).toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const getUnitCost = (product, unitId) => {
    const units = product?.units || [];
    const unit = units.find((item) => Number(item.id) === Number(unitId));
    const unitPrice = unit?.pivot?.buy_price;
    if (unitPrice !== null && unitPrice !== undefined && unitPrice !== "") {
        return Number(unitPrice);
    }

    const baseUnit = units.find((item) => item.pivot?.is_base);
    const baseFactor = Number(baseUnit?.pivot?.conversion_factor || 1);
    const selectedFactor = Number(unit?.pivot?.conversion_factor || 1);
    const baseCost =
        product?.recipe_base_purchase_cost ?? product?.buy_price ?? 0;
    return Number(baseCost) * (selectedFactor / baseFactor);
};

export default function VariationRecipeEditor({ variations, products, value = {} }) {
    const { t } = useTranslation();
    const productsById = useMemo(
        () => new Map((products || []).map((product) => [Number(product.id), product])),
        [products]
    );

    if (!variations?.length) return null;

    const recipeCost = (recipe = {}) => {
        const ingredientCost = (recipe.ingredients || []).reduce((total, row) => {
            const quantity = Number(row.quantity || 0);
            const wastage = Number(row.wastage_percent || 0);
            const product = productsById.get(Number(row.product_id));
            const unitCost =
                row.purchase_price !== "" &&
                row.purchase_price !== null &&
                row.purchase_price !== undefined
                    ? Number(row.purchase_price)
                    : getUnitCost(product, row.unit_id);

            return total + (quantity * unitCost) / Math.max(0.000001, 1 - wastage / 100);
        }, 0);
        const extraCost =
            Number(recipe.packaging_cost || 0) +
            Number(recipe.labour_cost || 0) +
            Number(recipe.overhead_cost || 0);

        return (ingredientCost + extraCost) /
            Math.max(0.0001, Number(recipe.batch_yield || 1));
    };

    return (
        <section className="mt-5 space-y-2 rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-900 dark:bg-primary-950/20">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                {t("variationRecipes.title")}
            </h3>
            {variations.map((variation) => {
                const recipe = value[variation.id];
                const hasRecipe = (recipe?.ingredients || []).length > 0;

                return (
                    <div
                        key={variation.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    >
                        <span className="font-medium text-slate-800 dark:text-white">
                            {variation.name}
                            {variation.size ? ` — ${variation.size}` : ""}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                            {t("variationRecipes.recipeCost")}:{" "}
                            <strong className="text-slate-900 dark:text-white">
                                {hasRecipe ? money(recipeCost(recipe)) : "—"}
                            </strong>
                        </span>
                    </div>
                );
            })}
        </section>
    );
}
