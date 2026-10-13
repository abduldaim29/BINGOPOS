import React, { useState, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import { useTranslation } from "react-i18next";
import { Toaster } from "react-hot-toast";
import { useTheme } from "@/Context/ThemeSwitcherContext";
import { useOnlineStatus } from "@/Context/OnlineStatusContext";
import {
    IconHome,
    IconHistory,
    IconSun,
    IconMoon,
    IconLogout,
    IconMenu2,
    IconX,
    IconUser,
    IconWallet,
    IconArrowsMaximize,
    IconArrowsMinimize,
    IconQuestionMark,
} from "@tabler/icons-react";
import Notification from "@/Components/Dashboard/Notification";
import LanguageSwitcher from "@/Components/Dashboard/LanguageSwitcher";
import { useTour } from "@/Hooks/useTour";
import i18n from "@/i18n";
import { getPendingCount } from "@/Utils/offlineDb";

export default function POSLayout({ children }) {
    const { t, i18n: translation } = useTranslation();
    const { auth, storeProfile, activeCashierShift, appVersion } = usePage().props;
    const { darkMode, themeSwitcher } = useTheme();
    const { start: startTour, isActive: tourActive } = useTour("pos");

    const [pendingSyncCount, setPendingSyncCount] = useState(0);
    const isOnline = useOnlineStatus();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Use the currently selected language for date and time formatting.
    // English uses en; Indonesian uses id.
    const currentLanguage = translation.language?.split("-")[0] || "en";
    const locale = currentLanguage === "id" ? "id-ID" : "en-US";

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement
                .requestFullscreen()
                .then(() => setIsFullscreen(true))
                .catch(() => {});
        } else {
            document.exitFullscreen()
                .then(() => setIsFullscreen(false))
                .catch(() => {});
        }
    };

    useEffect(() => {
        const handler = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handler);
        return () => {
            document.removeEventListener("fullscreenchange", handler);
        };
    }, []);

    // Update the displayed time every minute.
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);

        return () => clearInterval(timer);
    }, []);

    // Refresh the pending offline transaction count.
    useEffect(() => {
        const refresh = () => {
            getPendingCount()
                .then(setPendingSyncCount)
                .catch(() => {});
        };

        refresh();

        window.addEventListener("online", refresh);

        const timer = setInterval(refresh, 15000);

        return () => {
            window.removeEventListener("online", refresh);
            clearInterval(timer);
        };
    }, []);

    // Universal locale-aware time formatter.
    const formatTime = (date) => {
        return new Intl.DateTimeFormat(locale, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: currentLanguage === "en",
        }).format(date);
    };

    // Universal locale-aware date formatter.
    const formatDate = (date) => {
        return new Intl.DateTimeFormat(locale, {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(date);
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 lg:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
                {/* Left Section - Logo & Time */}
                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Mobile Menu Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        aria-label={showMobileMenu ? t("posLayout.closeMenu") : t("posLayout.openMenu")}
                        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        {showMobileMenu ? (
                            <IconX
                                size={22}
                                className="text-slate-600 dark:text-slate-400"
                            />
                        ) : (
                            <IconMenu2
                                size={22}
                                className="text-slate-600 dark:text-slate-400"
                            />
                        )}
                    </button>

                    {/* Logo */}
                    <Link
                        href={route("dashboard")}
                        className="flex items-center gap-2"
                    >
                        <div className="w-9 h-9 flex items-center justify-center overflow-hidden">
                            {storeProfile?.logo ? (
                                <img
                                    src={storeProfile.logo}
                                    alt={storeProfile?.name || t("posLayout.store")}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary-600 text-white font-bold text-sm">
                                    {(storeProfile?.name || "K").charAt(0)}
                                </div>
                            )}
                        </div>

                        <span className="hidden sm:block text-lg font-bold text-slate-800 dark:text-white">
                            {storeProfile?.name || t("posLayout.storeName")}
                        </span>
                    </Link>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

                    {/* Time & Date */}
                    <div className="hidden md:flex items-center gap-3">
                        <div className="text-2xl font-semibold text-slate-800 dark:text-white tabular-nums">
                            {formatTime(currentTime)}
                        </div>

                        <div className="text-sm text-slate-500 dark:text-slate-400">
                            {formatDate(currentTime)}
                        </div>
                    </div>
                </div>

                {/* Right Section - Actions & User */}
                <div className="flex items-center gap-2 lg:gap-3">
                    {/* Quick Actions */}
                    <nav className="hidden lg:flex items-center gap-1">
                        <Link
                            href={route("dashboard")}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                        >
                            <IconHome size={18} />
                            <span>{t("posLayout.dashboard")}</span>
                        </Link>

                        <Link
                            href={route("transactions.history")}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                        >
                            <IconHistory size={18} />
                            <span>{t("posLayout.history")}</span>
                        </Link>
                    </nav>

                    {/* Divider */}
                    <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-700" />

                    {/* Notifications - Desktop */}
                    <div className="hidden md:flex">
                        <Notification />
                    </div>

                    {/* Version */}
                    <span className="hidden lg:block text-[11px] text-slate-400 dark:text-slate-600 font-mono">
                        {appVersion}
                    </span>

                    {/* Tour Guide */}
                    <button
                        type="button"
                        onClick={startTour}
                        disabled={tourActive}
                        className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-touch min-h-touch flex items-center justify-center disabled:opacity-50"
                        title={t("tour.button")}
                        aria-label={t("tour.button")}
                    >
                        <IconQuestionMark size={20} className="text-slate-500" />
                    </button>

                    {/* Fullscreen Toggle */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-touch min-h-touch flex items-center justify-center"
                        title={
                            isFullscreen
                                ? t("posLayout.exitFullscreen")
                                : t("posLayout.fullscreen")
                        }
                        aria-label={
                            isFullscreen
                                ? t("posLayout.exitFullscreen")
                                : t("posLayout.fullscreen")
                        }
                    >
                        {isFullscreen ? (
                            <IconArrowsMinimize size={20} className="text-slate-500" />
                        ) : (
                            <IconArrowsMaximize size={20} className="text-slate-500" />
                        )}
                    </button>

                    {/* Theme Toggle */}
                    <button
                        type="button"
                        onClick={themeSwitcher}
                        className="p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-w-touch min-h-touch flex items-center justify-center"
                        title={
                            darkMode
                                ? t("posLayout.lightMode")
                                : t("posLayout.darkMode")
                        }
                        aria-label={
                            darkMode
                                ? t("posLayout.lightMode")
                                : t("posLayout.darkMode")
                        }
                    >
                        {darkMode ? (
                            <IconSun size={20} className="text-amber-500" />
                        ) : (
                            <IconMoon size={20} className="text-slate-500" />
                        )}
                    </button>

                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Notifications - Mobile */}
                    <div className="flex md:hidden">
                        <Notification />
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-2 pl-2 lg:pl-3 border-l border-slate-200 dark:border-slate-700">
                        {activeCashierShift && (
                            <Link
                                href={route("cashier-shifts.show", activeCashierShift.id)}
                                className="hidden lg:flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60"
                            >
                                <IconWallet size={16} />
                                <span>
                                    {t("posLayout.activeShift")} •{" "}
                                    {new Intl.NumberFormat(locale).format(
                                        activeCashierShift.expected_cash || 0
                                    )}
                                </span>
                            </Link>
                        )}

                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {auth.user.name}
                        </p>
                    </div>

                    {/* Logout */}
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="hidden lg:flex p-2.5 rounded-lg text-slate-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/50 transition-colors min-w-touch min-h-touch items-center justify-center"
                        title={t("posLayout.logout")}
                        aria-label={t("posLayout.logout")}
                    >
                        <IconLogout size={20} />
                    </Link>
                </div>
            </header>

            {/* Offline Notice */}
            {!isOnline && (
                <div className="bg-amber-500 text-white text-center text-xs font-medium py-1 px-4">
                    {t("posLayout.offlineNotice")}
                </div>
            )}

            {/* Pending Sync Notice */}
            {isOnline && pendingSyncCount > 0 && (
                <div className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-center text-xs font-medium py-1 px-4">
                    {pendingSyncCount} {t("posLayout.pendingSync")}
                </div>
            )}

            {/* Mobile Menu Overlay */}
            {showMobileMenu && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50"
                    onClick={() => setShowMobileMenu(false)}
                >
                    <div
                        className="absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-lg animate-slide-up"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <nav className="p-4 space-y-2">
                            <Link
                                href={route("dashboard")}
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                <IconHome size={20} />
                                <span className="font-medium">
                                    {t("posLayout.dashboard")}
                                </span>
                            </Link>

                            <Link
                                href={route("transactions.history")}
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                <IconHistory size={20} />
                                <span className="font-medium">
                                    {t("posLayout.history")}
                                </span>
                            </Link>

                            <Link
                                href={route("profile.edit")}
                                onClick={() => setShowMobileMenu(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                            >
                                <IconUser size={20} />
                                <span className="font-medium">
                                    {t("posLayout.profile")}
                                </span>
                            </Link>

                            <hr className="border-slate-200 dark:border-slate-700" />

                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/50 transition-colors w-full"
                            >
                                <IconLogout size={20} />
                                <span className="font-medium">
                                    {t("posLayout.logout")}
                                </span>
                            </Link>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                <Toaster
                    position="top-right"
                    toastOptions={{
                        className: "text-sm",
                        duration: 3000,
                        style: {
                            background: darkMode ? "#1e293b" : "#fff",
                            color: darkMode ? "#f1f5f9" : "#1e293b",
                            border: `1px solid ${
                                darkMode ? "#334155" : "#e2e8f0"
                            }`,
                        },
                    }}
                />

                {children}
            </main>
        </div>
    );
}
