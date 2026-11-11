import React from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";

const blankItem = () => ({
    description: "",
    quantity: "1",
    unit_rate: "0",
    tax_type: "percentage",
    tax_value: "0",
});

export default function Create({ reportDate }) {
    const { data, setData, post, processing, errors } = useForm({
        vendor_name: "",
        report_date: reportDate,
        reference_number: "",
        notes: "",
        items: [blankItem()],
    });

    const updateItem = (index, field, value) => {
        setData(
            "items",
            data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addItem = () => setData("items", [...data.items, blankItem()]);

    const removeItem = (index) =>
        setData(
            "items",
            data.items.filter((_, itemIndex) => itemIndex !== index)
        );

    const submit = (event) => {
        event.preventDefault();
        post(route("manual-sales-reports.store"));
    };

    const fieldClass =
        "mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

    return (
        <>
            <Head title="Create Manual Sales Report" />
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Create Manual Sales Report
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Enter vendor details and sales figures. This report is saved separately and does not create a POS transaction.
                        </p>
                    </div>
                    <Link
                        href={route("sales-returns.index")}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                        Back to Sales Report
                    </Link>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 dark:border-slate-800 dark:bg-slate-950">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Vendor / supplier name
                            <input
                                required
                                maxLength={255}
                                value={data.vendor_name}
                                onChange={(event) => setData("vendor_name", event.target.value)}
                                className={fieldClass}
                            />
                            {errors.vendor_name && (
                                <span className="mt-1 block text-xs text-red-600">{errors.vendor_name}</span>
                            )}
                        </label>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Report date
                            <input
                                required
                                type="date"
                                value={data.report_date}
                                onChange={(event) => setData("report_date", event.target.value)}
                                className={fieldClass}
                            />
                            {errors.report_date && (
                                <span className="mt-1 block text-xs text-red-600">{errors.report_date}</span>
                            )}
                        </label>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Invoice / reference number
                            <input
                                maxLength={100}
                                value={data.reference_number}
                                onChange={(event) => setData("reference_number", event.target.value)}
                                className={fieldClass}
                            />
                            {errors.reference_number && (
                                <span className="mt-1 block text-xs text-red-600">{errors.reference_number}</span>
                            )}
                        </label>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Notes
                            <textarea
                                rows={2}
                                value={data.notes}
                                onChange={(event) => setData("notes", event.target.value)}
                                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            {errors.notes && (
                                <span className="mt-1 block text-xs text-red-600">{errors.notes}</span>
                            )}
                        </label>
                    </section>

                    <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report items</h2>
                                <p className="text-sm text-slate-500">
                                    Enter a tax percentage or a fixed tax amount for each item.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                Add item
                            </button>
                        </div>

                        {data.items.map((item, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-6 dark:border-slate-800 dark:bg-slate-900"
                            >
                                <label className="text-xs font-semibold text-slate-500 xl:col-span-2">
                                    Item name
                                    <input
                                        required
                                        maxLength={255}
                                        value={item.description}
                                        onChange={(event) => updateItem(index, "description", event.target.value)}
                                        className={fieldClass}
                                    />
                                    {errors[`items.${index}.description`] && (
                                        <span className="mt-1 block text-xs text-red-600">
                                            {errors[`items.${index}.description`]}
                                        </span>
                                    )}
                                </label>
                                <label className="text-xs font-semibold text-slate-500">
                                    Quantity
                                    <input
                                        required
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={item.quantity}
                                        onChange={(event) => updateItem(index, "quantity", event.target.value)}
                                        className={fieldClass}
                                    />
                                    {errors[`items.${index}.quantity`] && (
                                        <span className="mt-1 block text-xs text-red-600">
                                            {errors[`items.${index}.quantity`]}
                                        </span>
                                    )}
                                </label>
                                <label className="text-xs font-semibold text-slate-500">
                                    Unit rate
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={item.unit_rate}
                                        onChange={(event) => updateItem(index, "unit_rate", event.target.value)}
                                        className={fieldClass}
                                    />
                                    {errors[`items.${index}.unit_rate`] && (
                                        <span className="mt-1 block text-xs text-red-600">
                                            {errors[`items.${index}.unit_rate`]}
                                        </span>
                                    )}
                                </label>
                                <label className="text-xs font-semibold text-slate-500">
                                    Tax type
                                    <select
                                        value={item.tax_type}
                                        onChange={(event) => updateItem(index, "tax_type", event.target.value)}
                                        className={fieldClass}
                                    >
                                        <option value="percentage">Percent (%)</option>
                                        <option value="amount">Fixed amount</option>
                                    </select>
                                </label>
                                <label className="text-xs font-semibold text-slate-500">
                                    {item.tax_type === "percentage" ? "Tax %" : "Tax amount"}
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        max={item.tax_type === "percentage" ? "100" : undefined}
                                        step="0.01"
                                        value={item.tax_value}
                                        onChange={(event) => updateItem(index, "tax_value", event.target.value)}
                                        className={fieldClass}
                                    />
                                    {errors[`items.${index}.tax_value`] && (
                                        <span className="mt-1 block text-xs text-red-600">
                                            {errors[`items.${index}.tax_value`]}
                                        </span>
                                    )}
                                </label>
                                {data.items.length > 1 && (
                                    <div className="flex items-end md:col-span-2 xl:col-span-6">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="text-sm font-semibold text-red-600 hover:text-red-700"
                                        >
                                            Remove item
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {errors.items && (
                            <p className="text-sm text-red-600">{errors.items}</p>
                        )}
                    </section>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? "Saving report..." : "Save and view report"}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
