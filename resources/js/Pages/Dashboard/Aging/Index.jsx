import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import {
    IconAlertTriangle,
    IconChartBar,
    IconClock,
    IconCurrencyDollar,
    IconReceipt,
    IconTruck,
} from "@tabler/icons-react";
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

const agingBucketLabel = (bucket, t) => {
    const map = {
        current: t("aging.bucket.current"),
        "0-30": t("aging.bucket.days0to30"),
        "31-60": t("aging.bucket.days31to60"),
        "61-90": t("aging.bucket.days61to90"),
        "90+": t("aging.bucket.days90plus"),
        paid: t("aging.bucket.paid"),
    };
    return map[bucket] || bucket;
};

const agingBucketColor = (bucket) => {
    const map = {
        current: "bg-success-100 text-success-700 dark:bg-success-950/30 dark:text-success-400",
        "0-30": "bg-success-100 text-success-700 dark:bg-success-950/30 dark:text-success-400",
        "31-60": "bg-warning-100 text-warning-700 dark:bg-warning-950/30 dark:text-warning-400",
        "61-90": "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
        "90+": "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
        paid: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    };
    return map[bucket] || "bg-slate-100 text-slate-600";
};

export default function AgingIndex() {
    const { t } = useTranslation();
    const { payableAgingSummary, receivableAgingSummary, payableNotifications, receivableNotifications } = usePage().props;

    const payableTotalOutstanding = payableAgingSummary?.reduce((s, b) => s + (b.remaining || 0), 0) || 0;
    const receivableTotalOutstanding = receivableAgingSummary?.reduce((s, b) => s + (b.remaining || 0), 0) || 0;

    const payablesDueSoon = payableNotifications?.length || 0;
    const receivablesDueSoon = receivableNotifications?.length || 0;

    return (
        <>
            <Head title={t("aging.title")} />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <IconChartBar size={28} className="text-primary-500" />
                        {t("aging.title")}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t("aging.subtitle")}
                    </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                                <IconTruck size={20} className="text-rose-500" />
                            </div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("aging.totalPayables")}</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(payableTotalOutstanding)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{payablesDueSoon} {t("aging.payablesDueSoon")}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-950/30">
                                <IconReceipt size={20} className="text-primary-500" />
                            </div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("aging.totalReceivables")}</p>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatCurrency(receivableTotalOutstanding)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{receivablesDueSoon} {t("aging.receivablesDueSoon")}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                                <IconAlertTriangle size={20} className="text-amber-500" />
                            </div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("aging.payableOverdue")}</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">
                            {formatCurrency(
                                (payableAgingSummary?.find((b) => b.bucket === "90+")?.remaining || 0) +
                                (payableAgingSummary?.find((b) => b.bucket === "61-90")?.remaining || 0)
                            )}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{t("aging.daysOver61")}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                                <IconReceipt size={20} className="text-rose-500" />
                            </div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t("aging.receivableOverdue")}</p>
                        </div>
                        <p className="text-2xl font-bold text-rose-600">
                            {formatCurrency(
                                (receivableAgingSummary?.find((b) => b.bucket === "90+")?.remaining || 0) +
                                (receivableAgingSummary?.find((b) => b.bucket === "61-90")?.remaining || 0)
                            )}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{t("aging.daysOver61")}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payable Aging */}
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <IconTruck size={20} className="text-rose-500" />
                                {t("aging.payableAging")}
                            </h2>
                        </div>
                        <div className="p-5">
                            <div className="space-y-3 mb-6">
                                {payableAgingSummary?.map((bucket) => (
                                    <div key={bucket.bucket} className="flex items-center justify-between">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${agingBucketColor(bucket.bucket)}`}>
                                            {agingBucketLabel(bucket.bucket, t)}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {formatCurrency(bucket.remaining)}
                                            </p>
                                            <p className="text-xs text-slate-500">{bucket.count} {t("aging.notes")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {payableNotifications?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                                        <IconClock size={16} className="text-warning-500" />
                                        {t("aging.payableNotifications")}
                                    </h3>
                                    <div className="space-y-2">
                                        {payableNotifications.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={route("payables.show", item.id)}
                                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-white">{item.title}</p>
                                                    <p className="text-xs text-slate-500">{item.time}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-warning-600">{item.subtitle}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Receivable Aging */}
                    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <IconReceipt size={20} className="text-primary-500" />
                                {t("aging.receivableAging")}
                            </h2>
                        </div>
                        <div className="p-5">
                            <div className="space-y-3 mb-6">
                                {receivableAgingSummary?.map((bucket) => (
                                    <div key={bucket.bucket} className="flex items-center justify-between">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${agingBucketColor(bucket.bucket)}`}>
                                            {agingBucketLabel(bucket.bucket, t)}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {formatCurrency(bucket.remaining)}
                                            </p>
                                            <p className="text-xs text-slate-500">{bucket.count} {t("aging.notes")}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {receivableNotifications?.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                                        <IconClock size={16} className="text-warning-500" />
                                        {t("aging.receivableNotifications")}
                                    </h3>
                                    <div className="space-y-2">
                                        {receivableNotifications.map((item) => (
                                            <Link
                                                key={item.id}
                                                href={route("receivables.show", item.id)}
                                                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-white">{item.title}</p>
                                                    <p className="text-xs text-slate-500">{item.time}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-warning-600">{item.subtitle}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

AgingIndex.layout = (page) => <DashboardLayout children={page} />;