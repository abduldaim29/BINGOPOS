import { Head } from "@inertiajs/react";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    IconHeart,
    IconGitBranch,
    IconTestPipe,
    IconListCheck,
    IconTerminal2,
    IconArrowRight,
    IconBrandGithub,
    IconShieldCheck,
} from "@tabler/icons-react";

const GITHUB_URL = "https://github.com/abduldaim29/BINGOPOS";

const setupCommands = `git clone https://github.com/abduldaim29/BINGOPOS
cd BINGOPOS
cp .env.example .env
composer install && npm install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link

# Run in 2 terminals
npm run dev
npm run build
php artisan serve`;

const checklist = [
    "Run php artisan test — ensure all tests pass",
    "Run vendor/bin/pint to format the code",
    "Write a clear PR description (what & why)",
    "Reference the issue being addressed (fixes #123)",
    "Include before/after screenshots for UI changes",
];

export default function Contributing() {
    return (
        <PublicLayout active="/kontribusi">
            <Head title="Contributing — Dikasir" />

            {/* Header */}
            <section className="pt-20 pb-14 px-6 bg-gradient-to-b from-primary-50 dark:from-primary-950/40 to-transparent">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 text-sm font-medium mb-5 border border-primary-100 dark:border-primary-900">
                        <IconHeart size={16} />
                        Contributing
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white">
                        Help Dikasir Grow
                    </h1>

                    <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                        Open source thrives on contributions — bug reports, code improvements,
                        documentation, or simply ideas. Everyone is welcome!
                    </p>
                </div>
            </section>

            {/* Git Flow */}
            <section className="pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <IconGitBranch size={24} className="text-primary-500" />
                        Git Workflow
                    </h2>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800/60 text-left">
                                    <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                        Branch
                                    </th>
                                    <th className="px-5 py-3 font-semibold text-slate-700 dark:text-slate-300">
                                        Purpose
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                <tr>
                                    <td className="px-5 py-3 font-mono text-primary-600 dark:text-primary-400">
                                        main
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                        Production. Merges only from releases
                                    </td>
                                </tr>

                                <tr>
                                    <td className="px-5 py-3 font-mono text-primary-600 dark:text-primary-400">
                                        development
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                        Integration. All feature branches merge here
                                    </td>
                                </tr>

                                <tr>
                                    <td className="px-5 py-3 font-mono text-primary-600 dark:text-primary-400">
                                        feature/*
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                        New feature development. Branch from development, PR to development
                                    </td>
                                </tr>

                                <tr>
                                    <td className="px-5 py-3 font-mono text-primary-600 dark:text-primary-400">
                                        fix/*
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                        Hotfix. Branch from main, PR to main + development
                                    </td>
                                </tr>

                                <tr>
                                    <td className="px-5 py-3 font-mono text-primary-600 dark:text-primary-400">
                                        release/*
                                    </td>
                                    <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                                        Release candidate. From development, merge to main + tag
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 rounded-xl bg-slate-100 dark:bg-slate-800/60 px-5 py-4 text-sm font-mono text-slate-600 dark:text-slate-300 text-center">
                        feature/feature-name → development → release/x.y.z → main (tag vX.Y.Z)
                    </div>
                </div>
            </section>

            {/* Development Setup */}
            <section className="pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <IconTerminal2 size={24} className="text-primary-500" />
                        Development Environment Setup
                    </h2>

                    <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 overflow-hidden">
                        <pre className="text-sm text-slate-300 font-mono overflow-x-auto leading-relaxed">
                            {setupCommands}
                        </pre>
                    </div>

                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                        Sample data (products, transactions, users) is included via{" "}
                        <code className="font-mono text-primary-600 dark:text-primary-400">
                            migrate --seed
                        </code>.
                        Default accounts:{" "}
                        <code className="font-mono">arya@gmail.com</code> (admin) and{" "}
                        <code className="font-mono">cashier@gmail.com</code> (cashier), password:{" "}
                        <code className="font-mono">password</code>.
                    </p>
                </div>
            </section>

            {/* Testing */}
            <section className="pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <IconTestPipe size={24} className="text-primary-500" />
                        Testing
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="font-mono text-sm text-primary-600 dark:text-primary-400 mb-1">
                                php artisan test
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Automated tests run using in-memory SQLite — no MySQL required
                                for testing.
                            </p>
                        </div>

                        <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="font-mono text-sm text-primary-600 dark:text-primary-400 mb-1">
                                vendor/bin/pint
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Automatically formats PHP code according to Laravel standards.
                            </p>
                        </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                        💡 When writing product tests, set{" "}
                        <code className="font-mono">tax_rate=0</code> to
                        prevent the grand_total from changing due to sales tax.
                    </p>
                </div>
            </section>

            {/* PR Checklist */}
            <section className="pb-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                        <IconListCheck size={24} className="text-primary-500" />
                        Pull Request Checklist
                    </h2>

                    <ul className="space-y-3">
                        {checklist.map((item) => (
                            <li
                                key={item}
                                className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                            >
                                <IconShieldCheck
                                    size={20}
                                    className="text-emerald-500 mt-0.5 shrink-0"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300">
                                    {item}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* CTA */}
            <section className="pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-10 text-center text-white">
                        <h2 className="text-2xl md:text-3xl font-bold mb-3">
                            Ready to Contribute?
                        </h2>

                        <p className="opacity-90 mb-7">
                            Start with an issue labeled "good first issue" — or read the
                            complete guide in CONTRIBUTING.md.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a
                                href={`${GITHUB_URL}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Find Good First Issues
                            </a>

                            <a
                                href={`${GITHUB_URL}/blob/main/CONTRIBUTING.md`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 border border-white/40 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                            >
                                <IconBrandGithub size={18} />
                                Read CONTRIBUTING.md
                                <IconArrowRight size={16} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}