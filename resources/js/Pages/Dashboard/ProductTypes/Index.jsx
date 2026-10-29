import React, { useMemo, useState } from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, usePage, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/Dashboard/Button";
import {
    IconCirclePlus,
    IconDatabaseOff,
    IconPencilCog,
    IconTrash,
    IconSearch,
    IconFilter,
    IconChevronDown,
    IconPackage,
    IconCircleCheck,
    IconCircleX,
} from "@tabler/icons-react";
import Search from "@/Components/Dashboard/Search";
import Table from "@/Components/Dashboard/Table";
import Pagination from "@/Components/Dashboard/Pagination";
import { useAuthorization } from "@/Utils/authorization";

export default function Index({ productTypes }) {
    const { t } = useTranslation();
    const { can } = useAuthorization();
    const canCreateProductTypes = can("categories-create");
    const canEditProductTypes = can("categories-edit");
    const canDeleteProductTypes = can("categories-delete");
    const [statusFilter, setStatusFilter] = useState("all");

    const currentItems = productTypes.data || [];
    const activeOnPage = currentItems.filter((item) => item.is_active).length;
    const inactiveOnPage = currentItems.length - activeOnPage;
    const visibleItems = useMemo(
        () =>
            currentItems.filter((item) => {
                if (statusFilter === "active") return item.is_active;
                if (statusFilter === "inactive") return !item.is_active;
                return true;
            }),
        [currentItems, statusFilter]
    );

    return (
        <>
            <Head title={t("productTypes.title")} />

            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {t("productTypes.title")}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {productTypes.total || productTypes.data?.length || 0}{" "}
                            {t("productTypes.registered")}
                        </p>
                    </div>
                    {canCreateProductTypes && (
                        <Button
                            type={"link"}
                            icon={
                                <IconCirclePlus
                                    size={18}
                                    strokeWidth={1.5}
                                />
                            }
                            className={
                                "bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/30"
                            }
                            label={t("productTypes.addProductType")}
                            href={route("items.create")}
                        />
                    )}
                </div>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total items</span>
                        <IconPackage size={18} className="text-primary-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{productTypes.total || currentItems.length}</p>
                    <p className="text-xs text-slate-500">Across all pages</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Active on page</span>
                        <IconCircleCheck size={18} className="text-emerald-600" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">{activeOnPage}</p>
                    <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">Visible in POS selections</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inactive on page</span>
                        <IconCircleX size={18} className="text-slate-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-slate-700 dark:text-slate-200">{inactiveOnPage}</p>
                    <p className="text-xs text-slate-500">Saved but hidden from POS</p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
                <div className="w-full sm:w-96">
                    <Search
                        url={route("items.index")}
                        placeholder={t("productTypes.searchPlaceholder")}
                    />
                </div>
                <div className="relative flex items-center gap-2">
                    <IconFilter size={16} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                        <option value="all">All statuses</option>
                        <option value="active">Active only</option>
                        <option value="inactive">Inactive only</option>
                    </select>
                    <IconChevronDown size={15} className="pointer-events-none absolute right-3 text-slate-400" />
                </div>
            </div>

            {/* Content */}
            {visibleItems.length > 0 ? (
                <Table.Card title={t("productTypes.dataTitle")}>
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th className="w-10">#</Table.Th>
                                <Table.Th>{t("productTypes.code")}</Table.Th>
                                <Table.Th>{t("common.labels.name")}</Table.Th>
                                <Table.Th>Short Name</Table.Th>
                                <Table.Th>Category</Table.Th>
                                <Table.Th>Linked product</Table.Th>
                                <Table.Th>Priority</Table.Th>
                                <Table.Th>{t("common.labels.status")}</Table.Th>
                                <Table.Th className="text-right">Actions</Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {visibleItems.map((productType, i) => (
                                <tr
                                    className="group transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    key={productType.id}
                                >
                                    <Table.Td className="text-center">
                                        {i + 1 +
                                            (productTypes.current_page - 1) *
                                                productTypes.per_page}
                                    </Table.Td>
                                    <Table.Td>
                                        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold tracking-wide text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                            {productType.code}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <div className="flex items-center gap-3">
                                            <span className="h-9 w-1 rounded-full" style={{ backgroundColor: productType.color || "#94a3b8" }} />
                                            <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                            {productType.name}
                                            </p>
                                            <p className="max-w-[220px] truncate text-xs text-slate-500">{productType.description || "No description added"}</p>
                                            </div>
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <span className="rounded-md bg-primary-50 px-2 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                                            {productType.short_name || "—"}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <span className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: productType.color || "#94a3b8" }} />
                                            {productType.category?.name || "-"}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        {productType.product ? (
                                            <span className="inline-flex max-w-[180px] items-center gap-1.5 truncate text-sm text-slate-600 dark:text-slate-300">
                                                <IconPackage size={15} className="shrink-0 text-slate-400" />
                                                <span className="truncate">{productType.product.title}</span>
                                            </span>
                                        ) : <span className="text-sm text-slate-400">Not linked</span>}
                                    </Table.Td>
                                    <Table.Td>{productType.sort_order ?? 0}</Table.Td>
                                    <Table.Td>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                            productType.is_active
                                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-400"
                                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${productType.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                                            {productType.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </Table.Td>
                                    <Table.Td className="text-right">
                                        <div className="flex justify-end gap-2 opacity-70 transition-opacity group-hover:opacity-100">
                                            {canEditProductTypes && (
                                                <Button
                                                    type={"edit"}
                                                    icon={
                                                        <IconPencilCog
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    }
                                                    className={
                                                        "border bg-warning-100 border-warning-200 text-warning-600 hover:bg-warning-200 dark:bg-warning-900/50 dark:border-warning-800 dark:text-warning-400"
                                                    }
                                                    href={route(
                                                        "items.edit",
                                                        productType.id
                                                    )}
                                                />
                                            )}
                                            {canDeleteProductTypes && (
                                                <Button
                                                    type={"delete"}
                                                    icon={
                                                        <IconTrash
                                                            size={16}
                                                            strokeWidth={1.5}
                                                        />
                                                    }
                                                    className={
                                                        "border bg-danger-100 border-danger-200 text-danger-600 hover:bg-danger-200 dark:bg-danger-900/50 dark:border-danger-800 dark:text-danger-400"
                                                    }
                                                    url={route(
                                                        "items.destroy",
                                                        productType.id
                                                    )}
                                                />
                                            )}
                                        </div>
                                    </Table.Td>
                                </tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Table.Card>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <IconDatabaseOff
                            size={32}
                            className="text-slate-400"
                            strokeWidth={1.5}
                        />
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-1">
                        {t("productTypes.noProductTypes")}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {t("productTypes.addFirst")}
                    </p>
                    <Button
                        type={"link"}
                        icon={<IconCirclePlus size={18} />}
                        className={
                            "bg-primary-500 hover:bg-primary-600 text-white"
                        }
                        label={t("productTypes.addProductType")}
                        href={route("items.create")}
                    />
                </div>
            )}

            {productTypes.last_page !== 1 && (
                <Pagination links={productTypes.links} />
            )}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
