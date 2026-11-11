import React from "react";
import { Head, usePage } from "@inertiajs/react";

const formatDateTime = (value) =>
    value
        ? new Intl.DateTimeFormat("en-PK", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "-";

const formatCurrency = (value, currency) =>
    new Intl.NumberFormat(currency.locale || "en-PK", {
        style: "currency",
        currency: currency.code || "PKR",
        minimumFractionDigits: Number.isInteger(currency.decimalPlaces)
            ? currency.decimalPlaces
            : 2,
        maximumFractionDigits: Number.isInteger(currency.decimalPlaces)
            ? currency.decimalPlaces
            : 2,
    }).format(Number(value || 0));

export default function Print({ salesReturn, transaction }) {
    const { storeProfile = {}, currencySettings = {} } = usePage().props;
    const items = salesReturn.items || [];

    return (
        <>
            <Head title={`Return Invoice ${salesReturn.code}`} />
            <main className="mx-auto max-w-5xl px-6 py-8 text-slate-900">
                <div className="mb-5 flex justify-end print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Print Return Invoice
                    </button>
                </div>

                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg print:rounded-none print:border-slate-300 print:shadow-none">
                    <header className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-6 text-white print:bg-slate-100 print:text-slate-900">
                        <div className="grid gap-6 sm:grid-cols-[1.4fr_1fr]">
                            <div className="flex items-start gap-4">
                                {storeProfile.logo ? (
                                    <img
                                        src={storeProfile.logo}
                                        alt={storeProfile.name || "Store"}
                                        className="h-14 w-14 shrink-0 object-contain"
                                    />
                                ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl font-bold print:bg-slate-200">
                                        {(storeProfile.name || "S")
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-lg font-bold">
                                        {storeProfile.name || "Your Store"}
                                    </p>
                                    {storeProfile.address && (
                                        <p className="mt-1 text-sm opacity-90">
                                            {storeProfile.address}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs opacity-90">
                                        {[storeProfile.phone, storeProfile.email]
                                            .filter(Boolean)
                                            .join("  |  ")}
                                    </p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <p className="text-sm font-bold uppercase tracking-[0.18em] opacity-90">
                                    Sales Return Invoice
                                </p>
                                <h1 className="mt-1 break-all text-2xl font-black">
                                    {salesReturn.code}
                                </h1>
                                <p className="mt-1 text-sm">
                                    {formatDateTime(salesReturn.created_at)}
                                </p>
                                <span
                                    className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                        salesReturn.status === "completed"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-amber-100 text-amber-800"
                                    }`}
                                >
                                    {salesReturn.status}
                                </span>
                            </div>
                        </div>
                    </header>

                    <section className="grid gap-4 border-b border-slate-200 px-6 py-5 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Customer
                            </p>
                            <p className="mt-1 font-semibold">
                                {salesReturn.customer?.name || "Walk-in customer"}
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Original sale
                            </p>
                            <p className="mt-1 font-semibold">
                                {transaction.invoice || "-"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                Sold {formatDateTime(transaction.created_at)}
                                {transaction.cashier?.name
                                    ? ` · Cashier ${transaction.cashier.name}`
                                    : ""}
                            </p>
                        </div>
                    </section>

                    <section className="px-4 py-5 sm:px-6">
                        <div className="mb-3 flex items-end justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold">Returned items</h2>
                                <p className="text-sm text-slate-500">
                                    {items.length} product line(s)
                                </p>
                            </div>
                            <p className="text-right text-sm text-slate-600">
                                Settlement:{" "}
                                <strong>
                                    {{
                                        store_credit: "Store Credit",
                                        replacement: "Replacement",
                                        refund_cash: "Cash Refund",
                                    }[salesReturn.return_type] ||
                                        salesReturn.return_type}
                                </strong>
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px] border-collapse text-sm">
                                <thead>
                                    <tr className="border-y border-slate-300 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                                        <th className="px-3 py-3">Product</th>
                                        <th className="px-3 py-3 text-right">Qty returned</th>
                                        <th className="px-3 py-3 text-right">Unit price</th>
                                        <th className="px-3 py-3">Reason</th>
                                        <th className="px-3 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-slate-100 align-top"
                                        >
                                            <td className="px-3 py-3">
                                                <p className="font-semibold">
                                                    {item.product?.title || "Product"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {item.product?.sku ||
                                                        item.product?.barcode ||
                                                        ""}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {item.qty_return}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {formatCurrency(
                                                    item.unit_price,
                                                    currencySettings
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                {item.return_reason || "-"}
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold">
                                                {formatCurrency(
                                                    item.subtotal,
                                                    currencySettings
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {!items.length && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="px-3 py-10 text-center text-slate-500"
                                            >
                                                No return items on this invoice.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-5">
                        <dl className="w-full max-w-sm space-y-2 text-sm">
                            <div className="flex justify-between gap-6">
                                <dt className="text-slate-600">Return amount</dt>
                                <dd className="font-semibold">
                                    {formatCurrency(
                                        salesReturn.total_return_amount,
                                        currencySettings
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-6">
                                <dt className="text-slate-600">Cash refund</dt>
                                <dd>
                                    {formatCurrency(
                                        salesReturn.refund_amount,
                                        currencySettings
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-6">
                                <dt className="text-slate-600">Store credit</dt>
                                <dd>
                                    {formatCurrency(
                                        salesReturn.credited_amount,
                                        currencySettings
                                    )}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {salesReturn.notes && (
                        <section className="border-t border-slate-200 px-6 py-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Notes
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">
                                {salesReturn.notes}
                            </p>
                        </section>
                    )}

                    <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-500">
                        <p>
                            {salesReturn.status === "completed"
                                ? "This return has been completed."
                                : "Draft invoice — settlement is not final until the return is completed."}
                        </p>
                        <p className="mt-1">
                            {storeProfile.name || "Your Store"} · Sales Return Invoice
                        </p>
                    </footer>
                </article>
            </main>
            <style>{`
                @page { size: portrait; margin: 12mm; }
                @media print {
                    html, body { background: white !important; color: #0f172a !important; }
                    main { max-width: none !important; padding: 0 !important; }
                    article, section, table, tr { break-inside: avoid; page-break-inside: avoid; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}
