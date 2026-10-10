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

export default function Index({ subCategories, categories }) {
    const { t } = useTranslation();
    const { can } = useAuthorization();
    const canCreateSubCategories = can("categories-create");
    const canEditSubCategories = can("categories-edit");
    const canDeleteSubCategories = can("categories-delete");

    return (
        <>
            <Head title={t("subCategories.title")} />

            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {t("subCategories.title")}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {subCategories.total || subCategories.data?.length || 0}{" "}
                            {t("subCategories.registered")}
                        </p>
                    </div>
                    {canCreateSubCategories && (
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
                            label={t("subCategories.addSubCategory")}
                            href={route("sub-categories.create")}
                        />
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                <div className="w-full sm:w-80">
                    <Search
                        url={route("sub-categories.index")}
                        placeholder={t("subCategories.searchPlaceholder")}
                    />
                </div>
                <div className="w-full sm:w-64">
                    <select
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        onChange={(e) => {
                            const url = new URL(window.location.href);
                            if (e.target.value) {
                                url.searchParams.set('category_id', e.target.value);
                            } else {
                                url.searchParams.delete('category_id');
                            }
                            window.location.href = url.toString();
                        }}
                    >
                        <option value="">{t("common.labels.all")}</option>
                        {categories.map((category) => (
                            <option
                                key={category.id}
                                value={category.id}
                                selected={new URLSearchParams(window.location.search).get('category_id') == category.id}
                            >
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Content */}
            {subCategories.data.length > 0 ? (
                <Table.Card title={t("subCategories.dataTitle")}>
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th className="w-10">{t("common.labels.no")}</Table.Th>
                                <Table.Th>{t("subCategories.code")}</Table.Th>
                                <Table.Th>{t("common.labels.name")}</Table.Th>
                                <Table.Th>Category</Table.Th>
                                <Table.Th>Description</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th></Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {subCategories.data.map((subCategory, i) => (
                                <tr
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    key={subCategory.id}
                                >
                                    <Table.Td className="text-center">
                                        {++i +
                                            (subCategories.current_page - 1) *
                                                subCategories.per_page}
                                    </Table.Td>
                                    <Table.Td>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                            {subCategory.code}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                            {subCategory.name}
                                        </p>
                                    </Table.Td>
                                    <Table.Td>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-400">
                                            {subCategory.category?.name || "-"}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                            {subCategory.description || "-"}
                                        </p>
                                    </Table.Td>
                                    <Table.Td>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${
                                            subCategory.is_active
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                                                : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400"
                                        }`}>
                                            {subCategory.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>
                                        <div className="flex gap-2">
                                            {canEditSubCategories && (
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
                                                        "sub-categories.edit",
                                                        subCategory.id
                                                    )}
                                                />
                                            )}
                                            {canDeleteSubCategories && (
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
                                                        "sub-categories.destroy",
                                                        subCategory.id
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
                        {t("subCategories.noSubCategories")}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {t("subCategories.addFirst")}
                    </p>
                    <Button
                        type={"link"}
                        icon={<IconCirclePlus size={18} />}
                        className={
                            "bg-primary-500 hover:bg-primary-600 text-white"
                        }
                        label={t("subCategories.addSubCategory")}
                        href={route("sub-categories.create")}
                    />
                </div>
            )}

            {subCategories.last_page !== 1 && (
                <Pagination links={subCategories.links} />
            )}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
