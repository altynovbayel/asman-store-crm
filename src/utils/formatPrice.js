/**
 * Formats a numeric price to a localized string.
 * @param {number|string} price - The price value to format
 * @returns {string} The formatted price
 */
export const formatPrice = (price) => {
  const parsed = parseFloat(price);
  if (isNaN(parsed)) {
    return '0';
  }
  return parsed.toLocaleString('ru-RU');
};

export default formatPrice;
