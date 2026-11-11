import React, { useEffect, useMemo, useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import InputSelect from "@/Components/Dashboard/InputSelect";
import Pagination from "@/Components/Dashboard/Pagination";
import {
    IconCoin,
    IconDatabaseOff,
    IconDiscount2,
    IconReceipt2,
    IconShoppingBag,
    IconTrendingUp,
    IconFilter,
    IconX,
    IconSearch,
    IconPrinter,
} from "@tabler/icons-react";

const MetricCard = ({ icon, label, value, hint, tone }) => (
    <div
        className={`rounded-2xl border p-5 shadow-sm ${tone}`}
    >
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-75">
                    {label}
                </p>
                <p className="mt-3 text-2xl font-extrabold tracking-tight">
                    {value}
                </p>
                <p className="mt-1 text-xs opacity-70">{hint}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-2.5">
                {React.cloneElement(icon, { size: 20 })}
            </div>
        </div>
    </div>
);

const Panel = ({ title, subtitle, children, className = "" }) => (
    <section
        className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
        <div className="mb-5">
            <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {subtitle}
                </p>
            )}
        </div>
        {children}
    </section>
);

const SalesTrend = ({ data }) => {
    const { currencySettings = {} } = usePage().props;
    if (!data.length) {
        return (
            <div className="flex h-56 items-center justify-center text-sm text-slate-400">
                No sales recorded for this period.
            </div>
        );
    }

    const width = 760;
    const height = 220;
    const padding = { top: 16, right: 12, bottom: 28, left: 12 };
    const values = data.map((item) => Number(item.total) || 0);
    const max = Math.max(...values, 1);
    const points = values.map((value, index) => {
        const x =
            padding.left +
            (index / Math.max(data.length - 1, 1)) *
                (width - padding.left - padding.right);
        const y =
            height -
            padding.bottom -
            (value / max) * (height - padding.top - padding.bottom);
        return { x, y, value };
    });
    const line = points.map(({ x, y }) => `${x},${y}`).join(" ");
    const first = points[0];
    const last = points[points.length - 1];
    const area = `${first.x},${height - padding.bottom} ${line} ${last.x},${height - padding.bottom}`;
    const tickCount = Math.min(data.length, 6);
    const labelIndexes = new Set(
        Array.from({ length: tickCount }, (_, index) =>
            Math.round(
                (index * (data.length - 1)) / Math.max(tickCount - 1, 1)
            )
        )
    );

    return (
        <div>
            <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{formatCurrency(max, currencySettings)}</span>
                <span>Net sales per day</span>
            </div>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="mt-3 h-56 w-full overflow-visible"
                role="img"
                aria-label="Daily net sales trend"
            >
                {[0.25, 0.5, 0.75, 1].map((fraction) => {
                    const y =
                        height -
                        padding.bottom -
                        fraction * (height - padding.top - padding.bottom);
                    return (
                        <line
                            key={fraction}
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={y}
                            y2={y}
                            stroke="#e2e8f0"
                            strokeDasharray="4 5"
                        />
                    );
                })}
                <polygon points={area} fill="url(#salesTrendFill)" />
                <defs>
                    <linearGradient id="salesTrendFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.22" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0.01" />
                    </linearGradient>
                </defs>
                <polyline
                    points={line}
                    fill="none"
                    stroke="#15803d"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {points.map(({ x, y }, index) => (
                    <circle
                        key={data[index].date}
                        cx={x}
                        cy={y}
                        r={data.length < 20 ? 3.5 : 2}
                        fill="#15803d"
                        stroke="white"
                        strokeWidth="1.5"
                    >
                        <title>
                            {data[index].date}:{" "}
                            {formatCurrency(values[index], currencySettings)}
                        </title>
                    </circle>
                ))}
            </svg>
            <div className="flex justify-between gap-2 text-[10px] text-slate-500">
                {Array.from(labelIndexes)
                    .sort((a, b) => a - b)
                    .map((index) => (
                        <span key={data[index].date}>
                            {new Date(`${data[index].date}T00:00:00`).toLocaleDateString(
                                "en-PK",
                                { day: "2-digit", month: "short" }
                            )}
                        </span>
                    ))}
            </div>
        </div>
    );
};

const PaymentBreakdown = ({ data }) => {
    const { currencySettings = {} } = usePage().props;
    const colors = ["#15803d", "#2563eb", "#f59e0b", "#9333ea", "#0f766e", "#64748b"];
    const total = data.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const circumference = 2 * Math.PI * 42;
    let offset = 0;

    return (
        <div className="grid items-center gap-5 sm:grid-cols-[150px_1fr]">
            <div className="relative mx-auto h-36 w-36">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="12"
                    />
                    {data.map((item, index) => {
                        const value = Number(item.total) || 0;
                        const segment = total ? (value / total) * circumference : 0;
                        const circle = (
                            <circle
                                key={item.label}
                                cx="50"
                                cy="50"
                                r="42"
                                fill="none"
                                stroke={colors[index % colors.length]}
                                strokeWidth="12"
                                strokeDasharray={`${segment} ${circumference - segment}`}
                                strokeDashoffset={-offset}
                            >
                                <title>
                                    {paymentMethodLabel(item.label)}:{" "}
                                    {formatCurrency(value, currencySettings)}
                                </title>
                            </circle>
                        );
                        offset += segment;
                        return circle;
                    })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold uppercase text-slate-500">
                        Invoice Total
                    </span>
                    <span className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(total, currencySettings)}
                    </span>
                </div>
            </div>
            <div className="space-y-3">
                {data.length ? (
                    data.map((item, index) => (
                        <div
                            key={item.label}
                            className="flex items-center justify-between gap-3 text-sm"
                        >
                            <div className="flex min-w-0 items-center gap-2">
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{
                                        backgroundColor:
                                            colors[index % colors.length],
                                    }}
                                />
                                <span className="truncate text-slate-600 dark:text-slate-300">
                                    {paymentMethodLabel(item.label)}
                                </span>
                            </div>
                            <span className="shrink-0 font-semibold text-slate-800 dark:text-slate-200">
                                {formatCurrency(item.total)}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-slate-400">No payment data yet.</p>
                )}
            </div>
        </div>
    );
};

const RankingList = ({ data, valueFormatter, emptyMessage }) => {
    const max = Math.max(...data.map((item) => Number(item.total) || 0), 1);

    return data.length ? (
        <div className="space-y-4">
            {data.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-200">
                            {humanize(item.label || `Product #${item.product_id}`)}
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {valueFormatter(item.total)}
                        </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                            className="h-full rounded-full bg-emerald-600"
                            style={{
                                width: `${Math.max(
                                    3,
                                    ((Number(item.total) || 0) / max) * 100
                                )}%`,
                            }}
                        />
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <p className="text-sm text-slate-400">{emptyMessage}</p>
    );
};

const humanize = (value) => {
    const normalized = String(value || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
    return normalized === "In Store" ? "In-store" : normalized;
};

const paymentMethodLabel = (value) =>
    String(value || "").toLowerCase() === "pay_later"
        ? "Credit"
        : humanize(value);

const defaultFilterState = {
    start_date: "",
    end_date: "",
    invoice: "",
    cashier_id: "",
    customer_id: "",
    warehouse_id: "",
};

const formatCurrency = (value = 0, settings = {}) =>
    new Intl.NumberFormat(settings.locale || "en-PK", {
        style: "currency",
        currency: settings.code || "PKR",
        minimumFractionDigits: Number.isInteger(settings.decimalPlaces)
            ? settings.decimalPlaces
            : 0,
        maximumFractionDigits: Number.isInteger(settings.decimalPlaces)
            ? settings.decimalPlaces
            : 0,
    }).format(value);

const formatPkr = (value = 0) =>
    `Rs. ${Number(value || 0).toLocaleString("en-PK", {
        maximumFractionDigits: 0,
    })}`;

const castFilterString = (value) =>
    typeof value === "number" ? String(value) : value ?? "";

const Sales = ({
    transactions,
    summary,
    analytics = {},
    filters,
    cashiers,
    customers,
    warehouses = [],
}) => {
    const { storeProfile = {}, currencySettings = {} } = usePage().props;
    const reportCurrency = formatPkr;
    const [showFilters, setShowFilters] = useState(false);
    const [filterData, setFilterData] = useState({
        ...defaultFilterState,
        start_date: castFilterString(filters?.start_date),
        end_date: castFilterString(filters?.end_date),
        invoice: castFilterString(filters?.invoice),
        cashier_id: castFilterString(filters?.cashier_id),
        customer_id: castFilterString(filters?.customer_id),
        warehouse_id: castFilterString(filters?.warehouse_id),
    });

    const cashierFromFilters = useMemo(
        () =>
            cashiers.find(
                (c) => castFilterString(c.id) === filterData.cashier_id
            ) ?? null,
        [cashiers, filterData.cashier_id]
    );

    const customerFromFilters = useMemo(
        () =>
            customers.find(
                (c) => castFilterString(c.id) === filterData.customer_id
            ) ?? null,
        [customers, filterData.customer_id]
    );

    const [selectedCashier, setSelectedCashier] = useState(cashierFromFilters);
    const [selectedCustomer, setSelectedCustomer] =
        useState(customerFromFilters);

    useEffect(
        () => setSelectedCashier(cashierFromFilters),
        [cashierFromFilters]
    );
    useEffect(
        () => setSelectedCustomer(customerFromFilters),
        [customerFromFilters]
    );
    useEffect(() => {
        setFilterData({
            ...defaultFilterState,
            start_date: castFilterString(filters?.start_date),
            end_date: castFilterString(filters?.end_date),
            invoice: castFilterString(filters?.invoice),
            cashier_id: castFilterString(filters?.cashier_id),
            customer_id: castFilterString(filters?.customer_id),
            warehouse_id: castFilterString(filters?.warehouse_id),
        });
    }, [filters]);

    const handleChange = (field, value) =>
        setFilterData((prev) => ({ ...prev, [field]: value }));
    const handleSelectCashier = (value) => {
        setSelectedCashier(value);
        handleChange("cashier_id", value ? String(value.id) : "");
    };
    const handleSelectCustomer = (value) => {
        setSelectedCustomer(value);
        handleChange("customer_id", value ? String(value.id) : "");
    };

    const applyFilters = (e) => {
        e.preventDefault();
        router.get(route("reports.sales.index"), filterData, {
            preserveScroll: true,
            preserveState: true,
        });
        setShowFilters(false);
    };

    const resetFilters = () => {
        setFilterData(defaultFilterState);
        setSelectedCashier(null);
        setSelectedCustomer(null);
        router.get(route("reports.sales.index"), defaultFilterState, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const printReport = () => window.print();
    const rows = transactions?.data ?? [];
    const paginationLinks = transactions?.links ?? [];
    const currentPage = transactions?.current_page ?? 1;
    const perPage = transactions?.per_page
        ? Number(transactions?.per_page)
        : rows.length || 1;

    const hasActiveFilters =
        filterData.invoice ||
        filterData.start_date ||
        filterData.end_date ||
        filterData.cashier_id ||
        filterData.customer_id ||
        filterData.warehouse_id;

    const safeSummary = {
        orders_count: summary?.orders_count ?? 0,
        revenue_total: summary?.revenue_total,
        net_sales_complete: summary?.net_sales_complete ?? true,
        gross_sales_total: summary?.gross_sales_total ?? 0,
        tax_total: summary?.tax_total,
        tax_complete: summary?.tax_complete ?? true,
        tax_rate: summary?.tax_rate,
        tax_rate_source: summary?.tax_rate_source,
        cost_total: summary?.cost_total,
        cost_complete: summary?.cost_complete ?? false,
        discount_total: summary?.discount_total ?? 0,
        items_sold: summary?.items_sold ?? 0,
        returns_total: summary?.returns_total ?? 0,
        cash_refund_total: summary?.cash_refund_total ?? 0,
        store_credit_total: summary?.store_credit_total ?? 0,
        returned_items: summary?.returned_items ?? 0,
        return_financials_complete: summary?.return_financials_complete ?? true,
        profit_total: summary?.profit_total,
        profit_margin: summary?.profit_margin,
        average_order: summary?.average_order ?? 0,
    };

    const dailySales = analytics?.daily_sales ?? [];
    const paymentMethods = analytics?.payment_methods ?? [];
    const orderTypes = analytics?.order_types ?? [];
    const categories = analytics?.categories ?? [];
    const topProducts = analytics?.top_products ?? [];
    const transactionDiscount = (transaction) =>
        Number(transaction.discount ?? 0) +
        Number(transaction.loyalty_discount_total ?? 0) +
        Number(transaction.customer_voucher_discount ?? 0) +
        (transaction.details ?? []).reduce(
            (total, detail) => total + Number(detail.discount_total ?? 0),
            0
        );
    const transactionCost = (transaction) => {
        const details = transaction.details ?? [];
        if (!details.length) {
            return null;
        }

        if (
            transaction.completed_return_financials_complete != null &&
            !Number(transaction.completed_return_financials_complete)
        ) {
            return null;
        }

        if (details.every((detail) => detail.cost_total != null)) {
            return details.reduce(
                (total, detail) => total + Number(detail.cost_total),
                0
            ) - Number(transaction.completed_return_restock_cost ?? 0);
        }

        if (
            details.some((detail) => detail.cost_total != null) ||
            Number(transaction.recorded_profit_rows) !==
                details.length +
                    Number(transaction.completed_return_items_count ?? 0)
        ) {
            return null;
        }

        const netSales = transactionNetSales(transaction);
        return netSales == null
            ? null
            : netSales - Number(transaction.recorded_profit ?? 0);
    };
    const transactionNetSales = (transaction) => {
        if (
            transaction.completed_return_financials_complete != null &&
            !Number(transaction.completed_return_financials_complete)
        ) {
            return null;
        }
        return (
            Number(transaction.grand_total ?? 0) -
            Number(transaction.tax_total ?? 0) -
            Number(transaction.shipping_cost ?? 0) -
            Number(transaction.completed_return_net_sales_total ?? 0)
        );
    };
    const transactionGrossProfit = (transaction) => {
        const cost = transactionCost(transaction);
        return cost == null ? null : transactionNetSales(transaction) - cost;
    };

    const summaryCards = [
        {
            label: "Gross Sales",
            value: reportCurrency(safeSummary.gross_sales_total),
            hint: "Invoice total plus discounts, less completed returns; includes tax and shipping",
            icon: <IconReceipt2 />,
            tone: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
        },
        {
            label: "Tax",
            value: safeSummary.tax_complete
                ? reportCurrency(safeSummary.tax_total)
                : "N/A",
            hint:
                !safeSummary.tax_complete
                    ? "Unavailable: completed returns lack tax snapshots"
                    : safeSummary.tax_rate == null
                      ? "No recorded tax rate for these transactions"
                    : `${Number(safeSummary.tax_rate).toLocaleString("en-US")}% ${
                          safeSummary.tax_rate_source === "recorded_transaction_rates"
                              ? "weighted saved invoice rate"
                              : "weighted taxable-amount rate"
                      }`,
            icon: <IconCoin />,
            tone: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
        },
        {
            label: "Net Sales",
            value: safeSummary.net_sales_complete
                ? reportCurrency(safeSummary.revenue_total)
                : "N/A",
            hint: safeSummary.net_sales_complete
                ? "After discounts and returned sales; excludes tax and shipping"
                : "Unavailable: completed returns lack financial snapshots",
            icon: <IconCoin />,
            tone: "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
        },
        {
            label: "Cost",
            value: safeSummary.cost_complete
                ? reportCurrency(safeSummary.cost_total)
                : "N/A",
            hint: safeSummary.cost_complete
                ? "Cost snapshots recorded at checkout"
                : "Legacy sales lack cost snapshots",
            icon: <IconReceipt2 />,
            tone: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
        },
        {
            label: "Gross Profit",
            value: safeSummary.cost_complete
                ? reportCurrency(safeSummary.profit_total)
                : "N/A",
            hint: safeSummary.cost_complete
                ? "Net sales minus cost"
                : "Unavailable until all sales have cost records",
            icon: <IconTrendingUp />,
            tone: "border-purple-200 bg-purple-50 text-purple-950 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-100",
        },
        {
            label: "Profit Margin",
            value: safeSummary.cost_complete
                ? `${Number(safeSummary.profit_margin).toLocaleString("en-US")}%`
                : "N/A",
            hint: safeSummary.cost_complete
                ? "Gross profit ÷ net sales"
                : "Unavailable until all sales have cost records",
            icon: <IconCoin />,
            tone: "border-teal-200 bg-teal-50 text-teal-950 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-100",
        },
        {
            label: "Orders",
            value: safeSummary.orders_count.toLocaleString("en-US"),
            hint: "Transactions in selected report",
            icon: <IconShoppingBag />,
            tone: "border-orange-200 bg-orange-50 text-orange-950 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-100",
        },
        {
            label: "Items Sold",
            value: safeSummary.items_sold.toLocaleString("en-US"),
            hint: "Total quantity sold",
            icon: <IconReceipt2 />,
            tone: "border-cyan-200 bg-cyan-50 text-cyan-950 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-100",
        },
        {
            label: "Discounts",
            value: reportCurrency(safeSummary.discount_total),
            hint: "Promotional, manual, loyalty, and voucher discounts",
            icon: <IconDiscount2 />,
            tone: "border-pink-200 bg-pink-50 text-pink-950 dark:border-pink-900 dark:bg-pink-950/40 dark:text-pink-100",
        },
    ];

    return (
        <>
            <Head title="Sales Report" />

            <div
                data-sales-report-print
                className="hidden print:block sales-report-print"
            >
                <header className="sales-print-header">
                    <div className="sales-print-store">
                        {storeProfile.logo ? (
                            <img
                                src={storeProfile.logo}
                                alt={`${storeProfile.name || "Store"} logo`}
                            />
                        ) : (
                            <div className="sales-print-logo-fallback">
                                {(storeProfile.name || "S")
                                    .slice(0, 1)
                                    .toUpperCase()}
                            </div>
                        )}
                        <div className="sales-print-store-details">
                            <h1>{storeProfile.name || "Your Store"}</h1>
                            {[storeProfile.address, storeProfile.city]
                                .filter(Boolean)
                                .length > 0 && (
                                <p>
                                    {[storeProfile.address, storeProfile.city]
                                        .filter(Boolean)
                                        .join(", ")}
                                </p>
                            )}
                            {[
                                storeProfile.phone,
                                storeProfile.email,
                                storeProfile.website,
                            ].filter(Boolean).length > 0 && (
                                <p>
                                    {[
                                        storeProfile.phone,
                                        storeProfile.email,
                                        storeProfile.website,
                                    ]
                                        .filter(Boolean)
                                        .join(" · ")}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="sales-print-report-title">
                        <p className="sales-print-kicker">Business performance</p>
                        <h2>Sales Report</h2>
                        <p className="sales-print-subtitle">
                            {filterData.start_date || filterData.end_date
                                ? `${filterData.start_date || "Beginning"} – ${filterData.end_date || "Today"}`
                                : "All dates"}
                            {filterData.invoice && ` · Invoice: ${filterData.invoice}`}
                            {cashierFromFilters &&
                                ` · Cashier: ${cashierFromFilters.name}`}
                            {customerFromFilters &&
                                ` · Customer: ${customerFromFilters.name}`}
                            {filterData.warehouse_id &&
                                ` · Warehouse: ${
                                    warehouses.find(
                                        (warehouse) =>
                                            castFilterString(warehouse.id) ===
                                            filterData.warehouse_id
                                    )?.name ?? "Selected"
                                }`}
                        </p>
                    </div>
                    <div className="sales-print-generated">
                        <strong>Generated</strong>
                        <span>{new Date().toLocaleString("en-PK")}</span>
                        <span>
                            Transactions {transactions?.from ?? 0}–
                            {transactions?.to ?? 0} of{" "}
                            {transactions?.total ?? safeSummary.orders_count}
                        </span>
                        <span>
                            Currency: PKR (Rs.)
                        </span>
                    </div>
                </header>

                <section className="sales-print-metrics">
                    {[
                        ["Gross Sales (Tax + Shipping + Discounts)", safeSummary.gross_sales_total, "currency"],
                        ["Tax", safeSummary.tax_total, "currency", safeSummary.tax_rate],
                        ["Net Sales", safeSummary.revenue_total, "currency"],
                        ["Cost", safeSummary.cost_complete ? safeSummary.cost_total : null, "currency"],
                        ["Gross Profit", safeSummary.cost_complete ? safeSummary.profit_total : null, "currency"],
                        ["Profit Margin", safeSummary.cost_complete ? safeSummary.profit_margin : null, "percent"],
                        ["Orders", safeSummary.orders_count, "number"],
                        ["Items Sold", safeSummary.items_sold, "number"],
                        ["Discounts", safeSummary.discount_total, "currency"],
                        ["Returns", safeSummary.returns_total, "currency"],
                        ["Cash Refunds", safeSummary.cash_refund_total, "currency"],
                        ["Store Credit", safeSummary.store_credit_total, "currency"],
                        ["Returned Items", safeSummary.returned_items, "number"],
                    ].map(([label, value, type, rate]) => (
                        <div key={label} className="sales-print-metric">
                            <span>{label}</span>
                            <strong>
                                {value == null
                                    ? "N/A"
                                    : type === "currency"
                                    ? reportCurrency(value)
                                    : type === "percent"
                                      ? `${Number(value).toLocaleString("en-US")}%`
                                      : Number(value).toLocaleString("en-US")}
                            </strong>
                            {rate !== undefined && (
                                <small>
                                    {rate == null
                                        ? "Rate unavailable: older sales lack taxable-amount snapshots"
                                        : `${Number(rate).toLocaleString("en-US")}% ${
                                              safeSummary.tax_rate_source === "recorded_transaction_rates"
                                                  ? "weighted saved invoice rate"
                                                  : "weighted taxable-amount rate"
                                          }`}
                                </small>
                            )}
                        </div>
                    ))}
                </section>

                <section className="sales-print-analytics">
                    <div className="sales-print-panel sales-print-daily">
                        <h2>Daily Net Sales</h2>
                        {dailySales.length ? (
                            <div className="sales-print-daily-grid">
                                {dailySales.map((item) => (
                                    <div key={item.date}>
                                        <span>
                                            {new Date(
                                                `${item.date}T00:00:00`
                                            ).toLocaleDateString("en-PK", {
                                                day: "2-digit",
                                                month: "short",
                                            })}
                                        </span>
                                        <strong>{reportCurrency(item.total)}</strong>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="sales-print-empty">
                                No sales recorded for this period.
                            </p>
                        )}
                    </div>

                    <div className="sales-print-panel">
                        <h2>Payment Methods</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Method</th>
                                    <th>Orders</th>
                                    <th>Invoice Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paymentMethods.length ? (
                                    paymentMethods.map((item) => (
                                        <tr key={item.label}>
                                            <td>{paymentMethodLabel(item.label)}</td>
                                            <td>{item.orders}</td>
                                            <td>{reportCurrency(item.total)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No payment data.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="sales-print-panel">
                        <h2>Order Types</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Order Type</th>
                                    <th>Orders</th>
                                    <th>Invoice Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderTypes.length ? (
                                    orderTypes.map((item) => (
                                        <tr key={item.label}>
                                            <td>{humanize(item.label)}</td>
                                            <td>{item.orders}</td>
                                            <td>{reportCurrency(item.total)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No order type data.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="sales-print-panel">
                        <h2>Sales by Category</h2>
                        <small>
                            Recorded line totals after item promotions; before invoice-level discounts.
                        </small>
                        <table>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Items</th>
                                    <th>Item Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.length ? (
                                    categories.map((item) => (
                                        <tr key={item.label}>
                                            <td>{humanize(item.label)}</td>
                                            <td>{item.quantity}</td>
                                            <td>{reportCurrency(item.total)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No category sales.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="sales-print-panel">
                        <h2>Top Products</h2>
                        <small>
                            Recorded line totals after item promotions; before invoice-level discounts.
                        </small>
                        <table>
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Sold</th>
                                    <th>Item Sales</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.length ? (
                                    topProducts.map((item) => (
                                        <tr key={item.product_id}>
                                            <td>
                                                {humanize(
                                                    item.label ||
                                                        `Product #${item.product_id}`
                                                )}
                                            </td>
                                            <td>{item.quantity}</td>
                                            <td>{reportCurrency(item.total)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3">No product sales.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="sales-print-transactions">
                    <div className="sales-print-section-heading">
                        <div>
                            <h2>Transactions</h2>
                            <p>Products and quantities sold per invoice</p>
                        </div>
                        <span>
                            Page {currentPage} of{" "}
                            {transactions?.last_page ?? 1}
                        </span>
                    </div>
                    {rows.length ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Invoice / Date</th>
                                    <th>Customer / Staff</th>
                                    <th>Selling items &amp; qty</th>
                                    <th className="sales-print-number">Total qty</th>
                                    <th className="sales-print-number">
                                        Tax / Tax %
                                    </th>
                                    <th className="sales-print-number">
                                        Discount
                                    </th>
                                    <th className="sales-print-number">
                                        Invoice total / Gross profit
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((trx, index) => (
                                    <tr key={trx.id}>
                                        <td>
                                            {(currentPage - 1) * perPage +
                                                index +
                                                1}
                                        </td>
                                        <td>
                                            <strong>{trx.invoice}</strong>
                                            <span className="sales-print-subcell">
                                                {trx.created_at}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>
                                                {trx.customer?.name ?? "Walk-in"}
                                            </strong>
                                            {trx.cashier?.name ?? "—"}
                                            <span className="sales-print-subcell">
                                                {trx.warehouse?.name ?? "—"}
                                            </span>
                                        </td>
                                        <td>
                                            {trx.details?.length
                                                ? trx.details
                                                      .map((item) => {
                                                          const name =
                                                              item.product?.title ??
                                                              `Product #${item.product_id}`;
                                                          const variation =
                                                              item.variation_name
                                                                  ? ` (${item.variation_name})`
                                                                  : "";
                                                          const unit =
                                                              item.unit?.symbol
                                                                  ? ` ${item.unit.symbol}`
                                                                  : "";
                                                          const returned =
                                                              Number(item.returned_qty ?? 0) > 0
                                                                  ? ` (${item.returned_qty} returned)`
                                                                  : "";
                                                          return `${name}${variation} ×${item.qty}${returned}${unit}`;
                                                      })
                                                      .join(" · ")
                                                : "—"}
                                        </td>
                                        <td className="sales-print-number">
                                            {trx.total_items ?? 0}
                                        </td>
                                        <td className="sales-print-number">
                                            {reportCurrency(trx.tax_total ?? 0)}
                                            <span className="sales-print-subcell">
                                                {trx.tax_rate == null
                                                    ? "Rate not recorded"
                                                    : `${Number(trx.tax_rate ?? 0)}% tax`}
                                            </span>
                                        </td>
                                        <td className="sales-print-number">
                                            {transactionDiscount(trx) > 0
                                                ? reportCurrency(
                                                      transactionDiscount(trx)
                                                  )
                                                : "—"}
                                        </td>
                                        <td className="sales-print-number">
                                            {reportCurrency(trx.grand_total ?? 0)}
                                            {Number(trx.completed_return_total ?? 0) > 0 && (
                                                <span className="sales-print-subcell">
                                                    Returned{" "}
                                                    {reportCurrency(trx.completed_return_total)}
                                                    {" · "}Cash{" "}
                                                    {reportCurrency(trx.completed_refund_total ?? 0)}
                                                    {" · "}Credit{" "}
                                                    {reportCurrency(trx.completed_credit_total ?? 0)}
                                                </span>
                                            )}
                                            <span className="sales-print-subcell">
                                                Gross profit{" "}
                                                {transactionGrossProfit(trx) == null
                                                    ? "N/A"
                                                    : reportCurrency(
                                                          transactionGrossProfit(trx)
                                                      )}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="sales-print-empty">
                            No transactions match the selected filters.
                        </p>
                    )}
                </section>

                <footer className="sales-print-footer">
                    Sales summary covers all filtered transactions. The invoice
                    table shows the current page; use the report pagination to
                    print other pages. Gross Sales adds all discounts back to
                    invoice totals, including tax and shipping, then subtracts
                    completed returns. Net Sales excludes tax and shipping.
                    Returns, cash refunds, and store credits are shown
                    separately.
                </footer>
            </div>

            <div data-sales-report-screen className="space-y-6">
                {/* Header */}
                <div
                    data-tour="reports-header"
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <IconTrendingUp
                                size={28}
                                className="text-primary-500"
                            />
                            Sales Report
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Sales analysis, sold items, and transaction summary
                        </p>
                    </div>
                    <div
                        className="flex items-center gap-2"
                        data-sales-report-no-print
                    >
                        <button
                            type="button"
                            onClick={printReport}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700"
                        >
                            <IconPrinter size={18} />
                            Print Report
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                                showFilters || hasActiveFilters
                                    ? "bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-950/50 dark:border-primary-800 dark:text-primary-400"
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            }`}
                        >
                            <IconFilter size={18} />
                            <span>Filter</span>
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div
                    data-tour="reports-summary"
                    className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                >
                    {summaryCards.map((card) => (
                        <MetricCard key={card.label} {...card} />
                    ))}
                </div>

                {safeSummary.returns_total > 0 && (
                    <section className="grid gap-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-950 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            ["Returned sales", safeSummary.returns_total, true],
                            ["Cash refunds", safeSummary.cash_refund_total, true],
                            ["Store credit", safeSummary.store_credit_total, true],
                            ["Returned items", safeSummary.returned_items, false],
                        ].map(([label, value, isCurrency]) => (
                            <div key={label}>
                                <p className="text-xs font-bold uppercase tracking-wide opacity-70">
                                    {label}
                                </p>
                                <p className="mt-1 text-lg font-bold">
                                    {isCurrency
                                        ? reportCurrency(value)
                                        : Number(value).toLocaleString("en-US")}
                                </p>
                            </div>
                        ))}
                        {!safeSummary.return_financials_complete && (
                            <p className="text-xs sm:col-span-2 lg:col-span-4">
                                Net sales, tax, cost, and profit are unavailable
                                for completed returns without saved financial
                                snapshots. Apply the latest migration and update
                                older return drafts before completing them.
                            </p>
                        )}
                    </section>
                )}

                {/* Filters Panel */}
                {showFilters && (
                    <div
                        data-tour="reports-filters"
                        data-sales-report-no-print
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-slide-up"
                    >
                        <form onSubmit={applyFilters}>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filterData.start_date}
                                        onChange={(e) =>
                                            handleChange(
                                                "start_date",
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={filterData.end_date}
                                        onChange={(e) =>
                                            handleChange(
                                                "end_date",
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Invoice
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="TRX-..."
                                        value={filterData.invoice}
                                        onChange={(e) =>
                                            handleChange(
                                                "invoice",
                                                e.target.value
                                            )
                                        }
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                                    />
                                </div>
                                <InputSelect
                                    label="Cashier"
                                    data={cashiers}
                                    selected={selectedCashier}
                                    setSelected={handleSelectCashier}
                                    placeholder="All cashiers"
                                    searchable
                                />
                                <InputSelect
                                    label="Customer"
                                    data={customers}
                                    selected={selectedCustomer}
                                    setSelected={handleSelectCustomer}
                                    placeholder="All customers"
                                    searchable
                                />
                                <div>
                                    <label
                                        htmlFor="sales-report-warehouse"
                                        className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                                    >
                                        Warehouse
                                    </label>
                                    <select
                                        id="sales-report-warehouse"
                                        value={filterData.warehouse_id}
                                        onChange={(e) =>
                                            handleChange(
                                                "warehouse_id",
                                                e.target.value
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-slate-800 transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                    >
                                        <option value="">All warehouses</option>
                                        {warehouses.map((warehouse) => (
                                            <option
                                                key={warehouse.id}
                                                value={warehouse.id}
                                            >
                                                {warehouse.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={resetFilters}
                                        className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <IconX size={18} />
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                                >
                                    <IconSearch size={18} />
                                    Apply Filters
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
                    <Panel
                        title="Daily Sales Trend"
                        subtitle="Net sales by transaction date"
                    >
                        <SalesTrend data={dailySales} />
                    </Panel>
                    <Panel
                        title="Payment Analysis"
                        subtitle="Invoice amounts less completed returns (tax and shipping included)"
                    >
                        <PaymentBreakdown data={paymentMethods} />
                    </Panel>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                    <Panel
                        title="Order Type"
                        subtitle="Transaction count by fulfillment type"
                    >
                        {orderTypes.length ? (
                            <div className="space-y-4">
                                {orderTypes.map((item, index) => {
                                    const totalOrders = Math.max(
                                        ...orderTypes.map(
                                            (type) => Number(type.orders) || 0
                                        ),
                                        1
                                    );
                                    return (
                                        <div key={`${item.label}-${index}`}>
                                            <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                                    {humanize(item.label)}
                                                </span>
                                                <span className="text-right text-xs text-slate-500">
                                                    {Number(item.orders) || 0}{" "}
                                                    orders · Invoice total{" "}
                                                    {reportCurrency(item.total)}
                                                </span>
                                            </div>
                                            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                                <div
                                                    className="h-full rounded-full bg-emerald-600"
                                                    style={{
                                                        width: `${Math.max(
                                                            3,
                                                            ((Number(item.orders) ||
                                                                0) /
                                                                totalOrders) *
                                                                100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">
                                No order type data yet.
                            </p>
                        )}
                    </Panel>
                    <Panel
                        title="Sales by Category"
                        subtitle="Product-line sales after promotions, before invoice discounts"
                    >
                        <RankingList
                            data={categories}
                            valueFormatter={reportCurrency}
                            emptyMessage="No category sales data yet."
                        />
                    </Panel>
                    <Panel
                        title="Top Products"
                        subtitle="Product-line sales after promotions, before invoice discounts"
                    >
                        <RankingList
                            data={topProducts}
                            valueFormatter={reportCurrency}
                            emptyMessage="No product sales data yet."
                        />
                    </Panel>
                </div>

                {/* Table */}
                {rows.length > 0 ? (
                    <div
                        data-tour="reports-table"
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            No.
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Invoice
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Date
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Customer
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Cashier
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Warehouse
                                        </th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Selling Items &amp; Qty
                                        </th>
                                        <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Total Qty
                                        </th>
                                        <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Discount
                                        </th>
                                        <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Invoice Total
                                        </th>
                                        <th className="px-4 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">
                                            Gross Profit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {rows.map((trx, i) => (
                                        <tr
                                            key={trx.id}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {i +
                                                    1 +
                                                    (currentPage - 1) * perPage}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                                                {trx.invoice}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {trx.created_at}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {trx.customer?.name ?? "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {trx.cashier?.name ?? "-"}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                {trx.warehouse?.name ?? "-"}
                                            </td>
                                            <td className="px-4 py-4">
                                                {trx.details?.length ? (
                                                    <ul className="min-w-[220px] space-y-1.5">
                                                        {trx.details.map(
                                                            (item) => (
                                                                <li
                                                                    key={item.id}
                                                                    className="flex items-start justify-between gap-3 text-sm"
                                                                >
                                                                    <span className="min-w-0 text-slate-700 dark:text-slate-300">
                                                                        {item.product
                                                                            ?.title ??
                                                                            `Product #${item.product_id}`}
                                                                        {item.variation_name && (
                                                                            <span className="ml-1 text-xs text-slate-500">
                                                                                (
                                                                                {
                                                                                    item.variation_name
                                                                                }
                                                                                )
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                    <span className="shrink-0 rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                                                        ×
                                                                        {item.qty}
                                                                        {Number(item.returned_qty ?? 0) > 0 &&
                                                                            ` (${item.returned_qty} returned)`}
                                                                        {item
                                                                            .unit
                                                                            ?.symbol
                                                                            ? ` ${item.unit.symbol}`
                                                                            : ""}
                                                                    </span>
                                                                </li>
                                                            )
                                                        )}
                                                    </ul>
                                                ) : (
                                                    <span className="text-sm text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-400 rounded-full">
                                                    {trx.total_items ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                {transactionDiscount(trx) > 0
                                                    ? reportCurrency(
                                                          transactionDiscount(
                                                              trx
                                                          )
                                                      )
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                                                {reportCurrency(
                                                    trx.grand_total ?? 0
                                                )}
                                                {Number(trx.completed_return_total ?? 0) > 0 && (
                                                    <span className="mt-1 block text-xs font-medium text-orange-700 dark:text-orange-300">
                                                        Returned{" "}
                                                        {reportCurrency(trx.completed_return_total)}
                                                        {" · "}Refund{" "}
                                                        {reportCurrency(trx.completed_refund_total ?? 0)}
                                                        {" · "}Credit{" "}
                                                        {reportCurrency(trx.completed_credit_total ?? 0)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm font-semibold text-success-600 dark:text-success-400">
                                                {transactionGrossProfit(trx) == null
                                                    ? "N/A"
                                                    : reportCurrency(
                                                          transactionGrossProfit(
                                                              trx
                                                          )
                                                      )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                            <IconDatabaseOff
                                size={32}
                                className="text-slate-400"
                            />
                        </div>
                        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">
                            No Data Available
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No transactions match the selected filters.
                        </p>
                    </div>
                )}

                {paginationLinks.length > 3 && (
                    <div data-sales-report-no-print>
                        <Pagination
                            links={paginationLinks}
                            perPage={transactions?.per_page}
                        />
                    </div>
                )}
            </div>
            <style>{`
                .sales-report-print { display: none; }
                @page { size: A4 portrait; margin: 8mm; }
                @media print {
                    html, body {
                        background: white !important;
                        color: #0f172a !important;
                        font-family: Arial, Helvetica, sans-serif !important;
                    }
                    body * { visibility: hidden !important; }
                    [data-sales-report-screen] { display: none !important; }
                    [data-sales-report-print],
                    [data-sales-report-print] * { visibility: visible !important; }
                    [data-sales-report-print].sales-report-print {
                        display: block !important;
                        position: absolute !important;
                        inset: 0 auto auto 0 !important;
                        width: 100% !important;
                        color: #17231d !important;
                        font-size: 7pt !important;
                        line-height: 1.25 !important;
                    }

                    .sales-print-header {
                        display: grid;
                        grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) auto;
                        align-items: flex-start;
                        justify-content: space-between;
                        gap: 8px;
                        border-bottom: 2px solid #146b3a;
                        padding-bottom: 7px;
                        margin-bottom: 8px;
                    }
                    .sales-print-store {
                        display: flex;
                        min-width: 0;
                        align-items: center;
                        gap: 8px;
                    }
                    .sales-print-store img,
                    .sales-print-logo-fallback {
                        width: 42px;
                        height: 42px;
                        flex: 0 0 42px;
                        object-fit: contain;
                    }
                    .sales-print-logo-fallback {
                        display: grid;
                        place-items: center;
                        border-radius: 5px;
                        background: #e2f0e8 !important;
                        color: #0b3d25 !important;
                        font-size: 16pt;
                        font-weight: 800;
                    }
                    .sales-print-store-details {
                        min-width: 0;
                    }
                    .sales-print-store-details h1 {
                        margin: 0;
                        color: #0b3d25 !important;
                        font-size: 13pt;
                        line-height: 1.15;
                    }
                    .sales-print-store-details p {
                        margin-top: 2px;
                        color: #52635a !important;
                        font-size: 6pt;
                        overflow-wrap: anywhere;
                    }
                    .sales-print-report-title {
                        min-width: 0;
                        text-align: right;
                    }
                    .sales-print-kicker {
                        color: #146b3a !important;
                        font-size: 6pt;
                        font-weight: 700;
                        letter-spacing: 1.4px;
                        text-transform: uppercase;
                    }
                    .sales-print-report-title h2 {
                        margin: 2px 0;
                        color: #0b3d25 !important;
                        font-size: 12pt;
                        line-height: 1.1;
                    }
                    .sales-print-subtitle {
                        color: #52635a !important;
                        font-size: 7pt;
                        overflow-wrap: anywhere;
                    }
                    .sales-print-generated {
                        display: grid;
                        gap: 2px;
                        color: #52635a !important;
                        text-align: right;
                        font-size: 6.5pt;
                    }
                    .sales-print-generated strong { color: #0b3d25 !important; }

                    .sales-print-metrics {
                        display: grid;
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                        gap: 4px;
                        margin-bottom: 8px;
                    }
                    .sales-print-metric {
                        min-width: 0;
                        border: 1px solid #d5e4d9;
                        border-top: 2px solid #146b3a;
                        border-radius: 4px;
                        padding: 4px 5px;
                        background: #f4f8f5 !important;
                    }
                    .sales-print-metric span,
                    .sales-print-metric strong {
                        display: block;
                    }
                    .sales-print-metric span {
                        color: #52635a !important;
                        font-size: 5.5pt;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                    .sales-print-metric strong {
                        margin-top: 2px;
                        color: #0b3d25 !important;
                        font-size: 8pt;
                        white-space: nowrap;
                    }
                    .sales-print-metric small {
                        display: block;
                        margin-top: 1px;
                        color: #52635a !important;
                        font-size: 5.5pt;
                    }

                    .sales-print-analytics {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 5px;
                        margin-bottom: 7px;
                    }
                    .sales-print-panel {
                        min-width: 0;
                        border: 1px solid #dce5de;
                        border-radius: 4px;
                        padding: 4px 5px;
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    .sales-print-panel h2,
                    .sales-print-section-heading h2 {
                        margin: 0 0 4px;
                        color: #0b3d25 !important;
                        font-size: 8pt;
                    }
                    .sales-print-daily { grid-column: 1 / -1; }
                    .sales-print-daily-grid {
                        display: grid;
                        grid-template-columns: repeat(4, minmax(0, 1fr));
                        gap: 2px 5px;
                    }
                    .sales-print-daily-grid div {
                        display: flex;
                        justify-content: space-between;
                        gap: 2px;
                        border-bottom: 1px solid #edf1ee;
                        padding: 2px 0;
                        white-space: nowrap;
                    }
                    .sales-print-daily-grid span { color: #52635a !important; }
                    .sales-print-daily-grid strong { font-size: 6pt; }

                    .sales-report-print table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: auto;
                    }
                    .sales-print-panel table td {
                        border-bottom: 1px solid #edf1ee;
                        padding: 2px 3px;
                        font-size: 6.5pt;
                    }
                    .sales-print-panel table th {
                        border-bottom: 1px solid #dce5de;
                        padding: 2px 3px;
                        color: #52635a !important;
                        font-size: 5.5pt;
                        font-weight: 700;
                        text-align: left;
                        text-transform: uppercase;
                    }
                    .sales-print-panel table th:nth-child(2),
                    .sales-print-panel table td:nth-child(2) {
                        text-align: center;
                        white-space: nowrap;
                    }
                    .sales-print-panel td:last-child {
                        text-align: right;
                        white-space: nowrap;
                    }
                    .sales-print-empty { color: #64746b !important; }

                    .sales-print-section-heading {
                        display: flex;
                        align-items: flex-end;
                        justify-content: space-between;
                        margin-bottom: 4px;
                    }
                    .sales-print-section-heading p {
                        color: #64746b !important;
                        font-size: 6pt;
                    }
                    .sales-print-section-heading > span {
                        color: #52635a !important;
                        font-size: 6pt;
                    }
                    .sales-print-transactions thead { display: table-header-group; }
                    .sales-print-transactions tr {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                    .sales-print-transactions th {
                        background: #e2f0e8 !important;
                        color: #0b3d25 !important;
                        font-size: 5.5pt;
                        font-weight: 700;
                        text-align: left;
                        text-transform: uppercase;
                    }
                    .sales-print-transactions th,
                    .sales-print-transactions td {
                        border: 1px solid #dce5de;
                        padding: 3px 4px;
                        vertical-align: top;
                        overflow-wrap: anywhere;
                    }
                    .sales-print-transactions tbody tr:nth-child(even) {
                        background: #f8faf8 !important;
                    }
                    .sales-print-transactions td { font-size: 6pt; }
                    .sales-print-transactions td:nth-child(4) { width: 30%; }
                    .sales-print-transactions th:first-child,
                    .sales-print-transactions td:first-child {
                        width: 5%;
                        text-align: center;
                    }
                    .sales-print-transactions th:nth-child(2),
                    .sales-print-transactions td:nth-child(2) { width: 16%; }
                    .sales-print-transactions th:nth-child(3),
                    .sales-print-transactions td:nth-child(3) { width: 17%; }
                    .sales-print-transactions th:nth-child(5),
                    .sales-print-transactions td:nth-child(5) { width: 7%; }
                    .sales-print-transactions th:nth-child(6),
                    .sales-print-transactions td:nth-child(6) { width: 10%; }
                    .sales-print-transactions th:nth-child(7),
                    .sales-print-transactions td:nth-child(7) { width: 15%; }
                    .sales-print-transactions .sales-print-number {
                        text-align: right;
                        white-space: nowrap;
                    }
                    .sales-print-subcell {
                        display: block;
                        margin-top: 2px;
                        color: #64746b !important;
                        font-size: 5.5pt;
                    }
                    .sales-print-footer {
                        margin-top: 5px;
                        border-top: 1px solid #dce5de;
                        padding-top: 4px;
                        color: #64746b !important;
                        font-size: 5.5pt;
                    }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </>
    );
};

Sales.layout = (page) => <DashboardLayout children={page} />;

export default Sales;