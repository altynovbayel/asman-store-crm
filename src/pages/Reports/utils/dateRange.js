/**
 * Returns the local-time date range for a report period.
 * Boundaries are in the user's local timezone: 00:00:00.000 .. 23:59:59.999.
 * Shared by Reports and Dashboard so "today" means the same thing on both pages.
 * @param {'today'|'week'|'month'|'custom'} type
 * @param {string} customS - 'YYYY-MM-DD' start date for the custom period
 * @param {string} customE - 'YYYY-MM-DD' end date for the custom period
 * @param {Date} now - reference date (defaults to the current moment)
 * @returns {{ startDate: Date, endDate: Date } | null}
 */
export const getDateRange = (type, customS = '', customE = '', now = new Date()) => {
  let startDate;
  let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (type === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (type === 'week') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
  } else if (type === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else if (type === 'custom') {
    if (!customS || !customE) return null;
    const [sYear, sMonth, sDay] = customS.split('-').map(Number);
    const [eYear, eMonth, eDay] = customE.split('-').map(Number);
    startDate = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
    endDate = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

export default getDateRange;
