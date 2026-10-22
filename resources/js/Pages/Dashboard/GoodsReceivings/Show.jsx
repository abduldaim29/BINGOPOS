import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link } from "@inertiajs/react";
import Table from "@/Components/Dashboard/Table";
import {
    IconArrowLeft,
    IconTruckDelivery,
    IconPackage,
} from "@tabler/icons-react";

const formatCurrency = (value = 0) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "PKR",
        minimumFractionDigits: 0,
    }).format(value);

const formatDateTime = (value) =>
    value
        ? new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
          }).format(new Date(value))
        : "-";

export default function Show({ receiving }) {
    return (
        <>
            <Head title={receiving.document_number} />
            <div className="mb-6">
                <Link
                    href={route("goods-receivings.index")}
                    className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600"
                >
                    <IconArrowLeft size={16} />
                    Back to Goods Receipts
                </Link>
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {receiving.document_number}
                    </h1>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Reference PO:{" "}
                    <Link
                        href={route("purchase-orders.show", receiving.purchase_order_id)}
                        className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                        {receiving.purchase_order?.document_number || "-"}
                    </Link>
                    {" "}&bull; Supplier: {receiving.supplier?.name || "-"}
                    {" "}&bull; Received by {receiving.receiver?.name || "-"}
                    {" "}&bull; {formatDateTime(receiving.received_at)}
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                        Received Items
                    </h2>
                    <Table>
                        <Table.Thead>
                            <tr>
                                <Table.Th>Product</Table.Th>
                                <Table.Th>Qty Received</Table.Th>
                                <Table.Th>Unit Price</Table.Th>
                                <Table.Th>Subtotal</Table.Th>
                                <Table.Th>Notes</Table.Th>
                            </tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {receiving.items.length > 0 ? (
                                receiving.items.map((item) => {
                                    const unitPrice =
                                        item.purchase_order_item?.unit_price || 0;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Table.Td>
                                                <p className="font-medium text-slate-800 dark:text-slate-200">
                                                    {item.product?.title ||
                                                        "Product #" + item.product_id}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {item.product?.sku || "-"}
                                                </p>
                                            </Table.Td>
                                            <Table.Td className="font-semibold">
                                                {item.qty_received}
                                            </Table.Td>
                                            <Table.Td>
                                                {formatCurrency(unitPrice)}
                                            </Table.Td>
                                            <Table.Td className="font-semibold">
                                                {formatCurrency(
                                                    item.qty_received * unitPrice
                                                )}
                                            </Table.Td>
                                            <Table.Td className="text-xs text-slate-500">
                                                {item.notes || "-"}
                                            </Table.Td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <Table.Empty
                                    colSpan={5}
                                    message={
                                        <div className="text-slate-500 dark:text-slate-400">
                                            No items in this goods receipt.
                                        </div>
                                    }
                                >
                                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                        <IconPackage
                                            size={28}
                                            className="text-slate-400"
                                        />
                                    </div>
                                </Table.Empty>
                            )}
                        </Table.Tbody>
                    </Table>
                </div>

                <div className="space-y-6">
                    {receiving.notes && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                                Notes
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {receiving.notes}
                            </p>
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                            Information
                        </h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Document</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {receiving.document_number}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Reference PO
                                </span>
                                <Link
                                    href={route(
                                        "purchase-orders.show",
                                        receiving.purchase_order_id
                                    )}
                                    className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                >
                                    {receiving.purchase_order?.document_number ||
                                        "-"}
                                </Link>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Received Date
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {formatDateTime(receiving.received_at)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">
                                    Received By
                                </span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {receiving.receiver?.name || "-"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page) => <DashboardLayout children={page} />;