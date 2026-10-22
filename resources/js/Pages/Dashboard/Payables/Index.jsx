import React, { useEffect, useState } from "react";
import { Head, Link, router, usePage, useForm } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import {
    IconClockHour6,
    IconSearch,
    IconCalendar,
    IconAlertCircle,
    IconPlus,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/Utils/currency";

const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function PayablesIndex({ payables, filters = {}, suppliers = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.invoice || "");
    const [status, setStatus] = useState(filters.status || "");
    const [supplierId, setSupplierId] = useState(filters.supplier || "");
    const { data, setData, post, processing, reset, errors } = useForm({
        supplier_id: "",
        document_number: "",
        total: "",
        due_date: "",
        note: "",
    });

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const applyFilter = (e) => {
        e.preventDefault();
        router.get(
            route("payables.index"),
            { invoice: search, status, supplier: supplierId },
            { preserveScroll: true, preserveState: true }
        );
    };

    const statusBadge = (value) => {
        const base = "px-2 py-1 text-xs font-semibold rounded-full";
        switch (value) {
            case "paid":
                return <span className={`${base} bg-success-100 text-success-700`}>Paid</span>;
            case "partial":
                return <span className={`${base} bg-primary-100 text-primary-700`}>Partial</span>;
            case "overdue":
                return <span className={`${base} bg-rose-100 text-rose-700`}>Overdue</span>;
            default:
                return <span className={`${base} bg-amber-100 text-amber-700`}>Unpaid</span>;
        }
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post(route("payables.store"), {
            onSuccess: () => reset(),
        });
    };

    const rows = payables?.data || [];

    return (
        <>
            <Head title="Supplier Payables" />
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <IconClockHour6 size={26} className="text-primary-500" />
                            Supplier Payables
                        </h1>
                        <p className="text-sm text-slate-500">
                            Record and track payments owed to suppliers.
                        </p>
                    </div>
                </div>

                {/* Create form */}
                <form
                    onSubmit={submitCreate}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3"
                >
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Supplier
                        </label>
                        <select
                            value={data.supplier_id}
                            onChange={(e) => setData("supplier_id", e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                        >
                            <option value="">General</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Document Number
                        </label>
                        <input
                            value={data.document_number}
                            onChange={(e) => setData("document_number", e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                            placeholder="Optional"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Total
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={data.total}
                            onChange={(e) => setData("total", e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                            required
                        />
                        {errors.total && <p className="text-xs text-danger-500">{errors.total}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={data.due_date}
                            onChange={(e) => setData("due_date", e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full h-11 rounded-xl bg-primary-500 text-white text-sm font-semibold flex items-center justify-center gap-2"
                        >
                            <IconPlus size={16} />
                            Save
                        </button>
                    </div>
                    <div className="md:col-span-5">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            Notes
                        </label>
                        <textarea
                            rows={2}
                            value={data.note}
                            onChange={(e) => setData("note", e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                            placeholder="Additional notes (optional)"
                        />
                    </div>
                </form>

                {/* Filters */}
                <form
                    onSubmit={applyFilter}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
                >
                    <div className="relative w-full">
                        <IconSearch
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search document number"
                            className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                        />
                    </div>
                    <div className="w-full">
                        <select
                            value={supplierId}
                            onChange={(e) => setSupplierId(e.target.value)}
                            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="relative w-full">
                        <IconCalendar
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                            <option value="overdue">Overdue</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                    >
                        Apply Filters
                    </button>
                </form>

                {/* Table + Cards */}
                <div className="bg-transparent border-0 shadow-none rounded-2xl sm:bg-white sm:dark:bg-slate-900 sm:border sm:border-slate-200 sm:dark:border-slate-800 sm:overflow-hidden">
                    <div className="w-full overflow-x-auto hidden sm:block">
                        <div className="min-w-[720px]">
                            <div className="grid grid-cols-12 px-3 sm:px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                                <div className="col-span-2">Document</div>
                                <div className="col-span-2">Supplier</div>
                                <div className="col-span-2 text-right">Total</div>
                                <div className="col-span-2 text-right">Remaining</div>
                                <div className="col-span-2 text-right">Due Date</div>
                                <div className="col-span-2 text-center min-w-[140px]">Status</div>
                            </div>
                            {rows.length ? (
                                rows.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={route("payables.show", item.id)}
                                        className="grid grid-cols-12 gap-2 px-3 sm:px-4 py-3 items-center border-b border-slate-100 dark:border-slate-800 hover:bg-primary-50/50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="col-span-2">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                                {item.document_number}
                                            </p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-slate-700 dark:text-slate-200">
                                                {item.supplier?.name || "-"}
                                            </p>
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-semibold text-slate-900 dark:text-white">
                                            {formatCurrency(item.total)}
                                        </div>
                                        <div className="col-span-2 text-right text-sm font-semibold text-primary-600 dark:text-primary-400">
                                            {formatCurrency(item.remaining)}
                                        </div>
                                        <div className="col-span-2 text-right text-sm text-slate-600 dark:text-slate-400">
                                            {formatDate(item.due_date)}
                                        </div>
                                        <div className="col-span-2 flex justify-center whitespace-nowrap">
                                            {statusBadge(item.status)}
                                        </div>
                                    </Link>
                                ))
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <IconAlertCircle
                                        size={28}
                                        className="mx-auto mb-2 text-slate-400"
                                    />
                                    No payable records found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Cards */}
                    <div className="sm:hidden flex flex-col gap-3 px-1">
                        {rows.length ? (
                            rows.map((item) => (
                                <Link
                                    key={item.id}
                                    href={route("payables.show", item.id)}
                                    className="p-4 space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Document
                                            </p>
                                            <p className="text-base font-semibold text-slate-900 dark:text-white">
                                                {item.document_number || "-"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Due date: {formatDate(item.due_date)}
                                            </p>
                                        </div>
                                        <div className="text-right space-y-2">
                                            {statusBadge(item.status)}
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                {formatCurrency(item.total)}
                                            </p>
                                            <p className="text-xs text-primary-600 dark:text-primary-400">
                                                Remaining: {formatCurrency(item.remaining)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                                        <div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Supplier
                                            </p>
                                            <p className="font-medium">
                                                {item.supplier?.name || "-"}
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Status
                                            </p>
                                            <p className="font-medium capitalize">{item.status}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="p-6 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                                <IconAlertCircle
                                    size={28}
                                    className="mx-auto mb-2 text-slate-400"
                                />
                                No payable records found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

PayablesIndex.layout = (page) => <DashboardLayout children={page} />;