/**
 * Calculates the warranty expiration date from creation date and warranty period in months.
 * @param {Object|Date|string} createdAt 
 * @param {number} months 
 * @returns {Date|null}
 */
export const calculateExpiryDate = (createdAt, months = 12) => {
  if (!createdAt) return null;
  const date = typeof createdAt.toDate === 'function' ? createdAt.toDate() : new Date(createdAt);
  const expiryDate = new Date(date);
  expiryDate.setMonth(expiryDate.getMonth() + parseInt(months, 10));
  return expiryDate;
};
