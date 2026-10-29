import React, { useMemo } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import Checkbox from "@/Components/Dashboard/Checkbox";
import InputSelect from "@/Components/Dashboard/InputSelect";
import ItemIngredients from "@/Components/Dashboard/ItemIngredients";
import toast from "react-hot-toast";
import {
    IconTag,
    IconDeviceFloppy,
    IconArrowLeft,
    IconInfoCircle,
    IconPalette,
    IconWand,
    IconEye,
    IconShieldCheck,
    IconSparkles,
} from "@tabler/icons-react";

export default function Create() {
    const { errors, categories, products, ingredientProducts } = usePage().props;

    const { data, setData, post, processing } = useForm({
        name: "",
        short_name: "",
        code: "",
        description: "",
        is_active: true,
        sort_order: 0,
        color: "#0f766e",
        category_id: "",
        product_id: "",
        ingredients: [],
    });

    const selectedCategory = (categories || []).find(
        (category) => category.id === Number(data.category_id)
    );
    const initials = useMemo(
        () =>
            (data.short_name || data.name || "IT")
                .split(/\s+/)
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0])
                .join("")
                .toUpperCase(),
        [data.name, data.short_name]
    );

    const generateCode = () => {
        const words = data.name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9\s]/g, "")
            .split(/\s+/)
            .filter(Boolean);
        const prefix = words.map((word) => word[0]).join("").slice(0, 4) || "ITEM";
        setData("code", `${prefix}-${String(Date.now()).slice(-4)}`);
    };

    const generateShortName = () => {
        const value = data.name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((word) => word[0])
            .join("")
            .toUpperCase();
        if (value) setData("short_name", value);
    };

    const applyPreset = (preset) => {
        setData({
            ...data,
            color: preset.color,
            sort_order: preset.order,
            is_active: true,
        });
    };

    const selectFinishedProduct = (product) => {
        setData("product_id", product?.id || "");
        setData(
            "ingredients",
            data.ingredients.filter(
                (ingredient) => String(ingredient.product_id) !== String(product?.id || "")
            )
        );
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("items.store"), {
            onSuccess: () => toast.success("Item created successfully"),
            onError: () => toast.error("Failed to save item"),
        });
    };

    return (
        <>
            <Head title="Add Item" />

            <div className="mb-6">
                <Link
                    href={route("items.index")}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-3"
                >
                    <IconArrowLeft size={16} />
                    Back to Items
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IconTag size={28} className="text-primary-500" />
                    Add New Item
                </h1>
            </div>

            <form onSubmit={submit}>
                <div className="max-w-4xl">
                    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="mb-5 flex items-start gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
                            <IconInfoCircle size={20} className="mt-0.5 text-primary-500" />
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-white">Item details</h2>
                                <p className="text-sm text-slate-500">Define the item identity and how it appears across the system.</p>
                            </div>
                        </div>
                        <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 sm:grid-cols-4">
                            {[
                                ["01", "Identity"],
                                ["02", "Context"],
                                ["03", "Display"],
                                ["04", "Review"],
                            ].map(([step, label], index) => (
                                <div key={step} className="flex items-center gap-2">
                                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? "bg-primary-600 text-white" : "bg-white text-slate-500 dark:bg-slate-700"}`}>
                                        {step}
                                    </span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="relative">
                                <Input
                                    type="text"
                                    label="Item Code"
                                    placeholder="e.g., IT001"
                                    errors={errors.code}
                                    onChange={(e) =>
                                        setData("code", e.target.value.toUpperCase())
                                    }
                                    value={data.code}
                                />
                                <button type="button" onClick={generateCode} className="absolute right-0 top-0 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700">
                                    <IconWand size={14} /> Generate
                                </button>
                            </div>
                            <Input
                                type="text"
                                label="Short Name"
                                placeholder="e.g., Electronics"
                                errors={errors.short_name}
                                onChange={(e) => setData("short_name", e.target.value.toUpperCase())}
                                value={data.short_name}
                            />
                            <div className="sm:col-span-2 -mt-2 flex items-center justify-between">
                                <span className="text-xs text-slate-500">Use a short POS-friendly label for fast recognition.</span>
                                <button type="button" onClick={generateShortName} className="text-xs font-semibold text-primary-600 hover:text-primary-700">Suggest short name</button>
                            </div>
                            <Input
                                type="text"
                                label="Item Name"
                                placeholder="e.g., Electronics"
                                errors={errors.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                value={data.name}
                            />
                            <div className="sm:col-span-2 rounded-xl border border-primary-100 bg-primary-50/60 p-4 dark:border-primary-900/50 dark:bg-primary-950/20">
                                <div className="flex items-start gap-3">
                                    <IconSparkles size={18} className="mt-0.5 text-primary-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Smart item setup</p>
                                        <p className="mt-1 text-xs text-slate-500">The code and short name are used by POS search, filters and quick order screens.</p>
                                    </div>
                                </div>
                            </div>
                            <InputSelect
                                label="Category"
                                data={categories || []}
                                selected={categories?.find(c => c.id === data.category_id)}
                                setSelected={(category) => setData("category_id", category?.id || "")}
                                placeholder="Select Category"
                                errors={errors.category_id}
                            />
                            <InputSelect
                                label="Product"
                                data={products || []}
                                selected={products?.find(p => p.id === data.product_id)}
                                setSelected={selectFinishedProduct}
                                placeholder="Select Product"
                                errors={errors.product_id}
                                displayKey="title"
                            />
                            <div className="sm:col-span-2">
                            <Textarea
                                label="Description"
                                placeholder="Item description"
                                errors={errors.description}
                                onChange={(e) =>
                                    setData("description", e.target.value)
                                }
                                value={data.description}
                                rows={4}
                            />
                            </div>
                            <Input
                                type="number"
                                label="Display Order"
                                placeholder="0"
                                errors={errors.sort_order}
                                onChange={(e) => setData("sort_order", e.target.value)}
                                value={data.sort_order}
                            />
                            <label className="flex flex-col gap-2 text-sm text-gray-600">
                                Label Color
                                <span className="flex h-10 items-center gap-3 rounded-md border border-gray-200 px-2 dark:border-gray-800">
                                    <input type="color" value={data.color} onChange={(e) => setData("color", e.target.value)} className="h-7 w-10 cursor-pointer border-0 bg-transparent p-0" />
                                    <span className="text-xs text-slate-500">{data.color}</span>
                                </span>
                                {errors.color && <small className="text-xs text-red-500">{errors.color}</small>}
                            </label>
                        </div>
                        </div>
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                                <div className="mb-4 flex items-center gap-2">
                                    <IconEye size={18} className="text-primary-500" />
                                    <h2 className="font-semibold text-slate-900 dark:text-white">Live preview</h2>
                                </div>
                                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: data.color }}>
                                            {initials || "IT"}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{data.name || "Your item name"}</p>
                                            <p className="truncate text-xs text-slate-500">{data.code || "ITEM-CODE"} {data.short_name ? `• ${data.short_name}` : ""}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                                        <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{selectedCategory?.name || "No category"}</span>
                                        <span className={`rounded-full px-2 py-1 ${data.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" : "bg-slate-100 text-slate-500"}`}>{data.is_active ? "Active in POS" : "Hidden"}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
                                <div className="mb-3 flex items-center gap-2">
                                    <IconPalette size={18} className="text-primary-500" />
                                    <h2 className="font-semibold text-slate-900 dark:text-white">Visibility</h2>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                                    <div className="mb-3 flex items-center gap-2">
                                        <IconShieldCheck size={18} className="text-primary-500" />
                                        <h2 className="font-semibold text-slate-900 dark:text-white">Quick presets</h2>
                                    </div>
                                    <p className="mb-3 text-xs text-slate-500">Apply a consistent color and display priority.</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: "Primary", color: "#0f766e", order: 0 },
                                            { label: "Featured", color: "#7c3aed", order: 1 },
                                            { label: "Seasonal", color: "#ea580c", order: 10 },
                                        ].map((preset) => (
                                            <button key={preset.label} type="button" onClick={() => applyPreset(preset)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:border-primary-400 hover:text-primary-600 dark:border-slate-700 dark:text-slate-300">
                                                <span className="mx-auto mb-1 block h-3 w-3 rounded-full" style={{ backgroundColor: preset.color }} />
                                                {preset.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <p className="mb-4 text-sm text-slate-500">Inactive items remain saved but are hidden from active selections.</p>
                            <Checkbox
                                label="Active"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData("is_active", e.target.checked)
                                }
                            />
                            </div>
                        </div>
                        <ItemIngredients
                            ingredients={data.ingredients}
                            setIngredients={(ingredients) => setData("ingredients", ingredients)}
                            products={ingredientProducts || products || []}
                            finishedProductId={data.product_id}
                        />

                        <div className="flex justify-end gap-3 lg:col-span-2 mt-0 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                href={route("items.index")}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                <IconDeviceFloppy size={18} />
                                {processing ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
