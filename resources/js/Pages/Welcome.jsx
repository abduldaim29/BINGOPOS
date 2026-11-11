import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    IconShoppingCart,
    IconWallet,
    IconBuildingWarehouse,
    IconReceiptTax,
    IconChartBar,
    IconReportMoney,
    IconUsers,
    IconShieldLock,
    IconCloudOff,
    IconArrowRight,
    IconDeviceMobile,
    IconQrcode,
    IconApi,
    IconRocket,
    IconSettings,
    IconChartDots,
} from "@tabler/icons-react";

const stats = [
    { value: "44+", label: "Complete Features" },
    { value: "24/7", label: "Business Visibility" },
    { value: "100%", label: "Data Ownership" },
    { value: "8", label: "Integrated Modules" },
];

const features = [
    {
        icon: IconShoppingCart,
        title: "Fast & Easy POS",
        desc: "Find products by barcode or keyboard, scan using the camera (PWA), hold and resume carts, and complete checkout in seconds.",
    },
    {
        icon: IconWallet,
        title: "Multiple Payment Methods",
        desc: "Cash, bank transfers, QRIS (Midtrans), Xendit, and pay later (accounts receivable) — all in one cashier system.",
    },
    {
        icon: IconBuildingWarehouse,
        title: "Multi-Warehouse Management",
        desc: "Manage separate stock for each warehouse or branch, transfer inventory between warehouses, perform stock counts, and track batches and expiry dates using FEFO.",
    },
    {
        icon: IconReceiptTax,
        title: "VAT & Tax Management",
        desc: "Support for 11% VAT (exclusive/inclusive), customer tax identification details, and organized tax reports.",
    },
    {
        icon: IconChartBar,
        title: "Reports & Insights",
        desc: "Track sales, profit and margins, cashier performance, peak business hours, and returning customers.",
    },
    {
        icon: IconReportMoney,
        title: "Receivables & Payables",
        desc: "Manage customer receivables and supplier payables with aging analysis and partial payments.",
    },
    {
        icon: IconUsers,
        title: "CRM & Customer Loyalty",
        desc: "Manage membership tiers, loyalty points, vouchers, automated customer segmentation, and marketing campaigns.",
    },
    {
        icon: IconShieldLock,
        title: "Role-Based Access & Audit Logs",
        desc: "Control access by role (admin/cashier), manage discount approvals, and track before-and-after changes through audit logs.",
    },
    {
        icon: IconCloudOff,
        title: "Offline Mode",
        desc: "Prepared checkouts can be queued locally and synchronized when the internet connection is restored.",
    },
    {
        icon: IconQrcode,
        title: "QR Menu for Dine-In",
        desc: "Customers scan a table QR code, browse the menu, place orders, and track order status until staff process them.",
    },
    {
        icon: IconApi,
        title: "API & Integrations",
        desc: "Authenticated APIs for master data, POS operations, checkout, shifts, transactions, and offline synchronization.",
    },
];

const techStack = [
    { name: "Laravel 13", color: "bg-red-500" },
    { name: "Inertia.js 3", color: "bg-purple-500" },
    { name: "React 19", color: "bg-cyan-500" },
    { name: "Tailwind CSS", color: "bg-sky-500" },
    { name: "MySQL", color: "bg-orange-500" },
    { name: "PWA", color: "bg-emerald-500" },
];

const screenshots = [
    {
        src: "/screenshots/01-dashboard.png",
        title: "Dashboard",
        alt: "BINGOPOS dashboard showing sales, inventory, and business overview widgets",
        description: "See sales, stock, customers, and business performance at a glance.",
        span: "col-span-2 row-span-2",
    },
    {
        src: "/screenshots/02-pos-checkout.png",
        title: "Transactions / Sales",
        alt: "BINGOPOS transactions and sales screen with product cart and checkout controls",
        description: "Process sales, manage cart items, and complete payments quickly.",
    },
    {
        src: "/screenshots/06-stock-opnames.png",
        title: "Stock Opname",
        alt: "BINGOPOS stock opname screen for comparing system and physical inventory",
        description: "Count physical stock and keep inventory records accurate.",
    },
    {
        src: "/screenshots/12-receivables.png",
        title: "Receivables",
        alt: "BINGOPOS customer receivables screen with balances and aging information",
        description: "Monitor customer balances, due dates, and partial payments.",
    },
    {
        src: "/screenshots/15-sales-report.png",
        title: "Sales Report",
        alt: "BINGOPOS sales report screen with totals, payment methods, and sales trends",
        description: "Understand revenue, payment methods, and sales performance.",
    },
];

const faqs = [
    {
        q: "Is BINGOPOS really free?",
        a: "Yes. BINGOPOS is released under the MIT License, allowing you to use, modify, and distribute it freely. Hosting, hardware, payment gateway fees, and third-party services remain the user's responsibility.",
    },
    {
        q: "Can BINGOPOS support businesses with multiple branches?",
        a: "Yes. BINGOPOS supports multiple warehouses with separate inventory for each warehouse or branch, stock transfers between warehouses, and warehouse-level reports.",
    },
    {
        q: "What happens if the store loses its internet connection?",
        a: "Prepared checkouts can be placed in a local queue and synchronized automatically when the connection returns. Adding new products to the cart while offline is still limited because the cart is server-based.",
    },
    {
        q: "What is required to install BINGOPOS?",
        a: "PHP 8.3+, MySQL/MariaDB, Composer, Node.js 18+, and npm. Refer to the getting-started documentation for installation instructions.",
    },
];

export default function Welcome() {
    return (
        <PublicLayout>
            <Head title="BINGOPOS — Free & Open-Source POS System" />

            {/* ============ HERO ============ */}
            <section className="pt-28 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6 border border-primary-100 dark:border-primary-900">
                            <IconRocket size={16} />
                            Smarter operations · Built for growing businesses
                        </div>

                        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight">
                            Modern Point of Sale
                            <span className="block mt-2 bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                                Free &amp; Open Source
                            </span>
                        </h1>

                        <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            BINGOPOS is a comprehensive point-of-sale system for
                            retailers and growing businesses. It offers
                            multi-warehouse inventory, tax management, customer
                            loyalty and CRM, and offline support. Self-hosted,
                            with your data under your
                            control.
                        </p>

                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl hover:from-primary-600 hover:to-primary-700 shadow-xl shadow-primary-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                <IconDeviceMobile size={20} />
                                Open BINGOPOS
                                <IconArrowRight size={18} />
                            </Link>
                            <Link
                                href="/setup"
                                className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-primary-300 dark:hover:border-primary-700 transition-all flex items-center justify-center gap-2"
                            >
                                <IconSettings size={20} />
                                Start Setup
                            </Link>
                        </div>
                    </div>

                    {/* App Preview */}
                    <div className="mt-16 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none h-32 bottom-0 top-auto" />

                        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900">
                            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center gap-2">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                </div>

                                <div className="flex-1 text-center text-xs text-slate-500">
                                    BINGOPOS
                                </div>
                            </div>

                            <img
                                src="/media/revamp-pos.png"
                                alt="BINGOPOS application preview"
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = "/images/og-image.png";
                                }}
                                className="w-full"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ STATS ============ */}
            <section className="py-12 px-6 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <div className="text-3xl md:text-4xl font-extrabold text-primary-600 dark:text-primary-400">
                                {stat.value}
                            </div>

                            <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ SCREENSHOTS ============ */}
            <section id="screenshot" className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                            Application Screenshots
                        </h2>

                        <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            From everyday checkout operations to management
                            reports — everything in one organized, responsive
                            application.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[140px] md:auto-rows-[180px]">
                        {screenshots.map((shot) => (
                            <figure
                                key={shot.title}
                                className={`${shot.span || ""} relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 group`}
                                title={shot.description}
                            >
                                <img
                                    src={shot.src}
                                    alt={shot.alt}
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = "/images/og-image.png";
                                    }}
                                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />

                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                                    <figcaption className="text-xs font-medium text-white">
                                        {shot.title}
                                        <span className="mt-1 block text-[11px] font-normal text-white/80">
                                            {shot.description}
                                        </span>
                                    </figcaption>
                                </div>
                            </figure>
                        ))}
                    </div>

                </div>
            </section>

            {/* ============ FEATURES ============ */}
            <section
                id="fitur"
                className="py-20 px-6 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800"
            >
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                            Complete Features for Real Businesses
                        </h2>

                        <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            More than 44 integrated modules — from daily
                            transactions to advanced analytics, designed to
                            support growing business operations.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => (
                            <div
                                key={feature.title}
                                className="group p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-primary-500/5 transition-all"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <feature.icon
                                        size={24}
                                        className="text-white"
                                    />
                                </div>

                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                    {feature.title}
                                </h3>

                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link
                            href="/fitur"
                            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                        >
                            Explore All Features
                            <IconArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============ TECH STACK ============ */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                        Modern Technology Stack
                    </h2>

                    <p className="text-slate-600 dark:text-slate-400 mb-10">
                        Built with proven technologies that are fast,
                        reliable, and easy to extend.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        {techStack.map((tech) => (
                            <div
                                key={tech.name}
                                className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                            >
                                <div
                                    className={`w-3 h-3 rounded-full ${tech.color}`}
                                />

                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                    {tech.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ INSTALLATION ============ */}
            <section
                id="instalasi"
                className="py-20 px-6 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                            Start with a Clearer Workflow
                        </h2>

                        <p className="mt-4 text-slate-600 dark:text-slate-400">
                            Set up your workspace once, then manage sales,
                            inventory, customers, and reports from one
                            focused dashboard.
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            ["01", "Configure your store", "Add your store profile, warehouse, tax rules, and payment methods.", IconSettings],
                            ["02", "Organize your catalog", "Create categories, products, prices, recipes, and stock levels.", IconChartDots],
                            ["03", "Run with confidence", "Track checkout, cash flow, team activity, and performance reports.", IconRocket],
                        ].map(([step, title, description, Icon]) => (
                            <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
                                <div className="mb-5 flex items-center justify-between">
                                    <span className="text-xs font-bold tracking-[0.2em] text-primary-500">{step}</span>
                                    <Icon size={22} className="text-primary-500" />
                                </div>
                                <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ DEMO ============ */}
            <section className="py-16 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="rounded-2xl border border-primary-200 dark:border-primary-900 bg-primary-50/50 dark:bg-primary-950/30 p-8 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                            Ready to Try BINGOPOS?
                        </h2>

                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            To try the application, run the local installation
                            and complete the setup wizard. The main seeder
                            does not create a demo account or sample data.
                        </p>

                        <Link
                            href="/setup"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-2xl hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/25 transition-all"
                        >
                            Start Setup
                            <IconArrowRight size={18} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============ FAQ ============ */}
            <section
                id="faq"
                className="py-20 px-6 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800"
            >
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <details
                                key={faq.q}
                                className="group rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 open:shadow-md transition-all"
                            >
                                <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none">
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {faq.q}
                                    </span>

                                    <span className="text-primary-500 group-open:rotate-45 transition-transform text-lg">
                                        +
                                    </span>
                                </summary>

                                <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {faq.a}
                                </p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ CTA ============ */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-12 text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Manage Your Business with BINGOPOS?
                        </h2>

                        <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                                Keep your operations organized and your business data
                                under your control.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 px-8 py-4 border border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors"
                            >
                                Try the App
                                <IconArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}