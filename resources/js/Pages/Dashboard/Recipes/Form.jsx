import React, { useEffect, useMemo, useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import { IconArrowLeft, IconPlus, IconTrash, IconCopy, IconGripVertical } from "@tabler/icons-react";

const money = (value) => `Rs ${Number(value || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const blankIngredient = () => ({
    ingredient_name: "",
    unit_id: "",
    quantity: "",
    wastage_percent: "0",
    purchase_price: "",
});

export default function Form({ recipe, units, productSearchUrl, mode = "create" }) {
    const [productQuery, setProductQuery] = useState("");
    const [productResults, setProductResults] = useState([]);
    const initialIngredients = recipe?.ingredients?.map((row) => ({
        ...row,
        ingredient_name: row.ingredient_name || row.product?.title || "",
        quantity: row.quantity ?? "",
        wastage_percent: row.wastage_percent ?? "0",
        purchase_price: row.purchase_price ?? "",
        unit_id: row.unit_id ?? "",
    })) || [];
    const form = useForm({
        product_id: recipe?.product_id || "",
        product: recipe?.product || null,
        name: recipe?.name || "",
        recipe_type: recipe?.recipe_type || "standard",
        batch_yield: recipe?.batch_yield || "1",
        yield_unit_id: recipe?.yield_unit_id || "",
        packaging_cost: recipe?.packaging_cost || "0",
        labour_cost: recipe?.labour_cost || "0",
        overhead_cost: recipe?.overhead_cost || "0",
        notes: recipe?.notes || "",
        status: recipe?.status || "draft",
        ingredients: initialIngredients,
        steps: recipe?.steps || [],
    });

    useEffect(() => {
        if (!productQuery.trim()) {
            setProductResults([]);
            return undefined;
        }
        const timer = setTimeout(async () => {
            const response = await fetch(`${productSearchUrl}?search=${encodeURIComponent(productQuery)}`);
            if (response.ok) setProductResults((await response.json()).data || []);
        }, 300);
        return () => clearTimeout(timer);
    }, [productQuery, productSearchUrl]);

    const chooseFinishedProduct = (product) => {
        form.setData("product_id", product.id);
        form.setData("product", product);
        setProductQuery("");
        setProductResults([]);
    };

    const updateIngredient = (index, key, value) => {
        const ingredients = [...form.data.ingredients];
        ingredients[index] = { ...ingredients[index], [key]: value };
        form.setData("ingredients", ingredients);
    };

    const addIngredient = () => form.setData("ingredients", [...form.data.ingredients, blankIngredient()]);
    const removeIngredient = (index) => form.setData("ingredients", form.data.ingredients.filter((_, item) => item !== index));
    const duplicateIngredient = (index) => form.setData("ingredients", [...form.data.ingredients, { ...form.data.ingredients[index] }]);
    const addStep = () => form.setData("steps", [...form.data.steps, { title: "", instructions: "", duration_minutes: "", temperature: "", temperature_unit: "C", equipment: "" }]);
    const updateStep = (index, key, value) => form.setData("steps", form.data.steps.map((step, item) => item === index ? { ...step, [key]: value } : step));

    const summary = useMemo(() => {
        const ingredientCost = form.data.ingredients.reduce((total, item) => {
            const quantity = Number(item.quantity || 0);
            const wastage = Number(item.wastage_percent || 0);
            const gross = quantity / Math.max(0.000001, 1 - wastage / 100);
            return total + gross * Number(item.purchase_price || 0);
        }, 0);
        const total = ingredientCost + Number(form.data.packaging_cost || 0) + Number(form.data.labour_cost || 0) + Number(form.data.overhead_cost || 0);
        return { ingredientCost, total, perYield: total / Math.max(0.0001, Number(form.data.batch_yield || 1)) };
    }, [form.data]);

    const submit = (event) => {
        event.preventDefault();
        const payload = {
            ...form.data,
            product: undefined,
            ingredients: form.data.ingredients,
        };
        form.transform(() => payload);
        if (mode === "edit") {
            form.put(route("recipes.update", recipe.id), { preserveScroll: true });
        } else {
            form.post(route("recipes.store"), { preserveScroll: true });
        }
    };

    return (
        <>
            <Head title={mode === "edit" ? "Edit Recipe" : "Create Recipe"} />
            <div className="mb-6">
                <Link href={route("recipes.index")} className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600"><IconArrowLeft size={16} /> Back to Recipes</Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{mode === "edit" ? "Edit Recipe" : "Create Recipe"}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage ingredients, purchase costs, preparation steps, and recipe profitability.</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Recipe Details</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <label className="lg:col-span-2"><span className="label">Recipe Name</span><input className="field" value={form.data.name} onChange={(e) => form.setData("name", e.target.value)} placeholder="Beef Cheese Burger Recipe" />{form.errors.name && <span className="error">{form.errors.name}</span>}</label>
                        <label><span className="label">Recipe Type</span><select className="field" value={form.data.recipe_type} onChange={(e) => form.setData("recipe_type", e.target.value)}><option value="standard">Standard Recipe</option><option value="batch">Batch Preparation</option><option value="variation">Variation-Specific Recipe</option></select></label>
                        <label><span className="label">Status</span><select className="field" value={form.data.status} onChange={(e) => form.setData("status", e.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                        <div className="relative lg:col-span-2"><span className="label">Finished Product</span>{form.data.product ? <div className="field flex items-center justify-between"><span>{form.data.product.title} <small className="text-slate-500">{form.data.product.sku || form.data.product.barcode || ""}</small></span><button type="button" className="text-xs text-primary-600" onClick={() => form.setData("product", null)}>Change</button></div> : <><input className="field" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search product by name, SKU, or barcode" />{productResults.length > 0 && <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">{productResults.map((product) => <button type="button" key={product.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => chooseFinishedProduct(product)}>{product.title} <span className="text-xs text-slate-500">{product.sku || product.barcode || ""}</span></button>)}</div>}</>}{form.errors.product_id && <span className="error">{form.errors.product_id}</span>}</div>
                        <label><span className="label">Batch Yield</span><input type="number" min="0.0001" step="0.0001" className="field" value={form.data.batch_yield} onChange={(e) => form.setData("batch_yield", e.target.value)} /></label>
                        <label><span className="label">Yield Unit</span><select className="field" value={form.data.yield_unit_id} onChange={(e) => form.setData("yield_unit_id", e.target.value)}><option value="">Serving / unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} {unit.symbol ? `(${unit.symbol})` : ""}</option>)}</select></label>
                        <label><span className="label">Packaging Cost (PKR)</span><input type="number" min="0" step="0.01" className="field" value={form.data.packaging_cost} onChange={(e) => form.setData("packaging_cost", e.target.value)} /></label>
                        <label><span className="label">Labour Cost (PKR)</span><input type="number" min="0" step="0.01" className="field" value={form.data.labour_cost} onChange={(e) => form.setData("labour_cost", e.target.value)} /></label>
                        <label><span className="label">Overhead Cost (PKR)</span><input type="number" min="0" step="0.01" className="field" value={form.data.overhead_cost} onChange={(e) => form.setData("overhead_cost", e.target.value)} /></label>
                        <label className="md:col-span-2 lg:col-span-4"><span className="label">Notes</span><textarea className="field min-h-20" value={form.data.notes} onChange={(e) => form.setData("notes", e.target.value)} placeholder="Preparation or handling notes" /></label>
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ingredients Builder</h2><p className="text-sm text-slate-500">Purchase tax is shown as unavailable when the current purchasing records do not provide a reliable source.</p></div><button type="button" onClick={addIngredient} className="button-primary"><IconPlus size={16} /> Add Ingredient</button></div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full min-w-[980px] text-sm">
                            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/70 dark:text-slate-400">
                                <tr>
                                    <th className="px-3 py-3 font-semibold">Ingredient Product</th>
                                    <th className="w-32 px-3 py-3 font-semibold">Unit value</th>
                                    <th className="w-40 px-3 py-3 font-semibold">Recipe Unit</th>
                                    <th className="w-32 px-3 py-3 font-semibold">Wastage %</th>
                                    <th className="w-44 px-3 py-3 font-semibold">Purchase Price (PKR)</th>
                                    <th className="w-36 px-3 py-3 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {form.data.ingredients.map((item, index) => <tr key={index} className="align-top">
                                    <td className="px-3 py-3"><input type="text" className="field" value={item.ingredient_name} onChange={(e) => updateIngredient(index, "ingredient_name", e.target.value)} placeholder="Ingredient name" /></td>
                                    <td className="px-3 py-3"><input type="number" min="0.000001" step="0.000001" className="field" value={item.quantity} onChange={(e) => updateIngredient(index, "quantity", e.target.value)} placeholder="Qty" /></td>
                                    <td className="px-3 py-3"><select className="field" value={item.unit_id} onChange={(e) => updateIngredient(index, "unit_id", e.target.value)}><option value="">Base unit</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} {unit.symbol ? `(${unit.symbol})` : ""}</option>)}</select></td>
                                    <td className="px-3 py-3"><input type="number" min="0" max="99.99" step="0.01" className="field" value={item.wastage_percent} onChange={(e) => updateIngredient(index, "wastage_percent", e.target.value)} /></td>
                                    <td className="px-3 py-3"><input type="number" min="0" step="0.01" className="field" value={item.purchase_price} onChange={(e) => updateIngredient(index, "purchase_price", e.target.value)} placeholder="Enter cost" /><p className="mt-1 text-[11px] text-slate-500">Required for costing</p></td>
                                    <td className="px-3 py-3"><div className="flex justify-end gap-3 pt-2"><button type="button" className="text-sm text-slate-500 hover:text-primary-600" onClick={() => duplicateIngredient(index)} title="Duplicate ingredient"><IconCopy size={15} /></button><button type="button" className="text-sm text-red-600" onClick={() => removeIngredient(index)} title="Remove ingredient"><IconTrash size={15} /></button></div></td>
                                </tr>)}
                            </tbody>
                        </table>
                        {form.data.ingredients.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Add an ingredient to calculate recipe cost.</p>}
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900 dark:text-white">Preparation Steps</h2><p className="text-sm text-slate-500">Add clear instructions for consistent preparation.</p></div><button type="button" onClick={addStep} className="button-secondary"><IconPlus size={16} /> Add Step</button></div>
                    <div className="space-y-3">{form.data.steps.map((step, index) => <div key={index} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-12 dark:border-slate-700"><div className="flex items-center text-slate-400"><IconGripVertical size={18} /><span className="ml-1 text-xs">{index + 1}</span></div><input className="field md:col-span-3" placeholder="Step title" value={step.title} onChange={(e) => updateStep(index, "title", e.target.value)} /><textarea className="field md:col-span-4" placeholder="Preparation instructions" value={step.instructions} onChange={(e) => updateStep(index, "instructions", e.target.value)} /><input className="field md:col-span-1" type="number" min="0" placeholder="Min" value={step.duration_minutes || ""} onChange={(e) => updateStep(index, "duration_minutes", e.target.value)} /><input className="field md:col-span-1" type="number" placeholder="Temp" value={step.temperature || ""} onChange={(e) => updateStep(index, "temperature", e.target.value)} /><input className="field md:col-span-2" placeholder="Equipment" value={step.equipment || ""} onChange={(e) => updateStep(index, "equipment", e.target.value)} /><button type="button" className="text-red-600" onClick={() => form.setData("steps", form.data.steps.filter((_, item) => item !== index))}><IconTrash size={18} /></button></div>)}</div>
                </section>

                <section className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5 dark:border-primary-900/50 dark:bg-primary-950/20">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Cost Summary</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4"><div><span className="summary-label">Ingredients</span><strong>{form.data.ingredients.length}</strong></div><div><span className="summary-label">Ingredient Cost</span><strong>{money(summary.ingredientCost)}</strong></div><div><span className="summary-label">Batch Cost</span><strong>{money(summary.total)}</strong></div><div><span className="summary-label">Cost per Yield</span><strong>{money(summary.perYield)}</strong></div></div><p className="mt-4 text-xs text-slate-500">Estimated costing only. Purchase tax is not available in the current purchase records, so no tax is assumed or double-counted.</p>
                </section>

                <div className="flex justify-end gap-3"><Link href={route("recipes.index")} className="button-secondary">Cancel</Link><button type="submit" disabled={form.processing} className="button-primary">{form.processing ? "Saving..." : mode === "edit" ? "Save Changes" : "Save Recipe"}</button></div>
            </form>
            <style>{`.label{display:block;margin-bottom:.375rem;font-size:.75rem;font-weight:600;color:#475569}.dark .label{color:#94a3b8}.field{width:100%;border-radius:.75rem;border:1px solid #cbd5e1;background:white;padding:.625rem .75rem;font-size:.875rem;color:#1e293b;outline:none}.dark .field{border-color:#475569;background:#0f172a;color:#e2e8f0}.field:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgb(99 102 241 / .2)}.error{display:block;margin-top:.25rem;font-size:.75rem;color:#dc2626}.button-primary,.button-secondary{display:inline-flex;align-items:center;gap:.4rem;border-radius:.75rem;padding:.65rem 1rem;font-size:.875rem;font-weight:600}.button-primary{background:#4f46e5;color:white}.button-secondary{border:1px solid #cbd5e1;color:#475569}.summary-label{display:block;font-size:.75rem;color:#64748b}.summary-label+strong{display:block;margin-top:.25rem;font-size:1.05rem;color:#0f172a}.dark .summary-label+strong{color:#f8fafc}`}</style>
        </>
    );
}

Form.layout = (page) => <DashboardLayout children={page} />;
