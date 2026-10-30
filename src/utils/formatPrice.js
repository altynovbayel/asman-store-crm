/**
 * Formats a numeric price to a localized string.
 * @param {number|string} price - The price value to format
 * @returns {string} The formatted price
 */
export const formatPrice = (price) => {
  // Only numbers and strings are parsed: objects/symbols from malformed documents
  // would make parseFloat throw
  if (typeof price !== 'number' && typeof price !== 'string') {
    return '0';
  }
  const parsed = parseFloat(price);
  if (isNaN(parsed)) {
    return '0';
  }
  return parsed.toLocaleString('ru-RU');
};

export default formatPrice;
