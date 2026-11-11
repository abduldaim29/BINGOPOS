import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import id from './locales/id.json';

const resources = {
    en: { translation: en },
    id: { translation: id },
};

const getInitialLocale = () => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('locale');
        if (stored && ['en', 'id'].includes(stored)) {
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

// Sync with the backend locale when an Inertia page loads
if (typeof window !== 'undefined') {
    // Initial sync on page load
    const syncLocaleFromBackend = () => {
        const backendLocale = window.page?.props?.locale?.current;
        const storedLocale = localStorage.getItem('locale');
        const targetLocale = ['en', 'id'].includes(storedLocale)
            ? storedLocale
            : (['en', 'id'].includes(backendLocale) ? backendLocale : 'en');
        if (targetLocale !== i18n.language) {
            i18n.changeLanguage(targetLocale);
        }
        localStorage.setItem('locale', targetLocale);
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
            if (['en', 'id'].includes(e.newValue)) {
                i18n.changeLanguage(e.newValue);
            }
        }
    });
}

export default i18n;

export const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'id', name: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia' },
];