import { PAYMENT_METHOD_LABELS } from '../constants/paymentMethods';

export const UNKNOWN_PAYMENT_METHOD_LABEL = 'Неизвестный способ оплаты';

const MAX_RAW_LENGTH = 40;

// Only numbers and numeric strings count; booleans, arrays and maps from old or
// malformed documents are ignored (Number() would coerce them or even throw)
const toPositiveNumber = (value) => {
  let num;
  if (typeof value === 'number') num = value;
  else if (typeof value === 'string' && value.trim() !== '') num = Number(value);
  else return 0;
  return Number.isFinite(num) && num > 0 ? num : 0;
};

/**
 * Label of a stored sale paymentMethod. Safe for any value from Firestore:
 * only own properties of PAYMENT_METHOD_LABELS are used, so values like "__proto__",
 * "constructor" or "toString" never resolve to Object.prototype members.
 * - known method -> its label ("Наличные", "М+", ...)
 * - unknown string -> "Неизвестный способ оплаты (<value>)"
 * - other non-string value (number, object, ...) -> "Неизвестный способ оплаты"
 * - null / undefined / empty string -> '' (callers show their own placeholder, e.g. "—")
 * @param {*} paymentMethod
 * @returns {string}
 */
export const getPaymentMethodLabel = (paymentMethod) => {
  if (paymentMethod === null || paymentMethod === undefined) return '';
  if (typeof paymentMethod !== 'string') return UNKNOWN_PAYMENT_METHOD_LABEL;

  const method = paymentMethod.trim();
  if (!method) return '';
  if (Object.hasOwn(PAYMENT_METHOD_LABELS, method)) return PAYMENT_METHOD_LABELS[method];

  const raw = method.length > MAX_RAW_LENGTH ? `${method.slice(0, MAX_RAW_LENGTH)}…` : method;
  return `${UNKNOWN_PAYMENT_METHOD_LABEL} (${raw})`;
};

/**
 * Payment method of a sale with installment details, as shown in sales lists:
 * "Наличные", "М+ (3 мес)", or with `withDiscount` "М+ (3 мес, скидка 5%)".
 * Historical 6/12-month terms are shown as stored. Returns '' when the method is missing.
 * @param {Object} sale
 * @param {{ withDiscount?: boolean }} options
 * @returns {string}
 */
export const formatSalePaymentMethod = (sale, { withDiscount = false } = {}) => {
  const label = getPaymentMethodLabel(sale?.paymentMethod);
  if (!label) return '';

  const term = toPositiveNumber(sale?.installmentTerm);
  if (!term) return label;

  const discount = withDiscount ? toPositiveNumber(sale?.installmentDiscount) : 0;
  return `${label} (${term} мес${discount ? `, скидка ${discount}%` : ''})`;
};

export default getPaymentMethodLabel;
