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
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(value);

const dealTypeLabel = (type) => {
    const labels = {
        fixed_price: "Harga Tetap",
        dynamic_price: "Harga Dinamis",
        slot_based: "Berdasarkan Slot",
        custom: "Kustom",
    };
    return labels[type] || type;
};

const discountLabel = (deal) => {
    if (deal.deal_type === "fixed_price") {
        return `Harga ${formatCurrency(deal.fixed_price)}`;
    }

    if (deal.discount_type === "percentage") {
        return `${Number(deal.discount_value)}%`;
    }

    if (deal.discount_type === "fixed_amount") {
        return `Potong ${formatCurrency(deal.discount_value)}`;
    }

    return formatCurrency(deal.discount_value);
};

const statusBadge = (status) => {
    const badges = {
        active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
        scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        expired: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
        inactive: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
    };

    const labels = {
        active: "Aktif",
        scheduled: "Terjadwal",
        expired: "Kadaluarsa",
        inactive: "Nonaktif",
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges.inactive}`}>
            {labels[status] || status}
        </span>
    );
};

export default function Index({ deals, filters, summary = {} }) {
    const { can } = useAuthorization();
    const hasData = deals.data.length > 0;

    const handleFilterChange = (key, value) => {
        router.get(
            route("restaurant-deals.index"),
            { ...filters, [key]: value },
            { preserveState: true, replace: true }
        );
    };

    const handleDelete = (id) => {
        if (confirm("Apakah Anda yakin ingin menghapus deal ini?")) {
            router.delete(route("restaurant-deals.destroy", id));
        }
    };

    return (
        <>
            <Head title="Restaurant Deals" />

            <div className="w-full">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Restaurant Deals
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kelola paket dan promo untuk restoran.
                        </p>
                    </div>
                    {can("restaurant-deals-create") && (
                        <Button
                            type="link"
                            href={route("restaurant-deals.create")}
                            icon={<IconCirclePlus size={18} />}
                            className="bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600"
                            label="Buat Deal"
                        />
                    )}
                </div>

                {/* Summary Cards */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary-100 p-2 dark:bg-primary-900">
                                <IconChartInfographic className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Deals</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {summary.total || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900">
                                <IconChartInfographic className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Aktif</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {summary.active_count || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900">
                                <IconChartInfographic className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Sedang Berjalan</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {summary.currently_active_count || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-4 flex flex-col gap-4 rounded-lg bg-white p-4 shadow-sm dark:bg-slate-800 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <IconSearch className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari deal..."
                            value={filters.search || ""}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                            className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                    <select
                        value={filters.status || ""}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                        <option value="">Semua Status</option>
                        <option value="active">Aktif</option>
                        <option value="scheduled">Terjadwal</option>
                        <option value="expired">Kadaluarsa</option>
                        <option value="inactive">Nonaktif</option>
                    </select>
                    <select
                        value={filters.deal_type || ""}
                        onChange={(e) => handleFilterChange("deal_type", e.target.value)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                    >
                        <option value="">Semua Tipe</option>
                        <option value="fixed_price">Harga Tetap</option>
                        <option value="dynamic_price">Harga Dinamis</option>
                        <option value="slot_based">Berdasarkan Slot</option>
                        <option value="custom">Kustom</option>
                    </select>
                </div>

                {/* Table */}
                {hasData ? (
                    <div className="overflow-hidden rounded-lg bg-white shadow-sm dark:bg-slate-800">
                        <Table>
                            <Table.Head>
                                <Table.Row>
                                    <Table.HeaderCell>Nama</Table.HeaderCell>
                                    <Table.HeaderCell>Tipe</Table.HeaderCell>
                                    <Table.HeaderCell>Diskon</Table.HeaderCell>
                                    <Table.HeaderCell>Status</Table.HeaderCell>
                                    <Table.HeaderCell>Outlet</Table.HeaderCell>
                                    <Table.HeaderCell>Priority</Table.HeaderCell>
                                    <Table.HeaderCell className="text-right">Aksi</Table.HeaderCell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {deals.data.map((deal) => (
                                    <Table.Row key={deal.id}>
                                        <Table.Cell>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {deal.name}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {deal.items_count} item, {deal.slots_count} slot
                                                </p>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {dealTypeLabel(deal.deal_type)}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {discountLabel(deal)}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>{statusBadge(deal.status_label)}</Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {deal.outlet?.name || "Global"}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {deal.priority}
                                            </span>
                                        </Table.Cell>
                                        <Table.Cell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {can("restaurant-deals-edit") && (
                                                    <Button
                                                        type="link"
                                                        href={route("restaurant-deals.edit", deal.id)}
                                                        icon={<IconPencil size={16} />}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                                    />
                                                )}
                                                {can("restaurant-deals-delete") && (
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleDelete(deal.id)}
                                                        icon={<IconTrash size={16} />}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20"
                                                    />
                                                )}
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                        <Pagination pagination={deals} />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12 shadow-sm dark:bg-slate-800">
                        <IconChartInfographic className="mb-4 h-16 w-16 text-slate-300 dark:text-slate-600" />
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">
                            Belum ada deal
                        </h3>
                        <p className="mb-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            Mulai dengan membuat deal pertama Anda untuk restoran.
                        </p>
                        {can("restaurant-deals-create") && (
                            <Button
                                type="link"
                                href={route("restaurant-deals.create")}
                                icon={<IconCirclePlus size={18} />}
                                className="bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600"
                                label="Buat Deal"
                            />
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
