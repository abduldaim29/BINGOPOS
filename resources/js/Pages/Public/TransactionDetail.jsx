import React from "react";
import { Head } from "@inertiajs/react";
import GuestLayout from "@/Layouts/GuestLayout";

const formatPrice = (v = 0) =>
    Number(v || 0).toLocaleString("en-PK", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });

const formatDate = (v) =>
    v
        ? new Date(v).toLocaleString("en-PK", {
              dateStyle: "full",
              timeStyle: "short",
          })
        : "-";

const statusBadge = (status) => {
    const styles = {
        paid: "bg-emerald-100 text-emerald-700",
        pending: "bg-amber-100 text-amber-700",
        unpaid: "bg-rose-100 text-rose-700",
        pending_approval: "bg-slate-100 text-slate-700",
    };

    const labels = {
        paid: "Paid",
        pending: "Pending",
        unpaid: "Unpaid",
        pending_approval: "Awaiting Approval",
    };

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                styles[status] || "bg-slate-100 text-slate-600"
            }`}
        >
            {labels[status] || status}
        </span>
    );
};

export default function TransactionDetail({ transaction, token }) {
    return (
        <>
            <Head title={`Invoice ${transaction.invoice}`} />

            <div className="min-h-screen bg-slate-50 px-4 py-8">
                <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-700 px-6 py-5 text-center text-white">
                        <p className="text-sm opacity-80">INVOICE</p>
                        <p className="mt-1 text-xl font-bold">
                            {transaction.invoice}
                        </p>
                        <p className="mt-1 text-sm opacity-80">
                            {formatDate(transaction.created_at)}
                        </p>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Status</span>
                            {statusBadge(transaction.payment_status)}
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Items
                            </p>

                            {transaction.details.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between py-1.5 text-sm"
                                >
                                    <span className="text-slate-700">
                                        {item.product_title} x{item.qty}
                                    </span>
                                    <span className="font-medium">
                                        {formatPrice(item.price)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                            <div className="flex justify-between text-slate-500">
                                <span>Subtotal</span>
                                <span>
                                    {formatPrice(
                                        transaction.grand_total +
                                            transaction.discount -
                                            (transaction.shipping_cost || 0) -
                                            (transaction.tax_total || 0)
                                    )}
                                </span>
                            </div>

                            {transaction.discount > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>Discount</span>
                                    <span>
                                        -{formatPrice(transaction.discount)}
                                    </span>
                                </div>
                            )}

                            {transaction.tax_total > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>Tax</span>
                                    <span>
                                        {formatPrice(transaction.tax_total)}
                                    </span>
                                </div>
                            )}

                            {transaction.shipping_cost > 0 && (
                                <div className="flex justify-between text-slate-500">
                                    <span>Shipping</span>
                                    <span>
                                        {formatPrice(transaction.shipping_cost)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between border-t border-slate-200 pt-2 text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary-600">
                                    {formatPrice(transaction.grand_total)}
                                </span>
                            </div>
                        </div>

                        {transaction.payment_method === "cash" &&
                            transaction.cash > 0 && (
                                <div className="space-y-1.5 border-t border-slate-100 pt-4 text-sm">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Cash</span>
                                        <span>
                                            {formatPrice(transaction.cash)}
                                        </span>
                                    </div>

                                    {transaction.change > 0 && (
                                        <div className="flex justify-between text-slate-500">
                                            <span>Change</span>
                                            <span>
                                                {formatPrice(transaction.change)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                        {transaction.receivable &&
                            transaction.receivable.status !== "paid" && (
                                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                                    <p className="text-sm font-semibold text-amber-800">
                                        Outstanding Balance
                                    </p>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-amber-700">
                                            Due Date:{" "}
                                            {formatDate(
                                                transaction.receivable.due_date
                                            )}
                                        </span>
                                        <span className="font-bold text-amber-900">
                                            {formatPrice(
                                                transaction.receivable.remaining
                                            )}
                                        </span>
                                    </div>

                                    <a
                                        href={route("portal.receivable.pay", [
                                            transaction.receivable.id,
                                            { token },
                                        ])}
                                        className="block w-full rounded-xl bg-primary-500 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-primary-600"
                                        onClick={(e) => {
                                            e.preventDefault();

                                            const form =
                                                document.createElement("form");
                                            form.method = "POST";
                                            form.action = route(
                                                "portal.receivable.pay",
                                                [
                                                    transaction.receivable.id,
                                                    { token },
                                                ]
                                            );

                                            document.body.appendChild(form);
                                            form.submit();
                                        }}
                                    >
                                        Pay Now
                                    </a>
                                </div>
                            )}
                    </div>

                    <div className="border-t border-slate-100 px-6 py-4 text-center text-xs text-slate-400">
                        Thank you for your purchase
                    </div>
                </div>
            </div>
        </>
    );
}

TransactionDetail.layout = (page) => <GuestLayout children={page} />;