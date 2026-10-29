import React from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";

const blankIngredient = () => ({
    product_id: "",
    unit_id: "",
    quantity: "1",
    wastage_percent: "0",
    purchase_price: "",
});

export default function ItemIngredients({
    ingredients,
    setIngredients,
    products,
    finishedProductId,
}) {
    const availableProducts = products.filter(
        (product) => String(product.id) !== String(finishedProductId || "")
    );

    const update = (index, key, value) => {
        const next = [...ingredients];
        next[index] = { ...next[index], [key]: value };
        if (key === "product_id") {
            const product = availableProducts.find((item) => String(item.id) === String(value));
            const unit = product?.units?.find((item) => item.pivot?.is_base) || product?.units?.[0];
            next[index].unit_id = unit?.id || "";
            next[index].purchase_price = product?.buy_price ?? "";
        }
        setIngredients(next);
    };

    return (
        <section className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/40 p-5 dark:border-primary-900/50 dark:bg-primary-950/20">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="font-semibold text-slate-900 dark:text-white">Ingredient Products</h2>
                    <p className="mt-1 text-xs text-slate-500">Attach stock products used to prepare this item.</p>
                </div>
                <button type="button" onClick={() => setIngredients([...ingredients, blankIngredient()])} className="inline-flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700">
                    <IconPlus size={15} /> Add ingredient
                </button>
            </div>
            {ingredients.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700">No ingredients attached yet.</p>
            ) : (
                <div className="space-y-3">
                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_110px_110px_36px]">
                            <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800" value={ingredient.product_id} onChange={(event) => update(index, "product_id", event.target.value)}>
                                <option value="">Select ingredient product</option>
                                {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.title}</option>)}
                            </select>
                            <input type="number" min="0.0001" step="any" className="h-10 rounded-lg border border-slate-200 px-3 text-sm dark:border-slate-700 dark:bg-slate-800" value={ingredient.quantity} onChange={(event) => update(index, "quantity", event.target.value)} placeholder="Qty" />
                            <select className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-800" value={ingredient.unit_id || ""} onChange={(event) => update(index, "unit_id", event.target.value)}>
                                <option value="">Unit</option>
                                {(products.find((product) => String(product.id) === String(ingredient.product_id))?.units || []).map((unit) => <option key={unit.id} value={unit.id}>{unit.symbol || unit.name}</option>)}
                            </select>
                            <button type="button" onClick={() => setIngredients(ingredients.filter((_, item) => item !== index))} className="inline-flex h-10 items-center justify-center rounded-lg text-danger-600 hover:bg-danger-50" aria-label="Remove ingredient"><IconTrash size={17} /></button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}