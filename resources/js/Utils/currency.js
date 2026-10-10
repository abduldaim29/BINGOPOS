import { usePage } from '@inertiajs/react';

// Default currency settings (fallback)
const DEFAULT_CURRENCY_SETTINGS = {
    code: 'PKR',
    symbol: 'Rs',
    locale: 'en-PK',
    decimalPlaces: 2,
};

/**
 * Format a number as currency based on the app's currency settings
 * @param {number} amount - The amount to format
 * @param {Object} currencySettings - Optional currency settings object
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount = 0, currencySettings = null) {
    const settings = currencySettings || DEFAULT_CURRENCY_SETTINGS;
    const { code, locale, decimalPlaces } = settings;

    return Number(amount || 0).toLocaleString(locale, {
        style: 'currency',
        currency: code,
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    });
}

/**
 * Format a number as currency without the currency symbol
 * @param {number} amount - The amount to format
 * @param {Object} currencySettings - Optional currency settings object
 * @returns {string} - Formatted number string
 */
export function formatNumber(amount = 0, currencySettings = null) {
    const settings = currencySettings || DEFAULT_CURRENCY_SETTINGS;
    const { locale, decimalPlaces } = settings;

    return Number(amount || 0).toLocaleString(locale, {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
    });
}

/**
 * Get the currency symbol
 * @param {Object} currencySettings - Optional currency settings object
 * @returns {string} - Currency symbol
 */
export function getCurrencySymbol(currencySettings = null) {
    const settings = currencySettings || DEFAULT_CURRENCY_SETTINGS;
    return settings.symbol;
}

/**
 * Format amount with currency symbol prefix (e.g., Rs 1,000.00)
 * @param {number} amount - The amount to format
 * @param {Object} currencySettings - Optional currency settings object
 * @returns {string} - Formatted currency string with symbol
 */
export function formatWithSymbol(amount = 0, currencySettings = null) {
    const symbol = getCurrencySymbol(currencySettings);
    const formattedNumber = formatNumber(amount, currencySettings);
    return `${symbol} ${formattedNumber}`;
}

/**
 * React hook to get currency settings from page props
 * Use this inside React components to get dynamic settings
 * @returns {Object} - Currency settings
 */
export function useCurrencySettings() {
    const page = usePage();
    return page.props.currencySettings || DEFAULT_CURRENCY_SETTINGS;
}
