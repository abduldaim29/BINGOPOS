import { Head, Link } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    IconRoute,
    IconRocket,
    IconSparkles,
    IconArrowRight,
    IconBrandGithub,
    IconCheck,
    IconBulb,
} from "@tabler/icons-react";

const GITHUB_URL = "https://github.com/abduldaim29/BINGOPOS";

const releases = [
    {
        version: "v2.0",
        tag: "Major Revamp",
        date: "2025",
        items: [
            "Modern and responsive UI redesign",
            "33 documentation screenshots covering all modules",
            "Service-layer architecture foundation",
        ],
    },
    {
        version: "v2.1",
        tag: "Communication",
        date: "2025",
        items: [
            "WhatsApp Gateway using whatsapp-web.js",
            "Centralized application versioning (APP_VERSION)",
            "Low-stock and aging notifications",
        ],
    },
    {
        version: "v2.2",
        tag: "Technology Stack Upgrade",
        date: "2026",
        items: [
            "Upgrade from Laravel 12 to Laravel 13",
            "Inertia v3 + React 19",
            "Multilingual support (Indonesian and English)",
        ],
    },
    {
        version: "v2.3",
        tag: "POS Improvements",
        date: "2026",
        items: [
            "Cart handling and cashier shift improvements",
            "Warehouse-level stock fallback",
            "Complete documentation for each module",
        ],
    },
    {
        version: "v2.3.1",
        tag: "Maintenance",
        date: "August 2026",
        items: [
            "Maintenance release and refinements",
            "CI/CD pipeline (build and automatic deployment)",
            "New landing page and public website",
            "Customer portal and PDF invoice improvements",
        ],
    },
    {
        version: "v2.4.0",
        tag: "Dine-in QR",
        date: "September 2026",
        items: [
            "QR menus and customer self-ordering",
            "Floor plans for dining areas and tables",
            "Public order status and staff accept/reject workflow",
        ],
    },
    {
        version: "v2.5.0",
        tag: "Onboarding",
        date: "September 2026",
        items: [
            "First-install setup wizard",
            "Unified local development command",
        ],
    },
    {
        version: "v2.6.0",
        tag: "Guided Tour",
        date: "September 2026",
        items: ["Guided tour for onboarding new users"],
    },
    {
        version: "v2.7.0",
        tag: "Setup Checklist",
        date: "September 2026",
        items: ["Tour replay and application setup checklist"],
    },
    {
        version: "v2.8.0",
        tag: "Offline & QRIS",
        date: "September 2026",
        items: ["Offline transaction synchronization and dynamic QRIS"],
    },
    {
        version: "v2.9.0",
        tag: "Cashier Operations",
        date: "September 2026",
        items: ["Cash movements per shift, X/Z reports, and order types"],
    },
    {
        version: "v2.10.0",
        tag: "Printing",
        date: "September 2026",
        items: ["Automatic printing and ESC/POS WebUSB support"],
    },
    {
        version: "v2.10.1",
        tag: "Maintenance",
        date: "September 2026",
        items: ["Walk-in checkout and documentation fixes"],
    },
    {
        version: "v2.10.2",
        tag: "Maintenance",
        date: "September 2026",
        items: ["Guided tour and replay behavior fixes"],
    },
    {
        version: "v2.10.3",
        tag: "Maintenance",
        date: "September 2026",
        items: ["Setup wizard and first-run flow stabilization"],
    },
    {
        version: "v2.10.4",
        tag: "Current Release",
        date: "September 2026",
        items: [
            "Reuse of seeded warehouses in the setup wizard",
            "Setup wizard form submission fixes",
        ],
    },
];

const directions = [
    {
        icon: IconSparkles,
        title: "Enhanced Mobile Experience",
        desc: "Further offline improvements, including conflict handling, retry queues, observability, and broader master data support.",
    },
    {
        icon: IconBulb,
        title: "Ecosystem Integrations",
        desc: "Expansion of payment gateway and shipping carrier integrations, accounting connectors, and e-commerce integrations.",
    },
    {
        icon: IconRocket,
        title: "Developer Ecosystem",
        desc: "Expand the existing API documentation, introduce themes and plugins, and provide tools that make contributing easier.",
    },
];

export default function Roadmap() {
    return (
        <PublicLayout active="/roadmap">
            <Head title="Roadmap — BINGOPOS" />

            {/* Header */}
            <section className="pt-20 pb-14 px-6 bg-gradient-to-b from-primary-50 dark:from-primary-950/40 to-transparent">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-sm font-medium mb-5 border border-primary-100 dark:border-primary-900">
                        <IconRoute size={16} />
                        Roadmap
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                        The BINGOPOS Journey
                    </h1>
                    <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        From a simple point-of-sale system to a complete POS ecosystem —
                        continuously evolving alongside the community.
                    </p>
                </div>
            </section>

            {/* Timeline */}
            <section className="pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="relative pl-8 border-l-2 border-primary-200 dark:border-primary-900 space-y-10">
                        {releases.map((rel) => (
                            <div key={rel.version} className="relative">
                                <div className="absolute -left-[41px] top-1.5 w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 border-4 border-white dark:border-slate-950" />
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                        {rel.version}
                                    </h2>
                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900">
                                        {rel.tag}
                                    </span>
                                    <span className="text-sm text-slate-400">{rel.date}</span>
                                </div>
                                <ul className="mt-3 space-y-2">
                                    {rel.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2.5">
                                            <IconCheck size={16} className="text-emerald-500 mt-1 shrink-0" />
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {item}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Future Directions */}
            <section className="py-20 px-6 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                            What's Next?
                        </h2>
                        <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Priorities are shaped together with the community through
                            user feedback and contributor input.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {directions.map((dir) => (
                            <div
                                key={dir.title}
                                className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-4">
                                    <dir.icon size={22} className="text-white" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                                    {dir.title}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                    {dir.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Community CTA */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-10 text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            The Roadmap Is Shaped by the Community
                        </h2>
                        <p className="text-slate-400 mb-7">
                            Have a feature idea? Found a bug? Want to work on one of the
                            directions above? It all starts on GitHub.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a
                                href={`${GITHUB_URL}/issues`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all"
                            >
                                <IconBrandGithub size={18} />
                                Create an Issue or Suggest an Idea
                            </a>
                            <Link
                                href="/contribute"
                                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-300 border border-slate-600 rounded-xl hover:border-primary-400 hover:text-primary-400 transition-colors"
                            >
                                Start Contributing
                                <IconArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}