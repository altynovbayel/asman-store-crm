/**
 * Safe reading of numbers from stored documents (historical sales may contain
 * missing, string or malformed values). Never throws and never returns NaN/Infinity.
 */

// Amounts in this CRM are far below 10^12 сом (the same bound Firestore Rules use for new
// sales); larger magnitudes are treated as corrupted so later arithmetic cannot overflow.
export const MAX_SAFE_AMOUNT = 1e12;
// Largest whole number JavaScript represents exactly; with amounts < 10^12 every
// amount x quantity product stays finite (< ~10^28)
export const MAX_SAFE_QUANTITY = Number.MAX_SAFE_INTEGER;

// Number from a finite number or a non-empty numeric string; NaN for every other type
const parseStored = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
};

/**
 * Finite number from a stored value.
 * - finite number -> as is
 * - numeric string ("1200", " 3.5 ") -> parsed (old documents may hold strings)
 * - magnitude >= MAX_SAFE_AMOUNT -> fallback (corrupted)
 * - anything else (null, undefined, '', NaN, ±Infinity, object, array, boolean,
 *   function, symbol, bigint) -> fallback
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
export const toSafeNumber = (value, fallback = 0) => {
  const num = parseStored(value);
  return Number.isFinite(num) && Math.abs(num) < MAX_SAFE_AMOUNT ? num : fallback;
};

/**
 * Sold quantity from a stored value. A valid quantity is a positive whole number
 * (as createSale enforces) up to MAX_SAFE_QUANTITY; zero, negative, fractional,
 * huge or malformed values count as 0.
 * @param {*} value
 * @returns {number}
 */
export const toSafeQuantity = (value) => {
  const qty = parseStored(value);
  return Number.isInteger(qty) && qty > 0 && qty <= MAX_SAFE_QUANTITY ? qty : 0;
};

/**
 * Finite number for values the app has already calculated (period totals, KPI, stock value):
 * only the type and finiteness are checked, without the stored-amount bound.
 * @param {*} value
 * @param {number} fallback
 * @returns {number}
 */
export const toFiniteNumber = (value, fallback = 0) =>
  (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

export default toSafeNumber;
