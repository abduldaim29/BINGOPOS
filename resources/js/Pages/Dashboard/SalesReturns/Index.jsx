import React, { useEffect, useState } from "react";
import { Head, Link, router } from "@inertiajs/react";
import Pagination from "@/Components/Dashboard/Pagination";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { IconEye, IconPlus, IconPrinter, IconSearch } from "@tabler/icons-react";

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(
              new Date(value)
          )
        : "-";

const statusLabel = {
    draft: "Draft",
    completed: "Completed",
};

const typeLabel = {
    refund_cash: "Cash refund",
    store_credit: "Store credit",
    replacement: "Replacement",
};

export default function Index({ salesReturns, filters, summary, canCreateSalesReturn }) {
    const [form, setForm] = useState({
        code: filters?.code || "",
        invoice: filters?.invoice || "",
        date_from: filters?.date_from || "",
        date_to: filters?.date_to || "",
        return_type: filters?.return_type || "",
        status: filters?.status || "",
    });

    useEffect(() => {
        setForm({
            code: filters?.code || "",
            invoice: filters?.invoice || "",
            date_from: filters?.date_from || "",
            date_to: filters?.date_to || "",
            return_type: filters?.return_type || "",
            status: filters?.status || "",
        });
    }, [filters]);

    const submit = (event) => {
        event.preventDefault();
        router.get(route("sales-returns.index"), form, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const clear = () => {
        const empty = {
            code: "",
            invoice: "",
            date_from: "",
            date_to: "",
            return_type: "",
            status: "",
        };
        setForm(empty);
        router.get(route("sales-returns.index"), empty, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const rows = salesReturns?.data || [];

    return (
        <>
            <Head title="Sales Returns" />
            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Sales Returns
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Create, review, and print refunds for completed sales.
                        </p>
                    </div>
                    {canCreateSalesReturn && (
                        <Link
                            href={route("transactions.history")}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700"
                        >
                            <IconPlus size={17} />
                            Select sale to return
                        </Link>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        ["Returns", summary?.returns_count, "All matching return records"],
                        ["Returned value", formatCurrency(summary?.returned_total), "Total returned sales"],
                        ["Cash refunded", formatCurrency(summary?.refunded_total), "Paid back to customers"],
                        ["Store credit", formatCurrency(summary?.credited_total), "Issued as customer credit"],
                    ].map(([label, value, hint]) => (
                        <div
                            key={label}
                            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"
                        >
                            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                {value ?? 0}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
                        </div>
                    ))}
                </div>

                <form
                    onSubmit={submit}
                    className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-6 dark:border-slate-800 dark:bg-slate-950"
                >
                    {[
                        ["code", "Return code"],
                        ["invoice", "Invoice"],
                    ].map(([key, placeholder]) => (
                        <input
                            key={key}
                            value={form[key]}
                            onChange={(event) =>
                                setForm((current) => ({ ...current, [key]: event.target.value }))
                            }
                            placeholder={placeholder}
                            className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                        />
                    ))}
                    <input
                        type="date"
                        value={form.date_from}
                        onChange={(event) => setForm((current) => ({ ...current, date_from: event.target.value }))}
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                        type="date"
                        value={form.date_to}
                        onChange={(event) => setForm((current) => ({ ...current, date_to: event.target.value }))}
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    />
                    <select
                        value={form.return_type}
                        onChange={(event) => setForm((current) => ({ ...current, return_type: event.target.value }))}
                        className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                    >
                        <option value="">All methods</option>
                        <option value="refund_cash">Cash refund</option>
                        <option value="store_credit">Store credit</option>
                        <option value="replacement">Replacement</option>
                    </select>
                    <div className="flex gap-2">
                        <select
                            value={form.status}
                            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                            <option value="">All statuses</option>
                            <option value="draft">Draft</option>
                            <option value="completed">Completed</option>
                        </select>
                        <button
                            type="submit"
                            aria-label="Search returns"
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700"
                        >
                            <IconSearch size={17} />
                        </button>
                        <button
                            type="button"
                            onClick={clear}
                            className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                        >
                            Clear
                        </button>
                    </div>
                </form>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900">
                                <tr>
                                    {["Return", "Invoice", "Date", "Customer", "Items", "Method", "Amount", "Status", "Actions"].map((heading) => (
                                        <th key={heading} className="whitespace-nowrap px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {rows.length ? rows.map((item) => (
                                    <tr key={item.id}>
                                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">{item.code}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{item.transaction?.invoice || "-"}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(item.completed_at || item.created_at)}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.customer?.name || "Walk-in customer"}</td>
                                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{item.items?.reduce((total, row) => total + Number(row.qty_return || 0), 0)}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{typeLabel[item.return_type] || item.return_type}</td>
                                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">{formatCurrency(item.total_return_amount)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}>
                                                {statusLabel[item.status] || item.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <Link href={route("sales-returns.show", item.id)} aria-label={`View ${item.code}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
                                                    <IconEye size={17} />
                                                </Link>
                                                <a href={route("sales-returns.print", item.id)} target="_blank" rel="noreferrer" aria-label={`Print ${item.code}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-primary-600 dark:hover:bg-slate-800">
                                                    <IconPrinter size={17} />
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="9" className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">No sales returns found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {salesReturns?.links?.length > 3 && (
                        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                            <Pagination links={salesReturns.links} />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
