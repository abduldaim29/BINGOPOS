import React from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { IconCheck, IconX, IconAlertCircle, IconEye } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { formatCurrency } from "@/Utils/currency";

export default function DiscountApprovals({ pendingTransactions }) {
    const confirm = (action, tx) => {
        if (!window.confirm(`${action === "approve" ? "Approve" : "Reject"} discount for transaction ${tx.invoice}?`)) return;
        router.post(route(`discount-approvals.${action}`, tx.id), {}, {
            onSuccess: () => toast.success(action === "approve" ? "Discount approved" : "Discount rejected"),
            onError: () => toast.error("Failed"),
        });
    };

    return (
        <>
            <Head title="Discount Approval" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <IconAlertCircle size={28} className="text-amber-500" />
                        Discount Approval
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {pendingTransactions.length} transactions awaiting discount approval
                    </p>
                </div>

                {pendingTransactions.length > 0 ? (
                    <div className="space-y-4">
                        {pendingTransactions.map((tx) => (
                            <div key={tx.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white">{tx.invoice}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Cashier: {tx.cashier}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Customer: {tx.customer}</p>
                                    </div>
                                    <Link href={route("transactions.print", tx.invoice)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <IconEye size={18} />
                                    </Link>
                                </div>
                                <div className="mt-3 flex items-center gap-4 text-sm">
                                    <span className="text-slate-500">Discount: <strong className="text-danger-500">{formatCurrency(tx.discount)}</strong></span>
                                    <span className="text-slate-500">Total: <strong>{formatCurrency(tx.grand_total)}</strong></span>
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <button onClick={() => confirm("approve", tx)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-success-500 hover:bg-success-600 text-white text-sm font-medium transition-colors">
                                        <IconCheck size={18} /> Approve
                                    </button>
                                    <button onClick={() => confirm("deny", tx)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-danger-200 text-danger-600 hover:bg-danger-50 text-sm font-medium transition-colors dark:border-danger-800 dark:text-danger-400">
                                        <IconX size={18} /> Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                        <IconCheck size={48} className="mx-auto text-success-400 mb-3" />
                        <p className="text-slate-500 dark:text-slate-400">All transactions have been reviewed.</p>
                    </div>
                )}
            </div>
        </>
    );
}

DiscountApprovals.layout = (page) => <DashboardLayout children={page} />;