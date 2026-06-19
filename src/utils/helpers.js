/**
 * Format a date string or Date object into a readable format.
 * @param {string|Date} date - The date to format
 * @param {Object} options - Intl.DateTimeFormat options override
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options) => {
  if (!date) return '—';
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options,
    });
  } catch {
    return '—';
  }
};

/**
 * Format a number as a currency amount (INR).
 * @param {number|string} amount - The amount to format
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} - Formatted amount string
 */
export const formatAmount = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined || amount === '') return '—';
  try {
    const num = Number(amount);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `₹${amount}`;
  }
};
