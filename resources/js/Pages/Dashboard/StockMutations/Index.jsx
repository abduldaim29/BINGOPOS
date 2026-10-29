import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, router, useForm } from "@inertiajs/react";
import Table from "@/Components/Dashboard/Table";
import Pagination from "@/Components/Dashboard/Pagination";
import { IconAdjustmentsHorizontal, IconHistory } from "@tabler/icons-react";

const formatDateTime = (value) =>
    value
        ? new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "-";

export default function Index({ stockMutations, products, warehouses = [], filters }) {
    const stockForm = useForm({
        product_id: "",
        warehouse_id: warehouses[0]?.id || "",
        adjustment_type: "set",
        quantity: "",
        notes: "",
    });

    const submitStockUpdate = (event) => {
        event.preventDefault();
        stockForm.post(route("stock-mutations.update-stock"), {
            preserveScroll: true,
            onSuccess: () => stockForm.reset("quantity", "notes"),
        });
    };

    const updateFilter = (key, value) => {
        router.get(
            route("stock-mutations.index"),
            {
                ...filters,
                [key]: value,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    return (
        <>
            <Head title="Stock Mutations" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Stock Mutations
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    History of stock changes from stock counts and initial product stock.
                </p>
            </div>

            <div className="mb-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-5 dark:border-primary-900/50 dark:bg-primary-950/20">
                <div className="mb-4 flex items-start gap-3">
                    <div className="rounded-xl bg-primary-100 p-2 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300">
                        <IconAdjustmentsHorizontal size={20} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-900 dark:text-white">
                            Update Stock
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Set the current stock or add/remove quantity for a warehouse.
                        </p>
                    </div>
                </div>

                <form onSubmit={submitStockUpdate} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            Product
                        </label>
                        <select
                            value={stockForm.data.product_id}
                            onChange={(event) => stockForm.setData("product_id", event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Select product</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.title}
                                </option>
                            ))}
                        </select>
                        {stockForm.errors.product_id && <p className="mt-1 text-xs text-red-600">{stockForm.errors.product_id}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            Warehouse
                        </label>
                        <select
                            value={stockForm.data.warehouse_id}
                            onChange={(event) => stockForm.setData("warehouse_id", event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="">Select warehouse</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.code} — {warehouse.name}
                                </option>
                            ))}
                        </select>
                        {stockForm.errors.warehouse_id && <p className="mt-1 text-xs text-red-600">{stockForm.errors.warehouse_id}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            Action
                        </label>
                        <select
                            value={stockForm.data.adjustment_type}
                            onChange={(event) => stockForm.setData("adjustment_type", event.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                            <option value="set">Set stock to</option>
                            <option value="add">Add stock</option>
                            <option value="remove">Remove stock</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            Quantity
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="1"
                            value={stockForm.data.quantity}
                            onChange={(event) => stockForm.setData("quantity", event.target.value)}
                            placeholder="Enter quantity"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                        {stockForm.errors.quantity && <p className="mt-1 text-xs text-red-600">{stockForm.errors.quantity}</p>}
                    </div>

                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={stockForm.processing}
                            className="h-11 w-full rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {stockForm.processing ? "Updating..." : "Update Stock"}
                        </button>
                    </div>

                    <div className="md:col-span-2 lg:col-span-5">
                        <input
                            type="text"
                            value={stockForm.data.notes}
                            onChange={(event) => stockForm.setData("notes", event.target.value)}
                            placeholder="Reason or note (optional)"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        />
                        {stockForm.errors.notes && <p className="mt-1 text-xs text-red-600">{stockForm.errors.notes}</p>}
                    </div>
                </form>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-5">
                <select
                    value={filters.product_id || ""}
                    onChange={(event) =>
                        updateFilter("product_id", event.target.value)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                    <option value="">All Products</option>
                    {products.map((product) => (
                        <option key={product.id} value={product.id}>
                            {product.title}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.mutation_type || ""}
                    onChange={(event) =>
                        updateFilter("mutation_type", event.target.value)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                    <option value="">All Types</option>
                    <option value="in">In</option>
                    <option value="out">Out</option>
                    <option value="adjustment">Adjustment</option>
                </select>

                <select
                    value={filters.warehouse_id || ""}
                    onChange={(event) => updateFilter("warehouse_id", event.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                    <option value="">All Warehouses</option>
                    {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={filters.date_from || ""}
                    onChange={(event) =>
                        updateFilter("date_from", event.target.value)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />

                <input
                    type="date"
                    value={filters.date_to || ""}
                    onChange={(event) =>
                        updateFilter("date_to", event.target.value)
                    }
                    className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
            </div>

            <Table.Card title="Stock Mutation History">
                <Table>
                    <Table.Thead>
                        <tr>
                            <Table.Th>Product</Table.Th>
                            <Table.Th>Type</Table.Th>
                            <Table.Th>Quantity</Table.Th>
                            <Table.Th>Before / After</Table.Th>
                            <Table.Th>Warehouse</Table.Th>
                            <Table.Th>Reference</Table.Th>
                            <Table.Th>Created By</Table.Th>
                            <Table.Th>Date & Time</Table.Th>
                        </tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {stockMutations.data.length > 0 ? (
                            stockMutations.data.map((mutation) => (
                                <tr
                                    key={mutation.id}
                                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                >
                                    <Table.Td>
                                        <div>
                                            <p className="font-medium text-slate-800 dark:text-slate-200">
                                                {mutation.product?.title || "-"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {mutation.product?.barcode || mutation.product?.sku || "-"}
                                            </p>
                                        </div>
                                    </Table.Td>
                                    <Table.Td>
                                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {mutation.mutation_type}
                                        </span>
                                    </Table.Td>
                                    <Table.Td>{mutation.qty}</Table.Td>
                                    <Table.Td>
                                        {mutation.stock_before} → {mutation.stock_after}
                                    </Table.Td>
                                    <Table.Td>{mutation.warehouse?.name || "-"}</Table.Td>
                                    <Table.Td>
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {mutation.reference_type}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {mutation.notes || "-"}
                                            </p>
                                        </div>
                                    </Table.Td>
                                    <Table.Td>{mutation.creator?.name || "-"}</Table.Td>
                                    <Table.Td>{formatDateTime(mutation.created_at)}</Table.Td>
                                </tr>
                            ))
                        ) : (
                            <Table.Empty
                                colSpan={8}
                                message={
                                    <div className="text-slate-500 dark:text-slate-400">
                                        No stock mutations available yet.
                                    </div>
                                }
                            >
                                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                    <IconHistory size={28} className="text-slate-400" />
                                </div>
                            </Table.Empty>
                        )}
                    </Table.Tbody>
                </Table>
            </Table.Card>

            {stockMutations.last_page > 1 && (
                <Pagination links={stockMutations.links} />
            )}
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;