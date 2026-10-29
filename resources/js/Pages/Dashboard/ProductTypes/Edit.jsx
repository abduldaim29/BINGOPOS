import React from "react";
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
} from "@tabler/icons-react";

export default function Edit({ productType }) {
    const { errors, categories, products, ingredientProducts } = usePage().props;
    const existingRecipe = productType.recipe;

    const { data, setData, post, processing } = useForm({
        id: productType.id,
        name: productType.name,
        short_name: productType.short_name || "",
        code: productType.code,
        description: productType.description,
        is_active: productType.is_active,
        sort_order: productType.sort_order || 0,
        color: productType.color || "#0f766e",
        category_id: productType.category_id || "",
        product_id: productType.product_id || "",
        ingredients: (existingRecipe?.ingredients || []).filter(
            (ingredient) => String(ingredient.product_id) !== String(productType.product_id)
        ).map((ingredient) => ({
            product_id: ingredient.product_id,
            unit_id: ingredient.unit_id || "",
            quantity: ingredient.quantity || "1",
            wastage_percent: ingredient.wastage_percent || "0",
            purchase_price: ingredient.purchase_price || "",
        })),
        _method: "PUT",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("items.update", productType.id), {
            onSuccess: () => toast.success("Item updated successfully"),
            onError: () => toast.error("Failed to update item"),
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

    return (
        <>
            <Head title="Edit Item" />

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
                    Edit Item
                </h1>
                <p className="text-sm text-slate-500 mt-1">{productType.name}</p>
            </div>

            <form onSubmit={submit}>
                <div className="max-w-2xl">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="space-y-4">
                            <Input
                                type="text"
                                label="Item Code"
                                placeholder="e.g., IT001"
                                errors={errors.code}
                                onChange={(e) =>
                                    setData("code", e.target.value)
                                }
                                value={data.code}
                            />
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
                            <Input
                                type="text"
                                label="Short Name"
                                placeholder="e.g., Electronics"
                                errors={errors.short_name}
                                onChange={(e) => setData("short_name", e.target.value)}
                                value={data.short_name}
                            />
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
                            <div className="grid gap-4 sm:grid-cols-2">
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
                            <Checkbox
                                label="Active"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData("is_active", e.target.checked)
                                }
                            />
                        </div>
                        <ItemIngredients
                            ingredients={data.ingredients}
                            setIngredients={(ingredients) => setData("ingredients", ingredients)}
                            products={ingredientProducts || products || []}
                            finishedProductId={data.product_id}
                        />

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
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
                                {processing ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}

Edit.layout = (page) => <DashboardLayout children={page} />;
