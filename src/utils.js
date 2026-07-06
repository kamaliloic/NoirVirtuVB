/**
 * Formats a price value dynamically based on the store's currency settings.
 * For RWF, it formats as an integer with thousand separators: e.g. "Rwf 95,000"
 * For other currencies (like USD), it defaults to standard decimal styling: e.g. "$95.00"
 * 
 * @param {number} amount - The numeric price amount
 * @param {string} currency - The currency code (e.g. "Rwf", "USD")
 * @returns {string} The formatted price label
 */
export const formatPrice = (amount, currency = 'Rwf') => {
  const cur = (currency || 'Rwf').toUpperCase();
  const numericAmount = Number(amount) || 0;
  
  if (cur === 'RWF') {
    return `Rwf ${Math.round(numericAmount).toLocaleString('en-US')}`;
  }
  
  // Default to USD decimal style
  const symbol = cur === 'USD' ? '$' : `${currency} `;
  return `${symbol}${numericAmount.toFixed(2)}`;
};
