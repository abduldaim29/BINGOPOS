import React from "react";
import { Head, Link } from "@inertiajs/react";
import {
    IconAlertTriangle,
    IconArrowLeft,
    IconHome2,
    IconLock,
    IconRefresh,
    IconServerOff,
} from "@tabler/icons-react";
import { useTheme } from "@/Context/ThemeSwitcherContext";

const errorContent = {
    401: {
        title: "Authentication Required",
        description:
            "Your session or access credentials are invalid. Please sign in again to continue.",
        icon: IconLock,
    },
    403: {
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        icon: IconLock,
    },
    404: {
        title: "Page Not Found",
        description:
            "The page you are looking for is unavailable, has been moved, or the URL you entered is incorrect.",
        icon: IconAlertTriangle,
    },
    419: {
        title: "Session Expired",
        description:
            "Your security session has expired. Refresh the page and try again.",
        icon: IconRefresh,
    },
    429: {
        title: "Too Many Requests",
        description:
            "Your requests have been temporarily rate-limited. Please wait a moment before trying again.",
        icon: IconAlertTriangle,
    },
    500: {
        title: "Internal Server Error",
        description:
            "Something went wrong on the server. Please try again in a few moments.",
        icon: IconServerOff,
    },
    503: {
        title: "Service Temporarily Unavailable",
        description:
            "The application is undergoing maintenance or is not yet ready to handle your request.",
        icon: IconServerOff,
    },
};

export default function Error({ status, homeUrl, homeLabel }) {
    const { darkMode, themeSwitcher } = useTheme();
    const content = errorContent[status] ?? errorContent[500];
    const Icon = content.icon;

    return (
        <>
            <Head title={`${status} - ${content.title}`} />

            <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-50">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.14),transparent_35%)] dark:bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.24),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(6,182,212,0.16),transparent_35%)]" />

                <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6">
                    <div className="flex items-center justify-between">
                        <Link href={homeUrl} className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/25">
                                <IconHome2 size={22} className="text-white" />
                            </div>

                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    BINGOPOS
                                </p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                    Error {status}
                                </p>
                            </div>
                        </Link>

                        <button
                            type="button"
                            onClick={themeSwitcher}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 backdrop-blur transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:border-primary-700 dark:hover:text-primary-400"
                        >
                            <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                            {darkMode ? "Light Mode" : "Dark Mode"}
                        </button>
                    </div>

                    <div className="flex flex-1 items-center justify-center py-10">
                        <div className="w-full max-w-4xl rounded-[2rem] border border-slate-200/80 bg-white/85 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/85 dark:shadow-black/20 md:p-12">
                            <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
                                        <Icon size={18} />
                                        Status {status}
                                    </div>

                                    <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 dark:text-white md:text-5xl">
                                        {content.title}
                                    </h1>

                                    <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400 md:text-lg">
                                        {content.description}
                                    </p>

                                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                        <Link
                                            href={homeUrl}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-600 hover:to-primary-700"
                                        >
                                            <IconHome2 size={18} />
                                            {homeLabel}
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => window.history.back()}
                                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-primary-700 dark:hover:text-primary-400"
                                        >
                                            <IconArrowLeft size={18} />
                                            Go Back
                                        </button>
                                    </div>
                                </div>

                                <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-100 via-white to-primary-50 p-8 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-primary-950/40">
                                    <div className="absolute right-6 top-6 rounded-full border border-primary-200/60 bg-white/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-primary-600 dark:border-primary-800 dark:bg-slate-900/80 dark:text-primary-400">
                                        Error State
                                    </div>

                                    <div className="flex min-h-[260px] flex-col justify-between">
                                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-xl shadow-primary-500/25">
                                            <Icon size={42} strokeWidth={1.5} />
                                        </div>

                                        <div>
                                            <div className="text-7xl font-black leading-none text-slate-200 dark:text-slate-800">
                                                {status}
                                            </div>

                                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
                                                Check the URL, access permissions,
                                                or service status before trying
                                                again.
                                            </div>
                                        </div>
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