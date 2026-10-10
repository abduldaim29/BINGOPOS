import { Head, Link, useForm, router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconPrinter, IconDownload, IconEdit, IconTrash, IconCurrencyDollar } from "@tabler/icons-react";
import { useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { formatCurrency } from "@/Utils/currency";

export default function Show({ invoice }) {
    const { t } = useTranslation();
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        receipt_date: new Date().toISOString().split("T")[0],
        bank: "",
        payment_mode: "Cash",
        reference_number: "",
        amount: invoice.balance,
        notes: "",
    });

    const handleAddPayment = (e) => {
        e.preventDefault();
        post(route("sales-invoices.receipts.add", invoice.id), {
            onSuccess: () => {
                toast.success("Payment recorded successfully");
                setShowPaymentForm(false);
                reset();
            },
            onError: () => toast.error("Failed to record payment"),
        });
    };

    const handleDelete = () => {
        if (confirm("Are you sure you want to delete this invoice?")) {
            router.delete(route("sales-invoices.destroy", invoice.id), {
                onSuccess: () => toast.success("Invoice deleted successfully"),
                onError: () => toast.error("Failed to delete invoice"),
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "draft":
                return "bg-yellow-100 text-yellow-800";
            case "sent":
                return "bg-blue-100 text-blue-800";
            case "paid":
                return "bg-green-100 text-green-800";
            case "overdue":
                return "bg-red-100 text-red-800";
            case "cancelled":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <>
            <Head title={`Invoice ${invoice.invoice_number}`} />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6 flex justify-between items-center">
                        <Link
                            href={route("sales-invoices.index")}
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        >
                            <IconArrowLeft size={20} className="mr-2" />
                            Back to Invoices
                        </Link>
                        <div className="flex gap-2">
                            <Link
                                href={route("sales-invoices.edit", invoice.id)}
                                className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                            >
                                <IconEdit size={18} className="mr-2" />
                                Edit
                            </Link>
                            <a
                                href={route("pdf.sales-invoices.show", invoice.invoice_number)}
                                target="_blank"
                                className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                            >
                                <IconDownload size={18} className="mr-2" />
                                Download PDF
                            </a>
                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                            >
                                <IconPrinter size={18} className="mr-2" />
                                Print
                            </button>
                        </div>
                    </div>

                    {/* Invoice Header */}
                    <div className="bg-white shadow rounded-lg p-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{invoice.invoice_number}</h1>
                                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-600">Invoice Date</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {new Date(invoice.invoice_date).toLocaleDateString()}
                                </p>
                                {invoice.due_date && (
                                    <>
                                        <p className="text-sm text-gray-600 mt-2">Due Date</p>
                                        <p className="text-lg font-medium text-gray-900">
                                            {new Date(invoice.due_date).toLocaleDateString()}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Customer & Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Customer Info */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
                                {invoice.customer ? (
                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="text-lg font-medium text-gray-900">{invoice.customer.name}</p>
                                        {invoice.customer.address && (
                                            <>
                                                <p className="text-sm text-gray-600 mt-3">Address</p>
                                                <p className="text-gray-900">{invoice.customer.address}</p>
                                            </>
                                        )}
                                        {invoice.customer.phone && (
                                            <>
                                                <p className="text-sm text-gray-600 mt-3">Phone</p>
                                                <p className="text-gray-900">{invoice.customer.phone}</p>
                                            </>
                                        )}
                                        {invoice.customer.email && (
                                            <>
                                                <p className="text-sm text-gray-600 mt-3">Email</p>
                                                <p className="text-gray-900">{invoice.customer.email}</p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">Walk-in Customer</p>
                                )}
                            </div>

                            {/* Invoice Items */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h2>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Description
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Unit
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                    Qty
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Rate
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Amount
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Discount
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Tax
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Net
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invoice.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                                        {item.unit || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-center">
                                                        {parseFloat(item.quantity).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatCurrency(item.rate)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatCurrency(item.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatCurrency(item.discount_amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatCurrency(item.tax_amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                                        {formatCurrency(item.net_amount)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes */}
                            {(invoice.notes || invoice.remarks) && (
                                <div className="bg-white shadow rounded-lg p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Notes & Remarks</h2>
                                    {invoice.notes && (
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-600 mb-1">Notes</p>
                                            <p className="text-gray-900">{invoice.notes}</p>
                                        </div>
                                    )}
                                    {invoice.remarks && (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Remarks</p>
                                            <p className="text-gray-900">{invoice.remarks}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Payment History */}
                            {invoice.receipts && invoice.receipts.length > 0 && (
                                <div className="bg-white shadow rounded-lg p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">Payment History</h2>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Date
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Bank
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Mode
                                                    </th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                        Reference
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                        Amount
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {invoice.receipts.map((receipt) => (
                                                    <tr key={receipt.id}>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {new Date(receipt.receipt_date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {receipt.bank || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {receipt.payment_mode}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">
                                                            {receipt.reference_number || "-"}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                                                            {formatCurrency(receipt.amount)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Totals & Actions */}
                        <div className="space-y-6">
                            {/* Totals */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Summary</h2>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Discount</span>
                                        <span className="font-medium">-{formatCurrency(invoice.discount_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax</span>
                                        <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                                        <span>Total</span>
                                        <span>{formatCurrency(invoice.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Paid</span>
                                        <span className="font-medium text-green-600">{formatCurrency(invoice.paid_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-3">
                                        <span>Balance</span>
                                        <span className={invoice.balance > 0 ? "text-red-600" : "text-green-600"}>
                                            {formatCurrency(invoice.balance)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Add Payment */}
                            {invoice.balance > 0 && (
                                <div className="bg-white shadow rounded-lg p-6">
                                    <button
                                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                                        className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                        <IconCurrencyDollar size={20} className="mr-2" />
                                        Record Payment
                                    </button>

                                    {showPaymentForm && (
                                        <form onSubmit={handleAddPayment} className="mt-4 space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Payment Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={data.receipt_date}
                                                    onChange={(e) => setData("receipt_date", e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Bank
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.bank}
                                                    onChange={(e) => setData("bank", e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Payment Mode
                                                </label>
                                                <select
                                                    value={data.payment_mode}
                                                    onChange={(e) => setData("payment_mode", e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                >
                                                    <option value="Cash">Cash</option>
                                                    <option value="Bank Transfer">Bank Transfer</option>
                                                    <option value="Credit Card">Credit Card</option>
                                                    <option value="QRIS">QRIS</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Reference Number
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.reference_number}
                                                    onChange={(e) => setData("reference_number", e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    value={data.amount}
                                                    onChange={(e) => setData("amount", parseFloat(e.target.value) || 0)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    min="0"
                                                    step="0.01"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Notes
                                                </label>
                                                <textarea
                                                    value={data.notes}
                                                    onChange={(e) => setData("notes", e.target.value)}
                                                    rows="2"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowPaymentForm(false);
                                                        reset();
                                                    }}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                                >
                                                    {processing ? "Processing..." : "Record Payment"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {/* Additional Info */}
                            <div className="bg-white shadow rounded-lg p-6">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
                                <div className="space-y-3 text-sm">
                                    {invoice.salesperson && (
                                        <div>
                                            <p className="text-gray-600">Salesperson</p>
                                            <p className="text-gray-900">{invoice.salesperson}</p>
                                        </div>
                                    )}
                                    {invoice.commission > 0 && (
                                        <div>
                                            <p className="text-gray-600">Commission</p>
                                            <p className="text-gray-900">{parseFloat(invoice.commission).toFixed(2)}%</p>
                                        </div>
                                    )}
                                    {invoice.subject && (
                                        <div>
                                            <p className="text-gray-600">Subject</p>
                                            <p className="text-gray-900">{invoice.subject}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-gray-600">Created By</p>
                                        <p className="text-gray-900">{invoice.created_by?.name || "System"}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600">Created At</p>
                                        <p className="text-gray-900">{new Date(invoice.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

Show.layout = (page) => <DashboardLayout children={page} />;
