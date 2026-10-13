import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';

const resources = {
    en: { translation: en },
};

// Get the initial locale from localStorage first, then fall back to 'en'
const getInitialLocale = () => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('locale');
        if (stored && stored === 'en') {
            return stored;
        }
    }
    return 'en';
};

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: getInitialLocale(),
        fallbackLng: 'en',
        supportedLngs: ['en'],
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

// Sync with the backend locale when an Inertia page loads
if (typeof window !== 'undefined') {
    // Initial sync on page load
    const syncLocaleFromBackend = () => {
        const backendLocale = window.page?.props?.locale?.current;
        if (backendLocale && backendLocale !== i18n.language) {
            // Only sync if backend locale is English, otherwise default to English
            if (backendLocale === 'en') {
                i18n.changeLanguage(backendLocale);
                localStorage.setItem('locale', backendLocale);
            } else {
                i18n.changeLanguage('en');
                localStorage.setItem('locale', 'en');
            }
        }
    };

    // Sync immediately if page props are available
    if (window.page?.props?.locale?.current) {
        syncLocaleFromBackend();
    }

    // Listen for Inertia page visits to sync the locale
    document.addEventListener('inertia:finish', syncLocaleFromBackend);

    // Listen for storage changes (for the language switcher)
    window.addEventListener('storage', (e) => {
        if (e.key === 'locale' && e.newValue && e.newValue !== i18n.language) {
            if (e.newValue === 'en') {
                i18n.changeLanguage(e.newValue);
            }
        }
    });
}

export default i18n;

export const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
];