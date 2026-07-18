/**
 * Generates a sequential sale number string (e.g. SAL-000005)
 * @param {number} nextNumber - The next integer in the sequence
 * @returns {string} The formatted sequential code
 */
export const generateSaleNumber = (nextNumber) => {
  const num = parseInt(nextNumber, 10);
  if (isNaN(num) || num <= 0) {
    return 'SAL-000001';
  }
  return `SAL-${String(num).padStart(6, '0')}`;
};

export default generateSaleNumber;
