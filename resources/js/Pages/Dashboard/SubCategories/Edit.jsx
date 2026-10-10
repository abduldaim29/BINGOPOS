import React, { useEffect, useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, useForm, usePage, Link } from "@inertiajs/react";
import Input from "@/Components/Dashboard/Input";
import Textarea from "@/Components/Dashboard/TextArea";
import Checkbox from "@/Components/Dashboard/Checkbox";
import InputSelect from "@/Components/Dashboard/InputSelect";
import toast from "react-hot-toast";
import {
    IconCategory,
    IconDeviceFloppy,
    IconArrowLeft,
} from "@tabler/icons-react";

export default function Edit({ subCategory, categories }) {
    const { errors } = usePage().props;

    const { data, setData, post, processing } = useForm({
        id: subCategory.id,
        category_id: subCategory.category_id,
        name: subCategory.name,
        code: subCategory.code,
        description: subCategory.description,
        is_active: subCategory.is_active,
        _method: "PUT",
    });

    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        if (subCategory.category_id) {
            setSelectedCategory(
                categories.find((cat) => cat.id === subCategory.category_id)
            );
        }
    }, [subCategory.category_id]);

    const setSelectedCategoryHandler = (value) => {
        setSelectedCategory(value);
        setData("category_id", value?.id || "");
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("sub-categories.update", subCategory.id), {
            onSuccess: () => toast.success("Sub category updated successfully"),
            onError: () => toast.error("Failed to update sub category"),
        });
    };

    return (
        <>
            <Head title="Edit Sub Category" />

            <div className="mb-6">
                <Link
                    href={route("sub-categories.index")}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 mb-3"
                >
                    <IconArrowLeft size={16} />
                    Back to Sub Categories
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <IconCategory size={28} className="text-primary-500" />
                    Edit Sub Category
                </h1>
                <p className="text-sm text-slate-500 mt-1">{subCategory.name}</p>
            </div>

            <form onSubmit={submit}>
                <div className="max-w-2xl">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="space-y-4">
                            <InputSelect
                                label="Parent Category"
                                data={categories}
                                selected={selectedCategory}
                                setSelected={setSelectedCategoryHandler}
                                placeholder="Select a category"
                                errors={errors.category_id}
                                searchable={true}
                                displayKey="name"
                            />
                            <Input
                                type="text"
                                label="Sub Category Code"
                                placeholder="e.g., SC001"
                                errors={errors.code}
                                onChange={(e) =>
                                    setData("code", e.target.value)
                                }
                                value={data.code}
                            />
                            <Input
                                type="text"
                                label="Sub Category Name"
                                placeholder="e.g., Laptops"
                                errors={errors.name}
                                onChange={(e) =>
                                    setData("name", e.target.value)
                                }
                                value={data.name}
                            />
                            <Textarea
                                label="Description"
                                placeholder="Sub category description"
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
                                href={route("sub-categories.index")}
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
