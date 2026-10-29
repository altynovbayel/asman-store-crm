/**
 * Prepares Reports data for file export (XLSX / PDF).
 * Pure functions: no Firestore access and no business formulas of their own —
 * KPI, employee stats and stock valuation come from reportCalculations.js,
 * sale rows come from historical sale snapshots only.
 */
import { getStockValuation } from './reportCalculations';
import { getProductDisplayName } from '../../../utils/getProductDisplayName';
import { PAYMENT_METHOD_LABELS } from '../../../constants/paymentMethods';
import { PRODUCT_TYPES } from '../../../constants/productTypes';

const pad = (n) => String(n).padStart(2, '0');

/** Firestore Timestamp / Date / string / number -> Date, or null if invalid. */
export const toJsDate = (value) => {
  if (!value) return null;
  const date = typeof value.toDate === 'function' ? value.toDate() : new Date(value);
  return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
};

/** Finite number or 0 (old documents may hold strings or nothing). */
const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/** Plain text for a cell: strings as-is, other primitives stringified, objects dropped. */
const toText = (value) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

// Phone-like values ("+996 555 12-34-56") are plain digits/punctuation, not formulas
const PHONE_LIKE = /^[+-]?[\d\s().-]+$/;
const FORMULA_START = /^[=+\-@\t\r]/;

// write-excel-file indexes shared strings in a plain object, so texts equal to an
// Object.prototype property name ("constructor", "toString", "__proto__", ...) corrupt the cell
const isPrototypeKey = (text) => Object.prototype.hasOwnProperty.call(Object.prototype, text);

/**
 * Makes a text safe for a spreadsheet cell by adding a leading apostrophe when:
 * - it starts with = + - @ (or tab / CR) — formula injection; phone numbers and other
 *   purely numeric strings are left unchanged;
 * - it equals an Object.prototype property name, which the XLSX writer cannot store verbatim.
 */
export const sanitizeSpreadsheetText = (value) => {
  const text = toText(value);
  if ((FORMULA_START.test(text) && !PHONE_LIKE.test(text)) || isPrototypeKey(text)) {
    return `'${text}`;
  }
  return text;
};

const formatDay = (date) => `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
const isoDay = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** "28.10.2026" for a single day or "01.10.2026 — 28.10.2026" for a range (local dates). */
export const formatPeriodLabel = (range) => {
  const start = formatDay(range.startDate);
  const end = formatDay(range.endDate);
  return start === end ? start : `${start} — ${end}`;
};

/** asman-store-report-YYYY-MM-DD_YYYY-MM-DD.<ext> (local dates, filesystem-safe). */
export const buildReportFileName = (range, extension) =>
  `asman-store-report-${isoDay(range.startDate)}_${isoDay(range.endDate)}.${extension}`;

/** Payment method label as shown in sale details, e.g. "М+ (3 мес)". */
export const getPaymentLabel = (sale) => {
  const method = toText(sale?.paymentMethod);
  const label = (Object.hasOwn(PAYMENT_METHOD_LABELS, method) && PAYMENT_METHOD_LABELS[method]) || method;
  const term = toNumber(sale?.installmentTerm);
  return term > 0 && label ? `${label} (${term} мес)` : label;
};

/**
 * One row per sold item, using only the sale's historical snapshot.
 * Unit price / discount fallbacks are the same as in calculateSingleSaleProfit.
 * A sale without items still produces one row so it is not lost from the export.
 */
export const buildSaleItemRows = (sales = []) => {
  const rows = [];
  for (const sale of sales) {
    if (!sale) continue;
    const base = {
      date: toJsDate(sale.createdAt),
      saleNumber: toText(sale.saleNumber),
      manager: toText(sale.managerName),
      payment: getPaymentLabel(sale),
      customer: toText(sale.customerName),
      phone: toText(sale.customerPhone)
    };
    const items = Array.isArray(sale.items) ? sale.items.filter(Boolean) : [];

    if (items.length === 0) {
      rows.push({ ...base, product: '', barcode: '', quantity: 0, unitPrice: 0, unitDiscount: 0, lineTotal: toNumber(sale.grandTotal) });
      continue;
    }

    for (const item of items) {
      const quantity = toNumber(item.quantity);
      const unitPrice = toNumber(item.salePrice !== undefined ? item.salePrice : (item.unitPrice || item.price || 0));
      const unitDiscount = toNumber(item.discount !== undefined ? item.discount : (item.itemDiscount || 0));
      const lineTotal = item.total !== undefined && Number.isFinite(Number(item.total))
        ? Number(item.total)
        : Math.max(0, unitPrice - unitDiscount) * quantity;

      rows.push({
        ...base,
        product: toText(getProductDisplayName(item)),
        barcode: toText(item.barcode),
        quantity,
        unitPrice,
        unitDiscount,
        lineTotal
      });
    }
  }
  return rows;
};

const PRODUCT_TYPE_LABELS = {
  [PRODUCT_TYPES.LAPTOP]: 'Ноутбук',
  [PRODUCT_TYPES.ACCESSORY]: 'Аксессуар'
};

/** Current stock rows: only products with units in stock (SOLD laptops excluded). */
export const buildStockRows = (products = []) =>
  products
    .map((product) => ({ product, valuation: getStockValuation(product) }))
    .filter(({ valuation }) => valuation.units > 0)
    .map(({ product, valuation }) => ({
      name: toText(product.name),
      type: PRODUCT_TYPE_LABELS[product.type] || '',
      cpu: toText(product.cpu),
      ram: toText(product.ram),
      ssd: toText(product.ssd),
      barcode: toText(product.barcode),
      quantity: valuation.units,
      purchasePrice: valuation.unitCost,
      sellingPrice: valuation.unitPrice,
      purchaseValue: valuation.purchaseValue,
      retailValue: valuation.retailValue
    }));

/**
 * Collects everything an export needs from the values already shown on the Reports page.
 * @param {Object} params
 * @param {{startDate: Date, endDate: Date}} params.range - period the shown sales were loaded for
 * @param {Array} params.sales - sales currently shown in Reports
 * @param {{revenue, profit, salesCount, averageCheck}} params.kpi - KPI shown in Reports
 * @param {Array} params.employees - calculateEmployeeStats() result shown in Reports
 * @param {Array} params.products - current products
 * @param {{totalUnits, purchaseValue, retailValue, potentialProfit}} params.inventory - stock KPI shown in Reports
 * @param {string} params.storeName
 * @param {Date} params.generatedAt
 */
export const buildReportExportData = ({
  range,
  sales = [],
  kpi,
  employees = [],
  products = [],
  inventory,
  storeName = 'Asman Store',
  generatedAt = new Date()
}) => ({
  storeName,
  generatedAt,
  periodLabel: formatPeriodLabel(range),
  fileNames: {
    xlsx: buildReportFileName(range, 'xlsx'),
    pdf: buildReportFileName(range, 'pdf')
  },
  kpi: {
    revenue: toNumber(kpi?.revenue),
    profit: toNumber(kpi?.profit),
    salesCount: toNumber(kpi?.salesCount),
    averageCheck: toNumber(kpi?.averageCheck)
  },
  inventory: {
    totalUnits: toNumber(inventory?.totalUnits),
    purchaseValue: toNumber(inventory?.purchaseValue),
    retailValue: toNumber(inventory?.retailValue),
    potentialProfit: toNumber(inventory?.potentialProfit)
  },
  saleRows: buildSaleItemRows(sales),
  employeeRows: employees.map((e) => ({
    manager: toText(e.manager),
    salesCount: toNumber(e.salesCount),
    revenue: toNumber(e.revenue),
    profit: toNumber(e.profit),
    averageCheck: toNumber(e.averageCheck)
  })),
  stockRows: buildStockRows(products)
});
