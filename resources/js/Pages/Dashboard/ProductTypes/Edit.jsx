import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import Checkbox from "@/Components/Dashboard/Checkbox";
import InputSelect from "@/Components/Dashboard/InputSelect";
import toast from "react-hot-toast";
import {
    IconTag,
    IconDeviceFloppy,
    IconArrowLeft,
} from "@tabler/icons-react";

export default function Edit({ productType }) {
    const { errors, categories, products } = usePage().props;

    const { data, setData, post, processing } = useForm({
        id: productType.id,
        name: productType.name,
        code: productType.code,
        description: productType.description,
        is_active: productType.is_active,
        category_id: productType.category_id || "",
        product_id: productType.product_id || "",
        _method: "PUT",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("product-types.update", productType.id), {
            onSuccess: () => toast.success("Item updated successfully"),
            onError: () => toast.error("Failed to update item"),
        });
    };

    return (
        <>
            <Head title="Edit Item" />

            <div className="mb-6">
                <Link
                    href={route("product-types.index")}
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
                                setSelected={(product) => setData("product_id", product?.id || "")}
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
                            <Checkbox
                                label="Active"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData("is_active", e.target.checked)
                                }
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                            <Link
                                href={route("product-types.index")}
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
