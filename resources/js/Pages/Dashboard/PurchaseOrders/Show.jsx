import React from "react";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import Button from "@/Components/Dashboard/Button";
import Table from "@/Components/Dashboard/Table";
import { useAuthorization } from "@/Utils/authorization";
import {
    IconArrowLeft,
    IconCheck,
    IconCircleX,
    IconPackage,
    IconShoppingCart,
    IconTruckDelivery,
} from "@tabler/icons-react";
import toast from "react-hot-toast";

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

const statusBadge = (status) => {
    const base = "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";
    const map = {
        draft: "bg-warning-100 text-warning-700 dark:bg-warning-950/30 dark:text-warning-400",
        ordered: "bg-primary-100 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400",
        partial_received: "bg-accent-100 text-accent-700 dark:bg-accent-950/30 dark:text-accent-400",
        completed: "bg-success-100 text-success-700 dark:bg-success-950/30 dark:text-success-400",
        cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
    };
    const labels = {
        draft: "Draft",
        ordered: "Ordered",
        partial_received: "Partially Received",
        completed: "Completed",
        cancelled: "Cancelled",
    };
    return (
        <span className={`${base} ${map[status] || map.draft}`}>
            {labels[status] || status}
        </span>
    );
};

export default function Show({ order }) {
    const { can } = useAuthorization();
    const canEdit = can("purchase-orders-update");
    const canCreateReceiving = can("goods-receivings-create");

    const placeOrder = () => {
        router.post(
            route("purchase-orders.place", order.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Purchase order placed successfully."),
                onError: () => toast.error("Failed to place purchase order."),
            }
        );
    };

    const cancelOrder = () => {
        router.post(
            route("purchase-orders.cancel", order.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success("Purchase order cancelled successfully."),
                onError: () => toast.error("Failed to cancel purchase order."),
            }
        );
    };

    const canPlace = order.status === "draft" && canEdit;
    const canCancel = ["draft", "ordered", "partial_received"].includes(order.status) && canEdit;

    return (
        <>
            <Head title={order.document_number} />
            <div className="mb-6">
                <Link
                    href={route("purchase-orders.index")}
                    className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600"
                >
                    <IconArrowLeft size={16} />
                    Back to Purchase Orders
                </Link>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <div className="mb-2 flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {order.document_number}
                            </h1>
                            {statusBadge(order.status)}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Supplier: {order.supplier?.name || "-"} &bull; Created by{" "}
                            {order.creator?.name || "-"} &bull; {formatDateTime(order.created_at)}
                        </p>
                        {order.ordered_at && (
                            <p className="text-sm text-slate-500">
                                Ordered: {formatDateTime(order.ordered_at)}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {canPlace && (
                            <Button
                                type="button"
                                icon={<IconCheck size={18} />}
                                className="bg-primary-500 hover:bg-primary-600 text-white"
                                label="Place Order with Supplier"
                                onClick={placeOrder}
                            />
                        )}
                        {canCancel && (
                            <Button
                                type="button"
                                icon={<IconCircleX size={18} />}
                                className="bg-rose-500 hover:bg-rose-600 text-white"
                                label="Cancel Purchase Order"
                                onClick={cancelOrder}
                            />
                        )}
                        {canCreateReceiving &&
                            ["ordered", "partial_received"].includes(order.status) && (
                                <Button
                                    type="link"
                                    href={route("goods-receivings.create", {
                                        purchase_order_id: order.id,
                                    })}
                                    icon={<IconTruckDelivery size={18} />}
                                    className="bg-success-500 hover:bg-success-600 text-white"
                                    label="Receive Goods"
                                />
                            )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                            Purchase Order Items
                        </h2>
                        <Table>
                            <Table.Thead>
                                <tr>
                                    <Table.Th>Product</Table.Th>
                                    <Table.Th>Qty Ordered</Table.Th>
                                    <Table.Th>Qty Received</Table.Th>
                                    <Table.Th>Remaining</Table.Th>
                                    <Table.Th>Unit Price</Table.Th>
                                    <Table.Th>Subtotal</Table.Th>
                                </tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {order.items.length > 0 ? (
                                    order.items.map((item) => {
                                        const remaining = item.qty_ordered - item.qty_received;
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
                                                <Table.Td>{item.qty_ordered}</Table.Td>
                                                <Table.Td>{item.qty_received}</Table.Td>
                                                <Table.Td>
                                                    <span
                                                        className={`font-semibold ${
                                                            remaining > 0
                                                                ? "text-warning-600"
                                                                : "text-success-600"
                                                        }`}
                                                    >
                                                        {remaining}
                                                    </span>
                                                </Table.Td>
                                                <Table.Td>
                                                    {formatCurrency(item.unit_price)}
                                                </Table.Td>
                                                <Table.Td className="font-semibold">
                                                    {formatCurrency(
                                                        item.qty_ordered * item.unit_price
                                                    )}
                                                </Table.Td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <Table.Empty
                                        colSpan={6}
                                        message={
                                            <div className="text-slate-500 dark:text-slate-400">
                                                No items in this purchase order.
                                            </div>
                                        }
                                    >
                                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                            <IconPackage size={28} className="text-slate-400" />
                                        </div>
                                    </Table.Empty>
                                )}
                            </Table.Tbody>
                        </Table>
                    </div>

                    {order.goods_receivings?.length > 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                                Goods Receiving History
                            </h2>
                            <Table>
                                <Table.Thead>
                                    <tr>
                                        <Table.Th>Document</Table.Th>
                                        <Table.Th>Received Date</Table.Th>
                                        <Table.Th>Items</Table.Th>
                                        <Table.Th>Actions</Table.Th>
                                    </tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {order.goods_receivings.map((gr) => (
                                        <tr
                                            key={gr.id}
                                            className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <Table.Td className="font-medium">
                                                {gr.document_number}
                                            </Table.Td>
                                            <Table.Td>
                                                {formatDateTime(gr.received_at)}
                                            </Table.Td>
                                            <Table.Td>{gr.items?.length || 0}</Table.Td>
                                            <Table.Td>
                                                <Link
                                                    href={route("goods-receivings.show", gr.id)}
                                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                                >
                                                    View Details
                                                </Link>
                                            </Table.Td>
                                        </tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {order.notes && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                                Notes
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {order.notes}
                            </p>
                        </div>
                    )}

                    {order.payable && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                            <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                                Supplier Payable
                            </h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Document</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {order.payable.document_number}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Total</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {formatCurrency(order.payable.total)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Paid</span>
                                    <span className="font-medium text-slate-800 dark:text-slate-200">
                                        {formatCurrency(order.payable.paid)}
                                    </span>
                                </div>
                                <Link
                                    href={route("payables.show", order.payable.id)}
                                    className="mt-3 inline-flex text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                >
                                    View Payable Details &rarr;
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                        <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                            Information
                        </h2>
                        <div className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                                <p className="font-medium text-slate-700 dark:text-slate-200">
                                    Purchase Order Workflow
                                </p>
                                <ul className="mt-2 space-y-2">
                                    <li>1. Create a purchase order with Draft status.</li>
                                    <li>2. Place the order with the supplier to change its status to Ordered.</li>
                                    <li>3. Receive goods through the Receive Goods menu.</li>
                                    <li>4. The supplier payable will be recorded automatically.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page) => <DashboardLayout children={page} />;