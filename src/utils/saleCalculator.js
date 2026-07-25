/**
 * Validates and calculates individual item discount.
 * Discount cannot be negative and cannot exceed the item unit price.
 * @param {number} unitPrice 
 * @param {string|number} itemDiscountInput 
 * @returns {number}
 */
export const calculateItemDiscount = (unitPrice, itemDiscountInput) => {
  const price = parseFloat(unitPrice) || 0;
  const discountVal = parseFloat(itemDiscountInput) || 0;
  if (discountVal < 0) return 0;
  if (discountVal > price) return price;
  return discountVal;
};

/**
 * Calculates individual item total based on unit price, discount, and quantity.
 * @param {number} unitPrice 
 * @param {string|number} itemDiscountInput 
 * @param {number} quantity 
 * @returns {number}
 */
export const calculateItemTotal = (unitPrice, itemDiscountInput, quantity) => {
  const price = parseFloat(unitPrice) || 0;
  const qty = parseInt(quantity, 10) || 0;
  const discount = calculateItemDiscount(price, itemDiscountInput);
  return Math.max(0, (price - discount) * qty);
};

/**
 * Calculates the subtotal of the cart items (sum of unitPrice * quantity).
 * Supports fallback to old item price structure to prevent breaking existing sales.
 * @param {Array} cartItems 
 * @returns {number}
 */
export const calculateSubtotal = (cartItems) => {
  if (!cartItems || !Array.isArray(cartItems)) return 0;
  return cartItems.reduce((sum, item) => {
    const price = item.unitPrice !== undefined ? item.unitPrice : (item.price || 0);
    const qty = item.quantity || 0;
    return sum + (price * qty);
  }, 0);
};

/**
 * Calculates the total discount of the cart items (sum of itemDiscount * quantity).
 * @param {Array} cartItems 
 * @returns {number}
 */
export const calculateTotalDiscount = (cartItems) => {
  if (!cartItems || !Array.isArray(cartItems)) return 0;
  return cartItems.reduce((sum, item) => {
    const discount = item.itemDiscount !== undefined ? item.itemDiscount : 0;
    const qty = item.quantity || 0;
    return sum + (discount * qty);
  }, 0);
};

/**
 * Calculates the grand total after total discount.
 * @param {number} subtotal 
 * @param {number} totalDiscount 
 * @returns {number}
 */
export const calculateGrandTotal = (subtotal, totalDiscount) => {
  return Math.max(0, subtotal - totalDiscount);
};

/**
 * Calculates the complete sales summary.
 * @param {Array} cartItems 
 * @returns {Object}
 */
export const calculateSaleSummary = (cartItems) => {
  const subtotal = calculateSubtotal(cartItems);
  const totalDiscount = calculateTotalDiscount(cartItems);
  const grandTotal = calculateGrandTotal(subtotal, totalDiscount);

  return {
    subtotal,
    totalDiscount,
    grandTotal
  };
};
