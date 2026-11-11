import React, { useEffect, useMemo } from "react";
import { Head, usePage } from "@inertiajs/react";

const numberValue = (value) => Number(value || 0);

const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat("en-PK", {
              dateStyle: "long",
          }).format(new Date(`${value}T12:00:00`))
        : "";

const formatDateTime = (value) =>
    value
        ? new Intl.DateTimeFormat("en-PK", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "-";

const formatPaymentMethod = (value) =>
    (value || "unknown")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function DailySalesPrint({
    sales = [],
    date,
    summary = {},
    autoPrint = false,
}) {
    const { storeProfile = {}, currencySettings = {} } = usePage().props;
    const currencyCode = currencySettings.code || "PKR";
    const currencyLocale = currencySettings.locale || "en-PK";
    const decimalPlaces = Number.isInteger(currencySettings.decimalPlaces)
        ? currencySettings.decimalPlaces
        : 2;
    const generatedAt = useMemo(() => new Date(), []);

    const formatCurrency = (value = 0) =>
        new Intl.NumberFormat(currencyLocale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(numberValue(value));

    const dailyPayments = useMemo(() => {
        const totals = new Map();
        sales.forEach((sale) => {
            const method = sale.payment_method || "unknown";
            totals.set(method, (totals.get(method) || 0) + numberValue(sale.grand_total));
        });
        return Array.from(totals, ([method, total]) => ({ method, total }));
    }, [sales]);

    useEffect(() => {
        if (!autoPrint) {
            return undefined;
        }
        const timer = window.setTimeout(() => window.print(), 500);
        return () => window.clearTimeout(timer);
    }, [autoPrint]);

    return (
        <>
            <Head title={`Daily Sales Report - ${date}`} />
            <main className="report-shell mx-auto max-w-6xl px-6 py-8 pb-32 text-slate-900">
                <div className="mb-6 flex justify-end print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
                    >
                        Print report
                    </button>
                </div>

                <header className="report-header mb-7 border-b-2 border-slate-900 pb-5">
                    <div className="flex items-start justify-between gap-8">
                        <div className="flex min-w-0 items-center gap-4">
                            {storeProfile.logo ? (
                                <img
                                    src={storeProfile.logo}
                                    alt={`${storeProfile.name || "Store"} logo`}
                                    className="h-16 w-16 rounded-xl object-contain"
                                />
                            ) : (
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl font-black text-white">
                                    {(storeProfile.name || "S").slice(0, 1).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                                    Daily sales statement
                                </p>
                                <h1 className="mt-1 text-3xl font-black tracking-tight">
                                    {storeProfile.name || "Store"}
                                </h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    {[storeProfile.address, storeProfile.city]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                                <p className="text-sm text-slate-600">
                                    {[storeProfile.phone, storeProfile.email, storeProfile.website]
                                        .filter(Boolean)
                                        .join("  |  ")}
                                </p>
                            </div>
                        </div>
                        <div className="min-w-[220px] text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                                Sales report
                            </p>
                            <p className="mt-1 text-xl font-bold">{formatDate(date)}</p>
                            <p className="mt-2 text-xs text-slate-500">
                                Generated {formatDateTime(generatedAt.toISOString())}
                            </p>
                            <p className="text-xs text-slate-500">
                                Currency: {currencyCode}
                            </p>
                        </div>
                    </div>
                </header>

                <section aria-label="Daily sales summary" className="mb-8">
                    <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold">Daily overview</h2>
                            <p className="text-sm text-slate-500">
                                Reconciled from all sales recorded on this date
                            </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-600">
                            {numberValue(summary.orders_count)} transactions
                            <span className="mx-2 text-slate-300">•</span>
                            {numberValue(summary.items_sold)} items sold
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Item subtotal
                            </p>
                            <p className="mt-1 text-lg font-bold">
                                {formatCurrency(summary.item_subtotal)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total discounts
                            </p>
                            <p className="mt-1 text-lg font-bold">
                                {formatCurrency(
                                    numberValue(summary.promotion_discount_total) +
                                        numberValue(summary.discount_total)
                                )}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Sales tax
                            </p>
                            <p className="mt-1 text-lg font-bold">
                                {formatCurrency(summary.tax_total)}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-900 bg-slate-900 p-4 text-white">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                                Total sales
                            </p>
                            <p className="mt-1 text-lg font-bold">
                                {formatCurrency(summary.revenue_total)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-y border-slate-200 py-3 text-sm">
                        <p>
                            <span className="text-slate-500">Shipping collected:</span>{" "}
                            <strong>{formatCurrency(summary.shipping_total)}</strong>
                        </p>
                        <p>
                            <span className="text-slate-500">Sales by payment method:</span>{" "}
                            {dailyPayments.length
                                ? dailyPayments
                                      .map(
                                          ({ method, total }) =>
                                              `${formatPaymentMethod(method)} ${formatCurrency(total)}`
                                      )
                                      .join("  ·  ")
                                : "No payments"}
                        </p>
                    </div>
                </section>

                <section aria-label="Sales transactions" className="space-y-6">
                    <div className="flex items-end justify-between border-b border-slate-300 pb-2">
                        <div>
                            <h2 className="text-lg font-bold">Transaction details</h2>
                            <p className="text-sm text-slate-500">
                                Item quantities, unit prices, discounts, tax and invoice totals
                            </p>
                        </div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {sales.length} {sales.length === 1 ? "invoice" : "invoices"}
                        </p>
                    </div>

                    {sales.length ? (
                        sales.map((sale, saleIndex) => {
                            const items = sale.details || [];
                            const promotionDiscount = items.reduce(
                                (total, item) => total + numberValue(item.discount_total),
                                0
                            );
                            const itemSubtotal = items.reduce(
                                (total, item) =>
                                    total +
                                    numberValue(item.price) +
                                    numberValue(item.discount_total),
                                0
                            );
                            const invoiceDiscount =
                                numberValue(sale.discount) +
                                numberValue(sale.loyalty_discount_total) +
                                numberValue(sale.customer_voucher_discount);

                            return (
                                <article
                                    key={sale.id}
                                    className="sale-card overflow-hidden rounded-xl border border-slate-300"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-4 bg-slate-100 px-5 py-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Sale {String(saleIndex + 1).padStart(2, "0")}
                                            </p>
                                            <h3 className="mt-1 text-lg font-bold">
                                                {sale.invoice || `Transaction #${sale.id}`}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {formatDateTime(sale.created_at)}
                                                {sale.warehouse?.name
                                                    ? `  ·  ${sale.warehouse.name}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                                            <span className="text-slate-500">Customer</span>
                                            <strong className="text-right">
                                                {sale.customer?.name || "Walk-in customer"}
                                            </strong>
                                            <span className="text-slate-500">Cashier</span>
                                            <strong className="text-right">
                                                {sale.cashier?.name || "-"}
                                            </strong>
                                            <span className="text-slate-500">Payment</span>
                                            <strong className="text-right">
                                                {formatPaymentMethod(sale.payment_method)}
                                            </strong>
                                            <span className="text-slate-500">Status</span>
                                            <strong className="text-right">
                                                {formatPaymentMethod(sale.payment_status)}
                                            </strong>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto px-4 py-2">
                                        <table className="w-full min-w-[760px] border-collapse text-sm">
                                            <thead>
                                                <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
                                                    <th className="px-2 py-2 text-center">#</th>
                                                    <th className="px-2 py-2">Item / SKU</th>
                                                    <th className="px-2 py-2">Variant</th>
                                                    <th className="px-2 py-2 text-right">Qty</th>
                                                    <th className="px-2 py-2 text-right">Unit price</th>
                                                    <th className="px-2 py-2 text-right">Promo discount</th>
                                                    <th className="px-2 py-2 text-right">Line total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.length ? (
                                                    items.map((item, itemIndex) => (
                                                        <tr
                                                            key={item.id}
                                                            className="border-b border-slate-100 align-top"
                                                        >
                                                            <td className="px-2 py-2.5 text-center text-slate-500">
                                                                {itemIndex + 1}
                                                            </td>
                                                            <td className="px-2 py-2.5">
                                                                <p className="font-semibold">
                                                                    {item.product?.title ||
                                                                        `Product #${item.product_id}`}
                                                                </p>
                                                                {item.product?.sku && (
                                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                                        SKU: {item.product.sku}
                                                                    </p>
                                                                )}
                                                                {item.pricing_rule_name && (
                                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                                        Promotion: {item.pricing_rule_name}
                                                                    </p>
                                                                )}
                                                            </td>
                                                            <td className="px-2 py-2.5 text-slate-600">
                                                                {item.variation_name || "-"}
                                                            </td>
                                                            <td className="px-2 py-2.5 text-right">
                                                                {numberValue(item.qty)}{" "}
                                                                {item.unit?.symbol || item.unit?.name || ""}
                                                            </td>
                                                            <td className="px-2 py-2.5 text-right">
                                                                {formatCurrency(
                                                                    item.unit_price ||
                                                                        numberValue(item.price) /
                                                                            Math.max(numberValue(item.qty), 1)
                                                                )}
                                                            </td>
                                                            <td className="px-2 py-2.5 text-right">
                                                                {numberValue(item.discount_total)
                                                                    ? `− ${formatCurrency(item.discount_total)}`
                                                                    : "-"}
                                                            </td>
                                                            <td className="px-2 py-2.5 text-right font-semibold">
                                                                {formatCurrency(item.price)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={7}
                                                            className="px-2 py-5 text-center text-slate-500"
                                                        >
                                                            No item details are available for this transaction.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-4">
                                        <dl className="w-full max-w-sm space-y-1.5 text-sm">
                                            <div className="flex justify-between gap-6">
                                                <dt className="text-slate-600">Item subtotal</dt>
                                                <dd className="font-medium">
                                                    {formatCurrency(itemSubtotal)}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between gap-6">
                                                <dt className="text-slate-600">Promotion discount</dt>
                                                <dd>
                                                    {promotionDiscount
                                                        ? `− ${formatCurrency(promotionDiscount)}`
                                                        : formatCurrency(0)}
                                                </dd>
                                            </div>
                                            <div className="flex justify-between gap-6 border-t border-slate-200 pt-1">
                                                <dt className="text-slate-600">
                                                    Subtotal after promotions
                                                </dt>
                                                <dd className="font-medium">
                                                    {formatCurrency(itemSubtotal - promotionDiscount)}
                                                </dd>
                                            </div>
                                            {numberValue(sale.discount) > 0 && (
                                                <div className="flex justify-between gap-6">
                                                    <dt className="text-slate-600">Manual discount</dt>
                                                    <dd>− {formatCurrency(sale.discount)}</dd>
                                                </div>
                                            )}
                                            {numberValue(sale.loyalty_discount_total) > 0 && (
                                                <div className="flex justify-between gap-6">
                                                    <dt className="text-slate-600">Loyalty discount</dt>
                                                    <dd>− {formatCurrency(sale.loyalty_discount_total)}</dd>
                                                </div>
                                            )}
                                            {numberValue(sale.customer_voucher_discount) > 0 && (
                                                <div className="flex justify-between gap-6">
                                                    <dt className="text-slate-600">Voucher discount</dt>
                                                    <dd>
                                                        − {formatCurrency(sale.customer_voucher_discount)}
                                                    </dd>
                                                </div>
                                            )}
                                            {numberValue(sale.shipping_cost) > 0 && (
                                                <div className="flex justify-between gap-6">
                                                    <dt className="text-slate-600">Shipping</dt>
                                                    <dd>+ {formatCurrency(sale.shipping_cost)}</dd>
                                                </div>
                                            )}
                                            {numberValue(sale.tax_total) > 0 && (
                                                <div className="flex justify-between gap-6">
                                                    <dt className="text-slate-600">
                                                        Sales tax
                                                    </dt>
                                                    <dd>+ {formatCurrency(sale.tax_total)}</dd>
                                                </div>
                                            )}
                                            <div className="flex justify-between gap-6 border-t-2 border-slate-900 pt-2 text-base font-black">
                                                <dt>Invoice total</dt>
                                                <dd>{formatCurrency(sale.grand_total)}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center">
                            <p className="text-lg font-semibold">No sales recorded</p>
                            <p className="mt-1 text-sm text-slate-500">
                                There were no transactions for {formatDate(date)}.
                            </p>
                        </div>
                    )}
                </section>

                <section aria-label="Daily reconciliation" className="mt-8">
                    <div className="ml-auto max-w-lg rounded-xl border-2 border-slate-900 p-5">
                        <h2 className="mb-3 text-base font-bold">Daily reconciliation</h2>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between gap-6">
                                <dt>Item subtotal before promotions</dt>
                                <dd>{formatCurrency(summary.item_subtotal)}</dd>
                            </div>
                            <div className="flex justify-between gap-6">
                                <dt>Total promotional discounts</dt>
                                <dd>− {formatCurrency(summary.promotion_discount_total)}</dd>
                            </div>
                            <div className="flex justify-between gap-6 border-t border-slate-200 pt-2">
                                <dt>Subtotal after promotions</dt>
                                <dd>
                                    {formatCurrency(
                                        numberValue(summary.item_subtotal) -
                                            numberValue(summary.promotion_discount_total)
                                    )}
                                </dd>
                            </div>
                            <div className="flex justify-between gap-6">
                                <dt>Other discounts</dt>
                                <dd>− {formatCurrency(summary.discount_total)}</dd>
                            </div>
                            <div className="flex justify-between gap-6">
                                <dt>Shipping collected</dt>
                                <dd>+ {formatCurrency(summary.shipping_total)}</dd>
                            </div>
                            <div className="flex justify-between gap-6">
                                <dt>Sales tax collected</dt>
                                <dd>+ {formatCurrency(summary.tax_total)}</dd>
                            </div>
                            <div className="flex justify-between gap-6 border-t-2 border-slate-900 pt-2 text-lg font-black">
                                <dt>Total sales</dt>
                                <dd>{formatCurrency(summary.revenue_total)}</dd>
                            </div>
                        </dl>
                    </div>
                    <p className="mt-3 text-right text-xs text-slate-500">
                        Net sales are reported from the recorded transaction totals.
                    </p>
                </section>

                <footer className="report-footer mt-10 border-t border-slate-300 pt-4">
                    <div className="mb-8 grid grid-cols-2 gap-16">
                        <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">
                            Prepared by
                        </div>
                        <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">
                            Reviewed / authorized by
                        </div>
                    </div>
                    <div className="flex justify-between gap-4 text-[10px] text-slate-500">
                        <span>
                            {storeProfile.name || "Store"} · Internal sales record · Generated{" "}
                            {formatDateTime(generatedAt.toISOString())}
                        </span>
                        <span>End of report</span>
                    </div>
                </footer>
            </main>
            <style>{`
                @page { size: landscape; margin: 11mm; }
                @media print {
                    html, body { background: white !important; color: #0f172a !important; }
                    body { font-size: 10pt; }
                    .report-shell { max-width: none !important; padding: 0 0 18mm !important; }
                    .sale-card { break-inside: auto; page-break-inside: auto; }
                    .sale-card > div:first-child { break-after: avoid; page-break-after: avoid; }
                    table { break-inside: auto; page-break-inside: auto; }
                    thead { display: table-header-group; }
                    tr { break-inside: avoid; page-break-inside: avoid; }
                    .report-footer { break-inside: avoid; page-break-inside: avoid; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}
