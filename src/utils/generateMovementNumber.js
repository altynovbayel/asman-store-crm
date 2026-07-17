/**
 * Generates a sequential movement number string (e.g. MOV-000005)
 * @param {number} nextNumber - The next integer in the sequence
 * @returns {string} The formatted sequential code
 */
export const generateMovementNumber = (nextNumber) => {
  const num = parseInt(nextNumber, 10);
  if (isNaN(num) || num <= 0) {
    return 'MOV-000001';
  }
  return `MOV-${String(num).padStart(6, '0')}`;
};

export default generateMovementNumber;
