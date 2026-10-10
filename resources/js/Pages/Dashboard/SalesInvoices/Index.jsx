import { Head, Link, router } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { IconBuildingStore, IconPrinter, IconDownload, IconEdit, IconTrash, IconPlus, IconSearch, IconFilter } from "@tabler/icons-react";
import { useState } from "react";
import toast from "react-hot-toast";
import DashboardLayout from "@/Layouts/DashboardLayout";
import { formatCurrency } from "@/Utils/currency";


export default function Index({ invoices, filters }) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState(filters.search || "");
    const [statusFilter, setStatusFilter] = useState(filters.status || "all");

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route("sales-invoices.index"), {
            search: searchTerm,
            status: statusFilter,
        });
    };

    const handleDelete = (id) => {
        if (confirm(t("salesInvoices.deleteConfirm"))) {
            router.delete(route("sales-invoices.destroy", id), {
                onSuccess: () => toast.success(t("salesInvoices.deleteSuccess")),
                onError: () => toast.error(t("salesInvoices.deleteError")),
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
            <Head title={t("salesInvoices.title")} />
            <div className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{t("sidebar.items.salesInvoices")}</h1>
                        <Link
                            href={route("sales-invoices.create")}
                            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                            <IconPlus size={20} className="mr-2" />
                            {t("salesInvoices.createInvoice")}
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white shadow rounded-lg p-4 mb-6">
                        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <IconSearch size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder={t("salesInvoices.searchPlaceholder")}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="min-w-[150px]">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="all">{t("salesInvoices.allStatus")}</option>
                                    <option value="draft">{t("salesInvoices.statusDraft")}</option>
                                    <option value="sent">{t("salesInvoices.statusSent")}</option>
                                    <option value="paid">{t("salesInvoices.statusPaid")}</option>
                                    <option value="overdue">{t("salesInvoices.statusOverdue")}</option>
                                    <option value="cancelled">{t("salesInvoices.statusCancelled")}</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center"
                            >
                                <IconFilter size={20} className="mr-2" />
                                {t("salesInvoices.filter")}
                            </button>
                        </form>
                    </div>

                    {/* Invoices Table */}
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Invoice Number
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Balance
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {invoices.data.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                                {t("salesInvoices.noInvoices")}
                                            </td>
                                        </tr>
                                    ) : (
                                        invoices.data.map((invoice) => (
                                            <tr key={invoice.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {invoice.invoice_number}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {new Date(invoice.invoice_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">
                                                        {invoice.customer?.name || "Walk-in Customer"}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-900">
                                                        {formatCurrency(invoice.total_amount)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="text-sm text-gray-900">
                                                        {formatCurrency(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Link
                                                            href={route("sales-invoices.show", invoice.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="View"
                                                        >
                                                            <IconSearch size={18} />
                                                        </Link>
                                                        <Link
                                                            href={route("sales-invoices.edit", invoice.id)}
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Edit"
                                                        >
                                                            <IconEdit size={18} />
                                                        </Link>
                                                        <a
                                                            href={route("pdf.sales-invoices.show", invoice.invoice_number)}
                                                            target="_blank"
                                                            className="text-indigo-600 hover:text-indigo-900"
                                                            title="Download PDF"
                                                        >
                                                            <IconDownload size={18} />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDelete(invoice.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <IconTrash size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {invoices.links && (
                            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        {invoices.prev_page_url && (
                                            <Link
                                                href={invoices.prev_page_url}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {invoices.next_page_url && (
                                            <Link
                                                href={invoices.next_page_url}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing <span className="font-medium">{invoices.from || 0}</span> to{" "}
                                                <span className="font-medium">{invoices.to || 0}</span> of{" "}
                                                <span className="font-medium">{invoices.total}</span> results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                {invoices.links.map((link, index) => (
                                                    <Link
                                                        key={index}
                                                        href={link.url || "#"}
                                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                            link.active
                                                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                                        } ${!link.url ? "cursor-not-allowed" : ""}`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Index.layout = (page) => <DashboardLayout children={page} />;
