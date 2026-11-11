import React, { useEffect, useMemo, useState } from "react";
import { Link, useForm } from "@inertiajs/react";
import axios from "axios";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head } from "@inertiajs/react";
import { IconArrowLeft, IconPlus, IconTrash, IconCopy, IconGripVertical, IconUpload, IconDownload, IconFileSpreadsheet } from "@tabler/icons-react";

const money = (value) => `Rs ${Number(value || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const blankIngredient = () => ({
    ingredient_name: "",
    unit_id: "",
    quantity: "",
    wastage_percent: "0",
    purchase_price: "",
});

const variationLabel = (variationId) =>
    String(variationId || "")
        .replace(/^[a-z]+_/, "")
        .replace(/_/g, " ");

export default function Form({ recipe, units, productSearchUrl, mode = "create" }) {
    const [productQuery, setProductQuery] = useState("");
    const [productResults, setProductResults] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    const [importMessage, setImportMessage] = useState("");
    const [importError, setImportError] = useState("");
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
        variation_id: recipe?.variation_id || "",
        variation_name: recipe?.variation_name || "",
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
        form.setData("variation_id", "");
        form.setData("variation_name", "");
        setProductQuery("");
        setProductResults([]);
    };

    const clearFinishedProduct = () => {
        form.setData("product_id", "");
        form.setData("product", null);
        form.setData("variation_id", "");
        form.setData("variation_name", "");
    };

    const setRecipeType = (recipeType) => {
        form.setData("recipe_type", recipeType);
        if (recipeType !== "variation") {
            form.setData("variation_id", "");
            form.setData("variation_name", "");
        }
    };

    const importRecipeFile = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const hasExistingData =
            form.data.name ||
            form.data.product_id ||
            form.data.ingredients.some((item) => item.ingredient_name) ||
            form.data.steps.some((step) => step.title || step.instructions);
        if (hasExistingData && !window.confirm("Importing a file will replace the recipe fields currently entered. Continue?")) {
            event.target.value = "";
            return;
        }

        setIsImporting(true);
        setImportMessage("");
        setImportError("");
        const payload = new FormData();
        payload.append("file", file);

        try {
            const response = await axios.post(route("recipes.import-preview"), payload, {
                headers: { Accept: "application/json" },
            });
            form.setData({ ...form.data, ...response.data.data });
            setImportMessage(
                `Loaded ${response.data.counts.ingredients} ingredient(s) and ${response.data.counts.steps} preparation step(s). Review the form and save when ready.`
            );
        } catch (error) {
            const validationErrors = error.response?.data?.errors;
            setImportError(
                validationErrors?.file?.[0] ||
                    Object.values(validationErrors || {})[0]?.[0] ||
                    error.response?.data?.message ||
                    "Could not read this file. Check its format and try the recipe template."
            );
        } finally {
            setIsImporting(false);
            event.target.value = "";
        }
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

            {mode === "create" && (
                <section className="mb-6 rounded-2xl border border-primary-200 bg-primary-50/60 p-4 dark:border-primary-900/60 dark:bg-primary-950/20">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                        <div className="flex items-start gap-3">
                            <span className="rounded-xl bg-white p-2.5 text-primary-600 shadow-sm dark:bg-slate-900">
                                <IconFileSpreadsheet size={22} />
                            </span>
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">
                                    Import recipe from CSV or Excel
                                </h2>
                                <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                                    Upload a recipe file to fill in the form. Nothing is saved until you review and click Save Recipe.
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Add rows with record_type <strong>recipe</strong>, <strong>ingredient</strong>, or <strong>step</strong>. The recipe row needs the recipe name and an existing product name, SKU, or barcode.
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    For a variation recipe, use the parent product and fill variation_id (for example pizza_jumbo), or use a finished_product value such as Product Name - Jumbo (16-18 inch). The imported variation is selected automatically.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={route("recipes.template", { format: "xlsx" })}
                                className="button-secondary"
                            >
                                <IconDownload size={16} /> Excel template
                            </a>
                            <a
                                href={route("recipes.template", { format: "csv" })}
                                className="button-secondary"
                            >
                                <IconDownload size={16} /> CSV template
                            </a>
                            <label className={`button-primary cursor-pointer ${isImporting ? "pointer-events-none opacity-60" : ""}`}>
                                <IconUpload size={16} />
                                {isImporting ? "Reading file..." : "Choose file"}
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    className="sr-only"
                                    disabled={isImporting}
                                    onChange={importRecipeFile}
                                />
                            </label>
                        </div>
                    </div>
                    {importMessage && (
                        <p role="status" className="mt-3 rounded-xl bg-emerald-100 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {importMessage}
                        </p>
                    )}
                    {importError && (
                        <p role="alert" className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-300">
                            {importError}
                        </p>
                    )}
                </section>
            )}

            <form onSubmit={submit} className="space-y-6">
                <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Recipe Details</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <label className="lg:col-span-2"><span className="label">Recipe Name</span><input className="field" value={form.data.name} onChange={(e) => form.setData("name", e.target.value)} placeholder="Beef Cheese Burger Recipe" />{form.errors.name && <span className="error">{form.errors.name}</span>}</label>
                        <label><span className="label">Recipe Type</span><select className="field" value={form.data.recipe_type} onChange={(e) => setRecipeType(e.target.value)}><option value="standard">Standard Recipe</option><option value="batch">Batch Preparation</option><option value="variation">Variation-Specific Recipe</option></select></label>
                        <label><span className="label">Status</span><select className="field" value={form.data.status} onChange={(e) => form.setData("status", e.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
                        <div className="relative lg:col-span-2"><span className="label">Finished Product</span>{form.data.product ? <div className="field flex items-center justify-between"><span>{form.data.product.title} <small className="text-slate-500">{form.data.product.sku || form.data.product.barcode || ""}</small></span><button type="button" className="text-xs text-primary-600" onClick={clearFinishedProduct}>Change</button></div> : <><input className="field" value={productQuery} onChange={(e) => setProductQuery(e.target.value)} placeholder="Search product by name, SKU, or barcode" />{productResults.length > 0 && <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">{productResults.map((product) => <button type="button" key={product.id} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => chooseFinishedProduct(product)}>{product.title} <span className="text-xs text-slate-500">{product.sku || product.barcode || ""}</span></button>)}</div>}</>}{form.errors.product_id && <span className="error">{form.errors.product_id}</span>}</div>
                        {form.data.recipe_type === "variation" && (
                            <label className="lg:col-span-2">
                                <span className="label">Finished Product Variation</span>
                                <select
                                    className="field"
                                    value={form.data.variation_id}
                                    disabled={!form.data.product}
                                    onChange={(event) => {
                                        const variationId = event.target.value;
                                        form.setData("variation_id", variationId);
                                        form.setData("variation_name", variationLabel(variationId));
                                    }}
                                >
                                    <option value="">Select a variation</option>
                                    {(form.data.product?.variations || []).map((variationId) => (
                                        <option key={variationId} value={variationId}>
                                            {variationLabel(variationId)}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.variation_id && <span className="error">{form.errors.variation_id}</span>}
                                {form.data.product && !(form.data.product.variations || []).length && (
                                    <span className="error">This finished product has no configured variations.</span>
                                )}
                            </label>
                        )}
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
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                                Preparation Steps
                            </h2>
                            <p className="text-sm text-slate-500">
                                Edit and resize each field; the layout adjusts to the available space.
                            </p>
                        </div>
                        <button type="button" onClick={addStep} className="button-secondary shrink-0">
                            <IconPlus size={16} /> Add Step
                        </button>
                    </div>
                    <div className="space-y-3">
                        {form.data.steps.map((step, index) => (
                            <div
                                key={index}
                                className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                                        <IconGripVertical size={18} />
                                        Step {index + 1}
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={`Remove step ${index + 1}`}
                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                        onClick={() =>
                                            form.setData(
                                                "steps",
                                                form.data.steps.filter((_, item) => item !== index)
                                            )
                                        }
                                    >
                                        <IconTrash size={18} />
                                    </button>
                                </div>
                                <div
                                    className="grid min-w-0 gap-3"
                                    style={{
                                        gridTemplateColumns:
                                            "repeat(auto-fit, minmax(min(100%, 13rem), 1fr))",
                                    }}
                                >
                                    <label className="label min-w-0">
                                        Step title
                                        <textarea
                                            rows={2}
                                            className="field min-h-14 resize"
                                            placeholder="Step title"
                                            value={step.title}
                                            onChange={(e) =>
                                                updateStep(index, "title", e.target.value)
                                            }
                                        />
                                    </label>
                                    <label className="label min-w-0">
                                        Preparation instructions
                                        <textarea
                                            rows={4}
                                            className="field min-h-28 resize"
                                            placeholder="Preparation instructions"
                                            value={step.instructions}
                                            onChange={(e) =>
                                                updateStep(index, "instructions", e.target.value)
                                            }
                                        />
                                    </label>
                                    <label className="label min-w-0">
                                        Duration (minutes)
                                        <input
                                            className="field"
                                            type="number"
                                            min="0"
                                            placeholder="Minutes"
                                            value={step.duration_minutes || ""}
                                            onChange={(e) =>
                                                updateStep(index, "duration_minutes", e.target.value)
                                            }
                                        />
                                    </label>
                                    <label className="label min-w-0">
                                        Temperature
                                        <input
                                            className="field"
                                            type="number"
                                            placeholder="Temperature"
                                            value={step.temperature || ""}
                                            onChange={(e) =>
                                                updateStep(index, "temperature", e.target.value)
                                            }
                                        />
                                    </label>
                                    <label className="label min-w-0">
                                        Temperature unit
                                        <input
                                            className="field"
                                            placeholder="°C"
                                            value={step.temperature_unit || ""}
                                            onChange={(e) =>
                                                updateStep(index, "temperature_unit", e.target.value)
                                            }
                                        />
                                    </label>
                                    <label className="label min-w-0">
                                        Equipment
                                        <textarea
                                            rows={2}
                                            className="field min-h-14 resize"
                                            placeholder="Equipment"
                                            value={step.equipment || ""}
                                            onChange={(e) =>
                                                updateStep(index, "equipment", e.target.value)
                                            }
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
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
