import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import id from './locales/id.json';

const resources = {
    en: { translation: en },
    id: { translation: id },
};

// Get initial locale from localStorage first, then fallback to 'en'
const getInitialLocale = () => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('locale');
        if (stored && (stored === 'en' || stored === 'id')) {
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
        supportedLngs: ['en', 'id'],
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
    });

// Sync with backend locale when Inertia page loads
if (typeof window !== 'undefined') {
    // Initial sync on page load
    const syncLocaleFromBackend = () => {
        const backendLocale = window.page?.props?.locale?.current;
        if (backendLocale && backendLocale !== i18n.language) {
            i18n.changeLanguage(backendLocale);
            localStorage.setItem('locale', backendLocale);
        }
    };

    // Sync immediately if page props are available
    if (window.page?.props?.locale?.current) {
        syncLocaleFromBackend();
    }

    // Listen for Inertia page visits to sync locale
    document.addEventListener('inertia:finish', syncLocaleFromBackend);
}

export default i18n;

export const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'id', name: 'Indonesia', nativeName: 'Indonesia' },
];
