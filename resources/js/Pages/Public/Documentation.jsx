import { Head } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import { IconBook2, IconArrowRight, IconBrandGithub } from "@tabler/icons-react";

const GITHUB_URL = "https://github.com/abduldaim29/BINGOPOS";
const DOCS_BASE = `${GITHUB_URL}/blob/main/docs`;
const REPO_BASE = `${GITHUB_URL}/blob/main`;

const categories = [
    {
        title: "Getting Started",
        docs: [
            { file: "getting-started.md", title: "Getting Started", desc: "Complete setup guide, from initial installation to logging in and accessing the dashboard." },
            { file: "configuration.md", title: "Configuration", desc: "Environment settings, payment gateways, taxes, thermal printers, and WhatsApp integration." },
            { file: "architecture-overview.md", title: "Architecture Overview", desc: "Code structure, service layer, middleware, and Node.js services." },
            { file: "feature-index.md", title: "Feature Index", desc: "List of features, documentation, and their implementation status." },
            { file: "CHANGELOG.md", href: `${REPO_BASE}/CHANGELOG.md`, title: "Changelog", desc: "Application release history, including the latest version." },
        ],
    },
    {
        title: "POS & Transactions",
        docs: [
            { file: "features/pos-transactions.md", title: "POS Transactions", desc: "Cart management, checkout, hold and resume orders, and multiple payment methods." },
            { file: "features/cashier-shifts.md", title: "Cashier Shifts", desc: "Opening and closing cashier shifts and reviewing cash summaries for each shift." },
            { file: "features/sales-returns.md", title: "Sales Returns", desc: "Process returns for completed sales transactions." },
            { file: "features/mobile-pos.md", title: "Mobile POS (PWA)", desc: "Use the POS on mobile devices with installable and offline-ready functionality." },
            { file: "features/offline-mode.md", title: "Offline Mode", desc: "Offline limitations, queued transactions, and synchronization." },
            { file: "features/thermal-printer.md", title: "Thermal Printer", desc: "Print 58mm and 80mm receipts using WebUSB." },
            { file: "features/dine-in.md", title: "Dine-in QR Menu", desc: "QR menus, self-ordering, floor plans, and order status tracking." },
            { file: "features/api-integration.md", title: "API & Integrations", desc: "Authentication, POS endpoints, master data, and API documentation." },
        ],
    },
    {
        title: "Inventory & Warehouse",
        docs: [
            { file: "features/inventory-stock.md", title: "Inventory & Stock", desc: "Products, categories, stocktaking, and stock movements." },
            { file: "features/multi-warehouse.md", title: "Multi-Warehouse", desc: "Manage stock by warehouse and transfer inventory between warehouses." },
            { file: "features/unit-conversion.md", title: "Unit Conversion", desc: "Product unit conversions, including pieces, boxes, kilograms, and cartons." },
        ],
    },
    {
        title: "Purchasing & Finance",
        docs: [
            { file: "features/purchasing-chain.md", title: "Procurement Workflow", desc: "Purchase orders, goods receiving, and supplier returns." },
            { file: "features/payables-suppliers.md", title: "Suppliers & Payables", desc: "Manage suppliers and accounts payable." },
            { file: "features/receivables.md", title: "Accounts Receivable", desc: "Manage customer receivables and partial payments." },
            { file: "features/tax-management.md", title: "Tax Management", desc: "Manage VAT, tax identification numbers, and business registration numbers." },
            { file: "features/customer-portal.md", title: "Customer Portal", desc: "Self-service portal for viewing invoices and making online payments." },
        ],
    },
    {
        title: "CRM & Loyalty",
        docs: [
            { file: "features/crm-segments.md", title: "Segments & Campaigns", desc: "Automated customer segmentation and marketing campaigns." },
            { file: "features/member-management.md", title: "Member Management", desc: "Manage membership tiers and loyalty points." },
            { file: "features/promotions-loyalty.md", title: "Promotions & Loyalty", desc: "Pricing rules, vouchers, and customer loyalty programs." },
        ],
    },
    {
        title: "Administration & Tools",
        docs: [
            { file: "features/rbac-users-roles.md", title: "Role-Based Access Control (RBAC)", desc: "Manage users, roles, and permissions." },
            { file: "features/audit-logs.md", title: "Audit Logs", desc: "Track changes with before-and-after records." },
            { file: "features/settings-payments.md", title: "Payment Settings", desc: "Configure Midtrans, Xendit, and bank accounts." },
            { file: "features/import-export.md", title: "Import & Export", desc: "Import and export products and customers using Excel." },
            { file: "features/reports-documents.md", title: "Reports & Documents", desc: "Generate reports and PDF documents." },
            { file: "features/whatsapp-gateway.md", title: "WhatsApp Gateway", desc: "WhatsApp integration using whatsapp-web.js." },
            { file: "features/discount-approval.md", title: "Discount Approval", desc: "Manage discount approvals, permissions, and audit trails." },
            { file: "features/app-versioning.md", title: "Application Versioning", desc: "Configure APP_VERSION, user interface versioning, and release policies." },
        ],
    },
];

export default function Documentation() {
    return (
        <PublicLayout active="/documentation">
            <Head title="Documentation — BINGOPOS" />

            {/* Header */}
            <section className="pt-20 pb-14 px-6 bg-gradient-to-b from-primary-50 dark:from-primary-950/40 to-transparent">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-sm font-medium mb-5 border border-primary-100 dark:border-primary-900">
                        <IconBook2 size={16} />
                        Documentation
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                        Complete Documentation
                    </h1>
                    <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        All guides are available in the GitHub repository, kept up to date
                        and evolving alongside the codebase.
                    </p>
                </div>
            </section>

            {/* Categories */}
            <section className="pb-20 px-6">
                <div className="max-w-5xl mx-auto space-y-14">
                    {categories.map((cat) => (
                        <div key={cat.title}>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-3">
                                <span className="w-8 h-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600" />
                                {cat.title}
                            </h2>
                            <div className="grid sm:grid-cols-2 gap-4">
                                {cat.docs.map((doc) => (
                                    <a
                                        key={doc.file}
                                        href={doc.href || `${DOCS_BASE}/${doc.file}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group p-5 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {doc.title}
                                            </h3>
                                            <IconArrowRight size={16} className="text-slate-400 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {doc.desc}
                                        </p>
                                    </a>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Call to Action */}
            <section className="pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-8 text-center">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Need clarification or more information?
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            The documentation is open source. Help improve it by submitting
                            a pull request, or ask questions in GitHub Discussions.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a
                                href={`${GITHUB_URL}/blob/main/docs/README.md`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all"
                            >
                                <IconBrandGithub size={18} />
                                Browse All Documentation
                            </a>
                            <a
                                href={`${GITHUB_URL}/discussions`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-primary-300 transition-colors"
                            >
                                Ask in Discussions
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}