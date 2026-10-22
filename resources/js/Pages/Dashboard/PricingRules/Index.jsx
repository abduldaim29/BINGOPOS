import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Button from "@/Components/Dashboard/Button";
import Table from "@/Components/Dashboard/Table";
import Pagination from "@/Components/Dashboard/Pagination";
import {
    IconChartInfographic,
    IconCirclePlus,
    IconPencil,
    IconSearch,
    IconTrash,
} from "@tabler/icons-react";
import { useAuthorization } from "@/Utils/authorization";

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
    }).format(value);

const discountLabel = (rule) => {
    if (rule.kind === "bundle_price") {
        return `Bundle ${formatCurrency(rule.discount_value)}`;
    }

    if (rule.kind === "buy_x_get_y") {
        return `${rule.buy_get_items_count || 0} item rule`;
    }

    if (rule.discount_type === "percentage") {
        return `${Number(rule.discount_value)}%`;
    }

    if (rule.discount_type === "fixed_price") {
        return `Price ${formatCurrency(rule.discount_value)}`;
    }

    return `Discount ${formatCurrency(rule.discount_value)}`;
};

const targetLabel = (rule) => {
    if (rule.target_type === "product") return rule.product?.title || "Product";
    if (rule.target_type === "category") {
        return rule.category?.name || "Category";
    }

    return "All Products";
};

const customerScopeLabel = (scope) => {
    if (scope === "walk_in") return "General";
    if (scope === "registered") return "Registered Customers";
    if (scope === "member") return "Members";
    return "All Customers";
};

const kindLabel = (kind) => {
    if (kind === "qty_break") return "Wholesale";
    if (kind === "bundle_price") return "Bundle";
    if (kind === "buy_x_get_y") return "BXGY";
    return "Standard";
};

export default function Index({ rules, filters, summary = {}, recentAudits = [] }) {
    const { can } = useAuthorization();
    const hasData = rules.data.length > 0;

    const handleFilterChange = (key, value) => {
        router.get(
            route("pricing-rules.index"),
            { ...filters, [key]: value },
            { preserveState: true, replace: true }
        );
    };

    return (
        <>
            <Head title="Pricing Promotions" />

            <div className="w-full">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Pricing Promotions
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manage automatic discounts and pricing for the POS.
                        </p>
                    </div>
                    {can("pricing-rules-create") && (
                        <Button
                            type="link"
                            href={route("pricing-rules.create")}
                            icon={<IconCirclePlus size={18} />}
                            className="bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600"
                            label="Create Rule"
                        />
                    )}
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-4">
                    {[
                        { label: "Active", value: summary.active || 0 },
                        { label: "Scheduled", value: summary.scheduled || 0 },
                        { label: "Expired", value: summary.expired || 0 },
                        { label: "Inactive", value: summary.inactive || 0 },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                        >
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                {item.label}
                            </p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                {item.value}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <div className="relative md:col-span-2">
                            <input
                                type="text"
                                value={filters.search || ""}
                                onChange={(event) =>
                                    handleFilterChange("search", event.target.value)
                                }
                                placeholder="Search rule names..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                <IconSearch size={18} />
                            </div>
                        </div>
                        <select
                            value={filters.status || ""}
                            onChange={(event) =>
                                handleFilterChange("status", event.target.value)
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select
                            value={filters.target_type || ""}
                            onChange={(event) =>
                                handleFilterChange("target_type", event.target.value)
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">All Targets</option>
                            <option value="all">All Products</option>
                            <option value="product">Product</option>
                            <option value="category">Category</option>
                        </select>
                        <select
                            value={filters.kind || ""}
                            onChange={(event) =>
                                handleFilterChange("kind", event.target.value)
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                            <option value="">All Types</option>
                            <option value="standard_discount">Standard</option>
                            <option value="qty_break">Wholesale</option>
                            <option value="bundle_price">Bundle</option>
                            <option value="buy_x_get_y">BXGY</option>
                        </select>
                    </div>
                </div>

                <Table.Card title="Pricing Rules">
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th>Rule</Table.Th>
                                <Table.Th>Target</Table.Th>
                                <Table.Th>Scope</Table.Th>
                                <Table.Th>Type</Table.Th>
                                <Table.Th>Discount</Table.Th>
                                <Table.Th>Priority</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th className="w-28 text-center">Actions</Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {hasData ? (
                                rules.data.map((rule) => (
                                    <tr
                                        key={rule.id}
                                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                        <Table.Td>
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-600 dark:bg-primary-950/40 dark:text-primary-300">
                                                    <IconChartInfographic size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {rule.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {rule.starts_at
                                                            ? new Date(
                                                                  rule.starts_at
                                                              ).toLocaleString("en-US")
                                                            : "No start date"}
                                                    </p>
                                                </div>
                                            </div>
                                        </Table.Td>
                                        <Table.Td>{targetLabel(rule)}</Table.Td>
                                        <Table.Td>
                                            {customerScopeLabel(rule.customer_scope)}
                                        </Table.Td>
                                        <Table.Td>
                                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                {kindLabel(rule.kind)}
                                            </span>
                                        </Table.Td>
                                        <Table.Td>{discountLabel(rule)}</Table.Td>
                                        <Table.Td>{rule.priority}</Table.Td>
                                        <Table.Td>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                    rule.status_label === "active"
                                                        ? "bg-success-100 text-success-700 dark:bg-success-950/30 dark:text-success-400"
                                                        : rule.status_label === "scheduled"
                                                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                                                          : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                }`}
                                            >
                                                {rule.status_label}
                                            </span>
                                        </Table.Td>
                                        <Table.Td className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {can("pricing-rules-update") && (
                                                    <Link
                                                        href={route(
                                                            "pricing-rules.edit",
                                                            rule.id
                                                        )}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300"
                                                    >
                                                        <IconPencil size={16} />
                                                    </Link>
                                                )}
                                                {can("pricing-rules-delete") && (
                                                    <Button
                                                        type="delete"
                                                        url={route(
                                                            "pricing-rules.destroy",
                                                            rule.id
                                                        )}
                                                        icon={<IconTrash size={16} />}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-300"
                                                    />
                                                )}
                                            </div>
                                        </Table.Td>
                                    </tr>
                                ))
                            ) : (
                                <Table.Empty
                                    colSpan={8}
                                    message="No pricing promotion rules found."
                                >
                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        <IconChartInfographic
                                            size={28}
                                            className="text-slate-400"
                                        />
                                    </div>
                                </Table.Empty>
                            )}
                        </Table.Tbody>
                    </Table>
                </Table.Card>

                {rules.last_page > 1 && <Pagination links={rules.links} />}

                {recentAudits.length > 0 && (
                    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                            Recent Promotion Activity
                        </h2>
                        <div className="mt-4 space-y-3">
                            {recentAudits.map((audit) => (
                                <div
                                    key={audit.id}
                                    className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800"
                                >
                                    <div>
                                        <p className="font-medium text-slate-800 dark:text-slate-200">
                                            {audit.description}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {audit.event}
                                        </p>
                                    </div>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {new Date(
                                            audit.created_at
                                        ).toLocaleString("en-US")}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;