/**
 * Formats a number as VND currency
 * @param {number} amount
 * @returns {string} formatted currency string
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '0 ₫';
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
};

/**
 * Formats a date string or Date object to DD/MM/YYYY
 * @param {string|Date} dateString
 * @returns {string} formatted date string
 */
export const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Invalid date
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        return dateString;
    }
};

/**
 * Returns a YYYY-MM-DD string adjusted to local timezone (to avoid UTC offset issues)
 * @param {Date} date - Optional Date object, defaults to today
 * @returns {string} Formatted YYYY-MM-DD string
 */
export const getLocalDateString = (date = new Date()) => {
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
};
