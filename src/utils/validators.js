/**
 * Validation helpers for form inputs
 */

/**
 * Checks if a value is defined, not null, and not an empty string
 * @param {any} val - Value to check
 * @returns {boolean} True if the value is filled
 */
export const isRequired = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string') return val.trim().length > 0;
  return String(val).length > 0;
};

/**
 * Checks if a value is a valid positive number (>= 0)
 * @param {any} val - Value to check
 * @returns {boolean} True if positive number
 */
export const isPositiveNumber = (val) => {
  const num = parseFloat(val);
  return !isNaN(num) && num >= 0;
};

/**
 * Checks if a barcode is non-empty and contains alphanumeric characters/hyphens
 * @param {string} val - Barcode string to validate
 * @returns {boolean} True if barcode structure is valid
 */
export const isValidBarcode = (val) => {
  if (!val) return false;
  // Standard alphanumeric + dashes/underscores barcode validator
  const regex = /^[a-zA-Z0-9\-_]+$/;
  return regex.test(val.trim());
};
