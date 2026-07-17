/**
 * Safely formats various date inputs (Firestore Timestamp, Date, string, etc.) into DD.MM.YYYY HH:MM format.
 * @param {any} dateVal - The date value to format
 * @returns {string} The formatted date string
 */
export const formatDate = (dateVal) => {
  if (!dateVal) return '—';

  let d = dateVal;

  // Handle Firestore Timestamp
  if (typeof dateVal.toDate === 'function') {
    d = dateVal.toDate();
  } 
  // Handle string or number representations
  else if (typeof dateVal === 'string' || typeof dateVal === 'number') {
    d = new Date(dateVal);
  }

  // Verify Date validity
  if (d instanceof Date && !isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  return '—';
};

export default formatDate;
