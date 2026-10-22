import { Head } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    IconShoppingCart,
    IconBuildingWarehouse,
    IconTruckDelivery,
    IconReportMoney,
    IconUsers,
    IconChartBar,
    IconShieldLock,
    IconCreditCard,
    IconCheck,
    IconArrowRight,
    IconQrcode,
    IconApi,
} from "@tabler/icons-react";

const GITHUB_URL = "https://github.com/abduldaim29/BINGOPOS";

const modules = [
    {
        icon: IconShoppingCart,
        title: "POS & Transactions",
        desc: "The core of BINGOPOS — a fast, flexible, and reliable point-of-sale system for everyday business operations.",
        screenshot: "/screenshots/02-pos-checkout.png",
        features: [
            "Search products by barcode or keyword",
            "Scan barcodes using the camera (PWA)",
            "Multi-item cart with hold and resume functionality",
            "Multiple checkout payment methods: cash, bank transfer, Midtrans, Xendit, and pay later",
            "Multiple product units (pieces, boxes, kilograms, cartons) with stock conversion",
            "Promotion engine: discounts, quantity breaks, bundles, and buy-X-get-Y offers",
            "Discount approval workflow",
            "Print 58mm and 80mm thermal receipts using WebUSB",
            "Offline checkout — prepared transactions are queued and synchronized when the connection is restored",
        ],
    },
    {
        icon: IconBuildingWarehouse,
        title: "Inventory & Multi-Warehouse",
        desc: "Maintain complete control over stock across all warehouses and branches.",
        screenshot: "/screenshots/07-warehouses.png",
        features: [
            "Product, category, and barcode management",
            "Separate stock tracking for each warehouse and branch",
            "Inter-warehouse stock transfers (draft → send → receive)",
            "Stocktaking for each warehouse",
            "Complete stock movement history",
            "Batch and expiry date tracking (FEFO)",
            "Composite products and kits",
            "Reorder points with automatic purchase order recommendations",
            "Low-stock notifications",
        ],
    },
    {
        icon: IconTruckDelivery,
        title: "Purchasing & Suppliers",
        desc: "Manage the entire procurement process, from purchase orders to supplier payables.",
        screenshot: "/screenshots/09-purchase-orders.png",
        features: [
            "Purchase orders (draft → ordered → partial → completed)",
            "Goods receiving with batch entry",
            "Supplier returns",
            "Supplier information management",
            "Supplier payables with aging analysis",
        ],
    },
    {
        icon: IconReportMoney,
        title: "Finance & Receivables",
        desc: "Keep your finances under control with customer receivables, supplier payables, and tax management in one place.",
        screenshot: "/screenshots/12-receivables.png",
        features: [
            "Customer receivables with partial payments",
            "Aging analysis and collection notes",
            "Supplier payables and payments",
            "VAT 11% (exclusive/inclusive) and tax identification data",
            "Customer portal for viewing invoices and making online payments",
        ],
    },
    {
        icon: IconUsers,
        title: "CRM & Loyalty",
        desc: "Grow your business by encouraging customers to return and shop again.",
        screenshot: "/screenshots/19-members.png",
        features: [
            "Customer management with Indonesian regional data",
            "Membership tiers (regular, silver, gold, platinum)",
            "Loyalty points (earn and redeem)",
            "Customer vouchers",
            "Automated segmentation (manual and rule-based)",
            "Campaign automation for reminders and promotions",
            "WhatsApp Gateway for automated receipts, reminders, and promotions",
        ],
    },
    {
        icon: IconChartBar,
        title: "Reports & Insights",
        desc: "Make data-driven business decisions instead of relying on guesswork.",
        screenshot: "/screenshots/15-sales-report.png",
        features: [
            "Sales reports with filters and summaries",
            "Profit reports and margin analysis",
            "Advanced insights: peak hours, cashier performance, and repeat customers",
            "PDF invoices, receipts (80mm/58mm), and shipping labels",
            "PDF reports for receivables and payables",
            "Export products, customers, and transactions to Excel",
        ],
    },
    {
        icon: IconShieldLock,
        title: "Administration & Security",
        desc: "Maintain clear visibility into who has access to what and who changed what.",
        screenshot: "/screenshots/31-audit-logs.png",
        features: [
            "Full role-based access control (RBAC): users, roles, and permissions",
            "Audit logs with before-and-after snapshots",
            "Step-up authentication for sensitive actions",
            "Import products and customers from Excel",
            "Centralized application versioning (APP_VERSION)",
            "Cashier shift management",
        ],
    },
    {
        icon: IconCreditCard,
        title: "Payments & Settings",
        desc: "Accept the payment methods your customers prefer.",
        screenshot: "/screenshots/24-payment-settings.png",
        features: [
            "Payment gateways: Midtrans and Xendit",
            "Bank accounts for manual bank transfers",
            "Multiple price lists for different customer groups",
            "Sales targets and store profiles",
            "Printer and tax settings",
            "Multilingual support: Indonesian and English",
        ],
    },
    {
        icon: IconQrcode,
        title: "Dine-in QR & Self-Ordering",
        desc: "Customers can open the menu using a table QR code, place orders, and track their order status.",
        screenshot: "/screenshots/01-dashboard.png",
        features: [
            "Dining areas and table floor plans",
            "Unique QR codes for each table",
            "Public menus and customer shopping carts",
            "Order status tracking through polling",
            "Staff can accept or reject orders",
            "Payments are currently processed at the cashier",
        ],
    },
    {
        icon: IconApi,
        title: "API & Integrations",
        desc: "Authenticated endpoints for application integrations, devices, and POS synchronization.",
        screenshot: "/screenshots/01-dashboard.png",
        features: [
            "Sanctum-based authentication tokens",
            "Master data for products, customers, categories, warehouses, and suppliers",
            "Cart, shifts, checkout, transactions, and offline synchronization",
            "Permission-based API ability protection",
            "API documentation available through Scramble",
        ],
    },
];

export default function Features() {
    return (
        <PublicLayout active="/features">
            <Head title="Complete Features — BINGOPOS" />

            {/* Header */}
            <section className="pt-20 pb-14 px-6 bg-gradient-to-b from-primary-50 dark:from-primary-950/40 to-transparent">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                        Complete Features for Real Businesses
                    </h1>
                    <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                        Integrated features ranging from everyday checkout to advanced
                        analytics, free to use and open source under the MIT License.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {modules.map((m) => (
                            <a
                                key={m.title}
                                href={`#${m.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                                className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                {m.title}
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Modules */}
            <section className="pb-20 px-6">
                <div className="max-w-7xl mx-auto space-y-20">
                    {modules.map((mod, idx) => (
                        <div
                            key={mod.title}
                            id={mod.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                            className={`flex flex-col ${idx % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"} gap-10 items-center`}
                        >
                            {/* Text */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                        <mod.icon size={22} className="text-white" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                        {mod.title}
                                    </h2>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mb-5">
                                    {mod.desc}
                                </p>
                                <ul className="space-y-2.5">
                                    {mod.features.map((f) => (
                                        <li key={f} className="flex items-start gap-2.5">
                                            <IconCheck
                                                size={18}
                                                className="text-emerald-500 mt-0.5 shrink-0"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">
                                                {f}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Screenshot */}
                            <div className="flex-1 w-full">
                                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
                                    <img
                                        src={mod.screenshot}
                                        alt={`${mod.title} screenshot`}
                                        className="w-full"
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="pb-20 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Is There a Feature You Need?
                        </h2>
                        <p className="text-slate-400 mb-6">
                            As an open-source project, new features can come from anyone —
                            including you.
                        </p>
                        <a
                            href={`${GITHUB_URL}/issues`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all"
                        >
                            Suggest a Feature on GitHub
                            <IconArrowRight size={16} />
                        </a>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}