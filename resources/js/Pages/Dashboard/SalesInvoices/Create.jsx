import { Head, Link, useForm } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { IconArrowLeft, IconPlus, IconTrash, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "@/Layouts/DashboardLayout";

export default function Create({ customers, products, invoiceNumber }) {
    const { t } = useTranslation();

    const { data, setData, post, processing, errors } = useForm({
        invoice_number: invoiceNumber,
        customer_id: "",
        invoice_date: new Date().toISOString().split("T")[0],
        term_days: 0,
        salesperson: "",
        commission: 0,
        subject: "",
        notes: "",
        remarks: "",
        items: [
            {
                product_id: "",
                description: "",
                unit: "",
                quantity: 1,
                rate: 0,
                discount_percent: 0,
                tax_rate: 0,
            },
        ],
    });

    const addItem = () => {
        setData("items", [
            ...data.items,
            {
                product_id: "",
                description: "",
                unit: "",
                quantity: 1,
                rate: 0,
                discount_percent: 0,
                tax_rate: 0,
            },
        ]);
    };

    const removeItem = (index) => {
        if (data.items.length > 1) {
            const newItems = data.items.filter((_, i) => i !== index);
            setData("items", newItems);
        }
    };

    const updateItem = (index, field, value) => {
        const newItems = [...data.items];
        newItems[index][field] = value;

        // Auto-fill product details when product is selected
        if (field === "product_id" && value) {
            const product = products.find((p) => p.id === value);
            if (product) {
                newItems[index].description = product.title;
                newItems[index].rate = product.sell_price;
            }
        }

        setData("items", newItems);
    };

    const calculateTotals = () => {
        let subtotal = 0;
        let totalTax = 0;

        data.items.forEach((item) => {
            const amount = item.quantity * item.rate;
            const discountAmount = amount * (item.discount_percent || 0) / 100;
            const taxableAmount = amount - discountAmount;
            const taxAmount = taxableAmount * (item.tax_rate || 0) / 100;
            subtotal += amount;
            totalTax += taxAmount;
        });

        return {
            subtotal,
            totalTax,
            total: subtotal + totalTax,
        };
    };

    const totals = calculateTotals();

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("sales-invoices.store"), {
            onSuccess: () => toast.success("Invoice created successfully"),
            onError: () => toast.error("Failed to create invoice"),
        });
    };

    return (
        <>
            <Head title="Create Sales Invoice" />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-6">
                        <Link
                            href={route("sales-invoices.index")}
                            className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                        >
                            <IconArrowLeft size={20} className="mr-2" />
                            Back to Invoices
                        </Link>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Sales Invoice</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Invoice Details */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Invoice Number
                                    </label>
                                    <input
                                        type="text"
                                        value={data.invoice_number}
                                        onChange={(e) => setData("invoice_number", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Invoice Date
                                    </label>
                                    <input
                                        type="date"
                                        value={data.invoice_date}
                                        onChange={(e) => setData("invoice_date", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                    {errors.invoice_date && (
                                        <p className="text-red-600 text-sm mt-1">{errors.invoice_date}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer
                                    </label>
                                    <select
                                        value={data.customer_id}
                                        onChange={(e) => setData("customer_id", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="">Select Customer</option>
                                        {customers.map((customer) => (
                                            <option key={customer.id} value={customer.id}>
                                                {customer.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Terms (Days)
                                    </label>
                                    <input
                                        type="number"
                                        value={data.term_days}
                                        onChange={(e) => setData("term_days", parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Salesperson
                                    </label>
                                    <input
                                        type="text"
                                        value={data.salesperson}
                                        onChange={(e) => setData("salesperson", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Commission (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={data.commission}
                                        onChange={(e) => setData("commission", parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={data.subject}
                                        onChange={(e) => setData("subject", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-medium text-gray-900">Invoice Items</h2>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
                                >
                                    <IconPlus size={18} className="mr-2" />
                                    Add Item
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Product
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Description
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Unit
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Qty
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Rate
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Discount %
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tax %
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Amount
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {data.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={item.product_id}
                                                        onChange={(e) => updateItem(index, "product_id", parseInt(e.target.value))}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    >
                                                        <option value="">Select Product</option>
                                                        {products.map((product) => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.title}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(index, "description", e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.rate}
                                                        onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                        min="0"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.discount_percent}
                                                        onChange={(e) => updateItem(index, "discount_percent", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={item.tax_rate}
                                                        onChange={(e) => updateItem(index, "tax_rate", parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <div className="text-sm text-gray-900">
                                                        {((item.quantity * item.rate) * (1 - (item.discount_percent || 0) / 100) * (1 + (item.tax_rate || 0) / 100)).toFixed(2)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        className="text-red-600 hover:text-red-900"
                                                        disabled={data.items.length === 1}
                                                    >
                                                        <IconTrash size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="mt-6 flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">{totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tax:</span>
                                        <span className="font-medium">{totals.totalTax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total:</span>
                                        <span>{totals.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Notes & Remarks</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes
                                    </label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData("notes", e.target.value)}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Remarks
                                    </label>
                                    <textarea
                                        value={data.remarks}
                                        onChange={(e) => setData("remarks", e.target.value)}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href={route("sales-invoices.index")}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {processing ? "Creating..." : "Create Invoice"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Create.layout = (page) => <DashboardLayout children={page} />;
