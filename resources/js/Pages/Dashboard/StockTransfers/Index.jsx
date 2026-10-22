import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import Table from "@/Components/Dashboard/Table";
import Pagination from "@/Components/Dashboard/Pagination";
import { IconArrowsLeftRight, IconEye, IconPlus } from "@tabler/icons-react";
import { useAuthorization } from "@/Utils/authorization";

const formatDateTime = (value) => {
    if (!value) return "-";
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const statusBadge = (status) => {
    const styles = {
        draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        in_transit: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
        cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400",
    };
    const labels = { draft: "Draft", in_transit: "In Transit", completed: "Completed", cancelled: "Cancelled" };
    return (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>
            {labels[status] || status}
        </span>
    );
};

export default function Index({ transfers }) {
    const { can } = useAuthorization();

    return (
        <>
            <Head title="Stock Transfers" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
                            <IconArrowsLeftRight size={28} className="text-primary-500" />
                            Stock Transfers
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Manage stock transfers between warehouses / branches
                        </p>
                    </div>
                    {can("stock-transfers-create") && (
                        <Link
                            href={route("stock-transfers.create")}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary-500/30 transition-colors hover:bg-primary-600"
                        >
                            <IconPlus size={18} />
                            New Transfer
                        </Link>
                    )}
                </div>

                <Table.Card title="Stock Transfer List">
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th>Document</Table.Th>
                                <Table.Th>Source</Table.Th>
                                <Table.Th>Destination</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Items</Table.Th>
                                <Table.Th>Created</Table.Th>
                                <Table.Th className="w-24 text-center">Actions</Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {transfers.data.length > 0 ? (
                                transfers.data.map((t) => (
                                    <tr key={t.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <Table.Td>
                                            <p className="font-semibold text-slate-800 dark:text-slate-200">{t.document_number}</p>
                                        </Table.Td>
                                        <Table.Td>{t.source_warehouse?.name || "-"}</Table.Td>
                                        <Table.Td>{t.destination_warehouse?.name || "-"}</Table.Td>
                                        <Table.Td>{statusBadge(t.status)}</Table.Td>
                                        <Table.Td>{t.items_count}</Table.Td>
                                        <Table.Td>{formatDateTime(t.created_at)}</Table.Td>
                                        <Table.Td className="text-center">
                                            <Link
                                                href={route("stock-transfers.show", t.id)}
                                                className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                            >
                                                <IconEye size={18} />
                                            </Link>
                                        </Table.Td>
                                    </tr>
                                ))
                            ) : (
                                <Table.Empty colSpan={7} message={<div className="text-slate-500 dark:text-slate-400">No stock transfers available yet.</div>} />
                            )}
                        </Table.Tbody>
                    </Table>
                </Table.Card>

                {transfers.last_page > 1 && <Pagination links={transfers.links} />}
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;