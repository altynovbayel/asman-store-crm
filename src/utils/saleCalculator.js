/**
 * Calculates the subtotal of the cart items.
 * @param {Array} cartItems 
 * @returns {number}
 */
export const calculateSubtotal = (cartItems) => {
  if (!cartItems || !Array.isArray(cartItems)) return 0;
  return cartItems.reduce((sum, item) => sum + (item.total !== undefined ? item.total : (item.quantity * item.price)), 0);
};

/**
 * Validates and calculates the discount value.
 * @param {string|number} discountInput 
 * @param {number} subtotal 
 * @returns {number}
 */
export const calculateDiscount = (discountInput, subtotal) => {
  const discountVal = parseFloat(discountInput) || 0;
  if (discountVal < 0) return 0;
  if (discountVal > subtotal) return subtotal;
  return discountVal;
};

/**
 * Calculates the grand total after discount.
 * @param {number} subtotal 
 * @param {string|number} discountInput 
 * @returns {number}
 */
export const calculateGrandTotal = (subtotal, discountInput) => {
  const discountVal = parseFloat(discountInput) || 0;
  if (discountVal < 0 || discountVal > subtotal) {
    return subtotal;
  }
  return Math.max(0, subtotal - discountVal);
};

/**
 * Calculates the complete sales summary.
 * @param {Array} cartItems 
 * @param {string|number} discountInput 
 * @returns {Object}
 */
export const calculateSaleSummary = (cartItems, discountInput) => {
  const subtotal = calculateSubtotal(cartItems);
  const discountVal = parseFloat(discountInput) || 0;
  const discountValue = calculateDiscount(discountInput, subtotal);
  const grandTotal = calculateGrandTotal(subtotal, discountInput);

  let discountError = '';
  if (discountVal < 0) {
    discountError = 'Скидка не может быть меньше 0';
  } else if (discountVal > subtotal) {
    discountError = 'Скидка не может превышать сумму товаров';
  }

  return {
    subtotal,
    discount: discountValue,
    grandTotal,
    discountError
  };
};
