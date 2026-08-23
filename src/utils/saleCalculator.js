import { PRODUCT_TYPES } from '../constants/productTypes';
import { PAYMENT_METHODS } from '../constants/paymentMethods';

/**
 * Returns installment discount percentage based on payment method and term.
 * @param {string} paymentMethod
 * @param {number|string} installmentTerm
 * @returns {number}
 */
export const getInstallmentDiscountPercent = (paymentMethod, installmentTerm) => {
  const term = Number(installmentTerm);
  if (paymentMethod === PAYMENT_METHODS.M_PLUS) {
    if (term === 3) return 5;
    if (term === 6) return 10;
  }
  if (paymentMethod === PAYMENT_METHODS.ZERO) {
    if (term === 3) return 5;
    if (term === 6) return 10;
    if (term === 12) return 15;
  }
  return 0;
};

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
 * Calculates all discounts and final prices for a single item.
 * @param {Object} item 
 * @param {string} paymentMethod 
 * @param {number|string} installmentTerm 
 * @param {boolean} kitIncluded 
 * @returns {Object}
 */
export const calculateItemDiscountsAndTotals = (item, paymentMethod = null, installmentTerm = null, kitIncluded = false) => {
  const unitPrice = parseFloat(item.unitPrice !== undefined ? item.unitPrice : (item.price || 0)) || 0;
  const qty = parseInt(item.quantity, 10) || 0;
  
  // 1. Individual manual discount
  const rawIndivDisc = item.itemDiscount !== undefined ? item.itemDiscount : item.discount;
  const itemDiscount = calculateItemDiscount(unitPrice, rawIndivDisc);

  // 2. Installment discount (applies ONLY to laptops)
  const installmentPercent = getInstallmentDiscountPercent(paymentMethod, installmentTerm);
  const isLaptop = item.productType === PRODUCT_TYPES.LAPTOP;
  const installmentDiscount = isLaptop ? (unitPrice * (installmentPercent / 100)) : 0;

  // 3. Kit discount (applies ONLY to accessories when kit is included)
  const isAccessory = item.productType === PRODUCT_TYPES.ACCESSORY;
  const remainingPriceAfterIndivAndInst = Math.max(0, unitPrice - itemDiscount - installmentDiscount);
  const kitDiscount = (kitIncluded && isAccessory) ? remainingPriceAfterIndivAndInst : 0;

  // Total discount per unit (capped at unitPrice)
  const totalDiscountPerUnit = Math.min(unitPrice, itemDiscount + installmentDiscount + kitDiscount);
  const finalUnitPrice = Math.max(0, unitPrice - totalDiscountPerUnit);
  const total = finalUnitPrice * qty;

  return {
    unitPrice,
    itemDiscount,
    installmentDiscount,
    kitDiscount,
    totalDiscountPerUnit,
    finalUnitPrice,
    total
  };
};

/**
 * Calculates individual item total based on unit price, discount, and quantity.
 * Maintained for backward compatibility.
 */
export const calculateItemTotal = (unitPrice, itemDiscountInput, quantity, paymentMethod = null, installmentTerm = null, kitIncluded = false, productType = null) => {
  const item = { unitPrice, itemDiscount: itemDiscountInput, quantity, productType };
  const res = calculateItemDiscountsAndTotals(item, paymentMethod, installmentTerm, kitIncluded);
  return res.total;
};

/**
 * Calculates the subtotal of the cart items (sum of unitPrice * quantity).
 * Supports fallback to old item price structure to prevent breaking existing sales.
 * @param {Array} cartItems 
 * @returns {number}
 */
export const calculateSubtotal = (cartItems = []) => {
  if (!cartItems || !Array.isArray(cartItems)) return 0;
  return cartItems.reduce((sum, item) => {
    const price = item.unitPrice !== undefined ? item.unitPrice : (item.price || 0);
    const qty = item.quantity || 0;
    return sum + (price * qty);
  }, 0);
};

/**
 * Calculates the total discount of the cart items (sum of total discount * quantity).
 * @param {Array} cartItems 
 * @param {string} paymentMethod
 * @param {number|string} installmentTerm
 * @param {boolean} kitIncluded
 * @returns {number}
 */
export const calculateTotalDiscount = (cartItems = [], paymentMethod = null, installmentTerm = null, kitIncluded = false) => {
  if (!cartItems || !Array.isArray(cartItems)) return 0;
  return cartItems.reduce((sum, item) => {
    const res = calculateItemDiscountsAndTotals(item, paymentMethod, installmentTerm, kitIncluded);
    const qty = item.quantity || 0;
    return sum + (res.totalDiscountPerUnit * qty);
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
 * Calculates the complete sales summary with processed items and discount breakdown.
 * @param {Array} cartItems 
 * @param {string} paymentMethod
 * @param {number|string} installmentTerm
 * @param {boolean} kitIncluded
 * @returns {Object}
 */
export const calculateSaleSummary = (cartItems = [], paymentMethod = null, installmentTerm = null, kitIncluded = false) => {
  let subtotal = 0;
  let totalDiscount = 0;
  let installmentDiscountTotal = 0;
  let kitDiscountTotal = 0;
  let individualDiscountTotal = 0;

  const processedItems = (cartItems || []).map((item) => {
    const calc = calculateItemDiscountsAndTotals(item, paymentMethod, installmentTerm, kitIncluded);
    const qty = parseInt(item.quantity, 10) || 0;

    subtotal += calc.unitPrice * qty;
    totalDiscount += calc.totalDiscountPerUnit * qty;
    installmentDiscountTotal += calc.installmentDiscount * qty;
    kitDiscountTotal += calc.kitDiscount * qty;
    individualDiscountTotal += calc.itemDiscount * qty;

    return {
      ...item,
      unitPrice: calc.unitPrice,
      itemDiscount: calc.itemDiscount,
      installmentDiscount: calc.installmentDiscount,
      kitDiscount: calc.kitDiscount,
      finalUnitPrice: calc.finalUnitPrice,
      total: calc.total,
      // For historical snapshot compatibility
      salePrice: calc.unitPrice,
      discount: calc.totalDiscountPerUnit
    };
  });

  const grandTotal = Math.max(0, subtotal - totalDiscount);

  return {
    processedItems,
    subtotal,
    totalDiscount,
    installmentDiscountTotal,
    kitDiscountTotal,
    individualDiscountTotal,
    grandTotal
  };
};
