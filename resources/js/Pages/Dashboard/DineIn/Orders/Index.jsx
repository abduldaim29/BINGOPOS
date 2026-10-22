import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, usePage, router } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import {
    IconClock,
    IconCheck,
    IconX,
    IconEye,
    IconDatabaseOff,
    IconRefresh,
} from "@tabler/icons-react";
import Table from "@/Components/Dashboard/Table";
import { useAuthorization } from "@/Utils/authorization";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
    submitted: { label: "Pending", color: "bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-400", icon: IconClock },
    accepted: { label: "Accepted", color: "bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-400", icon: IconCheck },
    completed: { label: "Completed", color: "bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400", icon: IconCheck },
    rejected: { label: "Rejected", color: "bg-danger-100 text-danger-700 dark:bg-danger-900/50 dark:text-danger-400", icon: IconX },
    cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400", icon: IconX },
};

const PAY_CONFIG = {
    pay_at_counter: { label: "Pay at Counter", color: "text-slate-600 dark:text-slate-400" },
    pay_online: { label: "Pay Online", color: "text-primary-600 dark:text-primary-400" },
};

export default function Index({ orders }) {
    const { auth } = usePage().props;
    const { can } = useAuthorization();
    const canProcess = can("dine-orders-process");

    const handleAccept = (order) => {
        if (!confirm("Accept this order and proceed to the cashier?")) return;
        router.post(
            route("dine-orders.accept", order.id),
            {},
            {
                onSuccess: () => toast.success("Order accepted."),
                onError: () => toast.error("Failed to accept order."),
            }
        );
    };

    const handleReject = (order) => {
        const reason = prompt("Reason for rejection (optional):");
        if (reason === null) return;
        router.post(
            route("dine-orders.reject", order.id),
            { reason },
            {
                onSuccess: () => toast.success("Order rejected."),
                onError: () => toast.error("Failed to reject order."),
            }
        );
    };

    return (
        <>
            <Head title="Dine-In Orders" />

            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Dine-In Orders
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {orders.length} orders
                        </p>
                    </div>
                </div>
            </div>

            {orders.length > 0 ? (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const status = STATUS_CONFIG[order.status] ?? { label: order.status, color: "bg-slate-100 text-slate-500", icon: IconClock };
                        const StatusIcon = status.icon;
                        const pay = PAY_CONFIG[order.payment_option] ?? { label: order.payment_option, color: "text-slate-500" };

                        return (
                            <div
                                key={order.id}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                            >
                                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {order.table?.name ?? "Table"}
                                                </span>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon size={12} />
                                                    {status.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span>{order.item_count} items</span>
                                                <span>Subtotal: Rs {Number(order.subtotal ?? 0).toLocaleString("en-US")}</span>
                                                <span className={pay.color}>{pay.label}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {canProcess && order.status === "submitted" && (
                                                <>
                                                    <Button
                                                        type={"button"}
                                                        label={"Accept"}
                                                        icon={<IconCheck size={16} strokeWidth={1.5} />}
                                                        className={
                                                            "bg-success-500 hover:bg-success-600 text-white"
                                                        }
                                                        onClick={() => handleAccept(order)}
                                                    />
                                                    <Button
                                                        type={"button"}
                                                        label={"Reject"}
                                                        icon={<IconX size={16} strokeWidth={1.5} />}
                                                        className={
                                                            "border border-danger-200 text-danger-600 hover:bg-danger-50 dark:border-danger-800 dark:text-danger-400"
                                                        }
                                                        onClick={() => handleReject(order)}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <div className="space-y-2">
                                        {(order.items ?? []).map((item) => (
                                            <div key={item.id} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {item.product?.title ?? "Product"}
                                                    </p>
                                                    {item.note && (
                                                        <p className="text-xs text-slate-400 mt-0.5">Note: {item.note}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">
                                                        {item.qty}x Rs {Number(item.price).toLocaleString("en-US")}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {order.notes && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                <span className="font-medium">Notes:</span> {order.notes}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                        <span className="text-xs text-slate-400">
                                            {order.created_at}
                                        </span>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            Total: Rs {Number(order.subtotal ?? 0).toLocaleString("en-US")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <IconDatabaseOff size={32} className="text-slate-400" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">
                        No Orders
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Customer orders will appear here.
                    </p>
                </div>
            )}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;