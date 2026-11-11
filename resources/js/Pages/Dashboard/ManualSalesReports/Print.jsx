import React, { useMemo } from "react";
import { Head, usePage } from "@inertiajs/react";

const numberValue = (value) => Number(value || 0);

const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat("en-PK", { dateStyle: "long" }).format(
              new Date(`${String(value).slice(0, 10)}T12:00:00`)
          )
        : "-";

const formatDateTime = (value) =>
    new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(value);

export default function Print({ report }) {
    const { storeProfile = {}, currencySettings = {} } = usePage().props;
    const currencyCode = currencySettings.code || "PKR";
    const currencyLocale = currencySettings.locale || "en-PK";
    const decimalPlaces = Number.isInteger(currencySettings.decimalPlaces)
        ? currencySettings.decimalPlaces
        : 2;
    const generatedAt = useMemo(() => new Date(), []);
    const formatCurrency = (value) =>
        new Intl.NumberFormat(currencyLocale, {
            style: "currency",
            currency: currencyCode,
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces,
        }).format(numberValue(value));

    return (
        <>
            <Head title={`Manual Sales Report - ${report.code}`} />
            <main className="report-shell mx-auto max-w-5xl px-6 py-8 pb-32 text-slate-900">
                <div className="mb-6 flex justify-end print:hidden">
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
                    >
                        Print report
                    </button>
                </div>

                <header className="mb-7 border-b-2 border-slate-900 pb-5">
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
                                    Manual sales statement
                                </p>
                                <h1 className="mt-1 text-3xl font-black tracking-tight">
                                    {storeProfile.name || "Store"}
                                </h1>
                                <p className="mt-1 text-sm text-slate-600">
                                    {[storeProfile.address, storeProfile.city].filter(Boolean).join(", ")}
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
                                Manual sales report
                            </p>
                            <p className="mt-1 text-xl font-bold">{formatDate(report.report_date)}</p>
                            <p className="mt-1 text-sm font-semibold">{report.code}</p>
                            <p className="mt-2 text-xs text-slate-500">
                                Generated {formatDateTime(generatedAt)}
                            </p>
                            <p className="text-xs text-slate-500">Currency: {currencyCode}</p>
                        </div>
                    </div>
                </header>

                <section className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Vendor / supplier</p>
                        <p className="mt-1 font-semibold">{report.vendor_name}</p>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Invoice / reference</p>
                        <p className="mt-1 font-semibold">{report.reference_number || "-"}</p>
                    </div>
                    {report.notes && (
                        <div className="sm:col-span-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Notes</p>
                            <p className="mt-1 whitespace-pre-wrap text-sm">{report.notes}</p>
                        </div>
                    )}
                </section>

                <section>
                    <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold">Sales details</h2>
                            <p className="text-sm text-slate-500">
                                Manually entered values; this report does not change POS transactions.
                            </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-600">
                            {report.items?.length || 0} items
                        </p>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[720px] border-collapse text-sm">
                            <thead className="bg-slate-100">
                                <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-600">
                                    <th className="px-3 py-3 text-center">#</th>
                                    <th className="px-3 py-3">Item</th>
                                    <th className="px-3 py-3 text-right">Qty</th>
                                    <th className="px-3 py-3 text-right">Unit rate</th>
                                    <th className="px-3 py-3 text-right">Subtotal</th>
                                    <th className="px-3 py-3 text-right">Tax</th>
                                    <th className="px-3 py-3 text-right">Line total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.items?.map((item, index) => (
                                    <tr key={item.id} className="border-b border-slate-100">
                                        <td className="px-3 py-3 text-center text-slate-500">{index + 1}</td>
                                        <td className="px-3 py-3 font-semibold">{item.description}</td>
                                        <td className="px-3 py-3 text-right">{numberValue(item.quantity)}</td>
                                        <td className="px-3 py-3 text-right">{formatCurrency(item.unit_rate)}</td>
                                        <td className="px-3 py-3 text-right">{formatCurrency(item.subtotal)}</td>
                                        <td className="px-3 py-3 text-right">
                                            {formatCurrency(item.tax_amount)}
                                            <span className="block text-xs text-slate-500">
                                                {item.tax_type === "percentage"
                                                    ? `${numberValue(item.tax_value)}%`
                                                    : "Fixed"}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right font-semibold">
                                            {formatCurrency(item.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section aria-label="Report totals" className="mt-8">
                    <div className="ml-auto max-w-md rounded-xl border-2 border-slate-900 p-5">
                        <h2 className="mb-3 text-base font-bold">Report summary</h2>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between gap-6">
                                <dt>Item subtotal</dt>
                                <dd>{formatCurrency(report.subtotal)}</dd>
                            </div>
                            <div className="flex justify-between gap-6">
                                <dt>Sales tax</dt>
                                <dd>+ {formatCurrency(report.tax_total)}</dd>
                            </div>
                            <div className="flex justify-between gap-6 border-t-2 border-slate-900 pt-2 text-lg font-black">
                                <dt>Total sales</dt>
                                <dd>{formatCurrency(report.grand_total)}</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                <footer className="mt-10 border-t border-slate-300 pt-4">
                    <div className="mb-8 grid grid-cols-2 gap-16">
                        <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">Prepared by</div>
                        <div className="border-t border-slate-400 pt-2 text-xs text-slate-500">
                            Reviewed / authorized by
                        </div>
                    </div>
                    <div className="flex justify-between gap-4 text-[10px] text-slate-500">
                        <span>
                            {storeProfile.name || "Store"} · Manual report · Created by{" "}
                            {report.creator?.name || "User"}
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
                    thead { display: table-header-group; }
                    tr { break-inside: avoid; page-break-inside: avoid; }
                    footer { break-inside: avoid; page-break-inside: avoid; }
                    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
        </>
    );
}
