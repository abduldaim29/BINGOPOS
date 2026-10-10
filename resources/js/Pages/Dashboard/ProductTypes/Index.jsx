import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, usePage, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import Button from "@/Components/Dashboard/Button";
import {
    IconCirclePlus,
    IconDatabaseOff,
    IconPencilCog,
    IconTrash,
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
                            href={route("product-types.create")}
                        />
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="mb-4">
                <div className="w-full sm:w-80">
                    <Search
                        url={route("product-types.index")}
                        placeholder={t("productTypes.searchPlaceholder")}
                    />
                </div>
            </div>

            {/* Content */}
            {productTypes.data.length > 0 ? (
                <Table.Card title={t("productTypes.dataTitle")}>
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th className="w-10">{t("common.labels.no")}</Table.Th>
                                <Table.Th>{t("productTypes.code")}</Table.Th>
                                <Table.Th>{t("common.labels.name")}</Table.Th>
                                <Table.Th>{t("common.labels.description")}</Table.Th>
                                <Table.Th>{t("common.labels.status")}</Table.Th>
                                <Table.Th></Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {productTypes.data.map((productType, i) => (
                                <tr
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    key={productType.id}
                                >
                                    <Table.Td className="text-center">
                                        {++i +
                                            (productTypes.current_page - 1) *
                                                productTypes.per_page}
                                    </Table.Td>
                                    <Table.Td>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                            {productType.code}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                            {productType.name}
                                        </p>
                                    </Table.Td>
                                    <Table.Td>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {productType.description || "-"}
                                        </p>
                                    </Table.Td>
                                    <Table.Td>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                                            productType.is_active
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                                        }`}>
                                            {productType.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <div className="flex gap-2">
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
                                                        "product-types.edit",
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
                                                        "product-types.destroy",
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
                        href={route("product-types.create")}
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
