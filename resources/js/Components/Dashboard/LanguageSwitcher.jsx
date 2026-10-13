import React, { useEffect, useState } from "react";
import { usePage } from "@inertiajs/react";
import { IconLanguage } from "@tabler/icons-react";
import { Menu, Transition } from "@headlessui/react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export default function LanguageSwitcher() {
    const { t } = useTranslation();
    const { locale } = usePage().props;
    const [currentLocale, setCurrentLocale] = useState(i18n.language);

    // Sync i18n with backend locale on mount and when locale changes
    useEffect(() => {
        if (locale?.current && locale.current !== i18n.language) {
            // Only accept English locale, default to English otherwise
            const targetLocale = locale.current === 'en' ? 'en' : 'en';
            i18n.changeLanguage(targetLocale);
            localStorage.setItem('locale', targetLocale);
            setCurrentLocale(targetLocale);
        }
    }, [locale?.current]);

    // Listen for storage changes
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'locale' && e.newValue && e.newValue !== i18n.language) {
                i18n.changeLanguage(e.newValue);
                setCurrentLocale(e.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleChange = (newLocale) => {
        // Only allow English locale
        if (newLocale !== 'en') {
            return;
        }

        console.log('Changing language to:', newLocale);

        // Save to localStorage
        localStorage.setItem('locale', newLocale);

        // Change frontend language immediately
        i18n.changeLanguage(newLocale);
        setCurrentLocale(newLocale);

        // Reload page to ensure all components re-render with new language
        window.location.reload();
    };

    const languages = [
        { code: "en", name: "English", flag: "🇬🇧" },
    ];

    const currentLang = languages.find((l) => l.code === currentLocale) || languages[0];

    // If there's only one language, don't show the switcher
    if (languages.length <= 1) {
        return null;
    }

    return (
        <Menu as="div" className="relative">
            <Menu.Button
                className="flex items-center gap-2 p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                title={t("language.switch")}
            >
                <IconLanguage size={20} strokeWidth={1.5} />
                <span className="hidden lg:inline text-sm font-medium">{currentLang.code.toUpperCase()}</span>
            </Menu.Button>

            <Transition
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
            >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 focus:outline-none overflow-hidden">
                    <div className="p-1">
                        <div className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("language.select")}
                        </div>
                        {languages.map((lang) => (
                            <Menu.Item key={lang.code}>
                                {({ active }) => (
                                    <button
                                        onClick={() => handleChange(lang.code)}
                                        className={`${
                                            active ? "bg-slate-100 dark:bg-slate-700" : ""
                                        } ${
                                            currentLocale === lang.code
                                                ? "bg-primary-50 dark:bg-primary-900/20"
                                                : ""
                                        } flex w-full items-center gap-3 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 rounded-lg transition-colors`}
                                    >
                                        <span className="text-lg">{lang.flag}</span>
                                        <span className="flex-1 text-left">{lang.name}</span>
                                        {currentLocale === lang.code && (
                                            <svg
                                                className="w-4 h-4 text-primary-600"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </div>
                </Menu.Items>
            </Transition>
        </Menu>
    );
}
