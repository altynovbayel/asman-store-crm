/**
 * XLSX generation for Reports. Loaded on demand (dynamic import) so the spreadsheet
 * library is not part of the main bundle. Turns prepared export data into a workbook;
 * no calculations here.
 */
import writeExcelFile from 'write-excel-file/browser';
import { sanitizeSpreadsheetText } from './exportData';

const MONEY_FORMAT = '#,##0.00';
const INT_FORMAT = '0';
const DATE_TIME_FORMAT = 'dd.mm.yyyy hh:mm';

// Excel dates have no time zone and write-excel-file converts a Date via getTime() (UTC).
// Pass the local wall-clock time (what Reports and PDF show) encoded as UTC instead.
const toExcelLocalDate = (date) => new Date(Date.UTC(
  date.getFullYear(), date.getMonth(), date.getDate(),
  date.getHours(), date.getMinutes(), date.getSeconds()
));

// Every text cell is explicitly typed as String (never a formula) and sanitized
const text = (value, extra = {}) => ({ type: String, value: sanitizeSpreadsheetText(value), ...extra });
const money = (value, extra = {}) => ({ type: Number, value, format: MONEY_FORMAT, ...extra });
const int = (value, extra = {}) => ({ type: Number, value, format: INT_FORMAT, ...extra });
const dateTime = (value) => (value ? { type: Date, value: toExcelLocalDate(value), format: DATE_TIME_FORMAT } : text(''));
const header = (labels) => labels.map((label) => text(label, { fontWeight: 'bold' }));

const buildSummarySheet = (data) => ({
  sheet: 'Сводка',
  columns: [{ width: 34 }, { width: 22 }],
  data: [
    [text(`${data.storeName} — Отчёт`, { fontWeight: 'bold' }), null],
    [text('Период'), text(data.periodLabel)],
    [text('Сформирован'), dateTime(data.generatedAt)],
    [null, null],
    header(['Показатель за период', 'Значение']),
    [text('Выручка'), money(data.kpi.revenue)],
    [text('Прибыль'), money(data.kpi.profit)],
    [text('Количество продаж'), int(data.kpi.salesCount)],
    [text('Средний чек'), money(data.kpi.averageCheck)],
    [null, null],
    header(['Склад на момент выгрузки', 'Значение']),
    [text('Товаров на складе'), int(data.inventory.totalUnits)],
    [text('Стоимость закупки'), money(data.inventory.purchaseValue)],
    [text('Розничная стоимость'), money(data.inventory.retailValue)],
    [text('Потенциальная прибыль'), money(data.inventory.potentialProfit)]
  ]
});

const SALES_HEADER = [
  'Дата и время', '№ продажи', 'Продавец', 'Товар', 'Штрихкод', 'Количество',
  'Цена продажи (за ед.)', 'Скидка (за ед.)', 'Итоговая сумма позиции', 'Способ оплаты', 'Покупатель', 'Телефон'
];

const buildSalesSheet = (data) => ({
  sheet: 'Продажи',
  stickyRowsCount: 1,
  columns: [
    { width: 17 }, { width: 13 }, { width: 22 }, { width: 44 }, { width: 18 }, { width: 11 },
    { width: 18 }, { width: 15 }, { width: 20 }, { width: 18 }, { width: 24 }, { width: 18 }
  ],
  data: [
    header(SALES_HEADER),
    ...(data.saleRows.length === 0
      ? [[text('Продаж за выбранный период нет')]]
      : data.saleRows.map((row) => [
        dateTime(row.date),
        text(row.saleNumber),
        text(row.manager),
        text(row.product),
        text(row.barcode),
        int(row.quantity),
        money(row.unitPrice),
        money(row.unitDiscount),
        money(row.lineTotal),
        text(row.payment),
        text(row.customer),
        text(row.phone)
      ]))
  ]
});

const buildEmployeesSheet = (data) => ({
  sheet: 'Сотрудники',
  stickyRowsCount: 1,
  columns: [{ width: 28 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 }],
  data: [
    header(['Сотрудник', 'Количество продаж', 'Выручка', 'Прибыль', 'Средний чек']),
    ...data.employeeRows.map((row) => [
      text(row.manager),
      int(row.salesCount),
      money(row.revenue),
      money(row.profit),
      money(row.averageCheck)
    ])
  ]
});

const buildStockSheet = (data) => ({
  sheet: 'Склад',
  stickyRowsCount: 1,
  columns: [
    { width: 32 }, { width: 12 }, { width: 18 }, { width: 10 }, { width: 10 }, { width: 18 },
    { width: 11 }, { width: 16 }, { width: 16 }, { width: 20 }, { width: 20 }
  ],
  data: [
    header(['Название', 'Тип', 'CPU', 'RAM', 'SSD', 'Штрихкод', 'Количество', 'Закупочная цена', 'Цена продажи', 'Закупочная стоимость', 'Розничная стоимость']),
    ...data.stockRows.map((row) => [
      text(row.name),
      text(row.type),
      text(row.cpu),
      text(row.ram),
      text(row.ssd),
      text(row.barcode),
      int(row.quantity),
      money(row.purchasePrice),
      money(row.sellingPrice),
      money(row.purchaseValue),
      money(row.retailValue)
    ]),
    // Totals are the same values as the Reports inventory KPI
    [
      text('Итого', { fontWeight: 'bold' }), null, null, null, null, null,
      int(data.inventory.totalUnits, { fontWeight: 'bold' }), null, null,
      money(data.inventory.purchaseValue, { fontWeight: 'bold' }),
      money(data.inventory.retailValue, { fontWeight: 'bold' })
    ]
  ]
});

/** Workbook description for write-excel-file: four sheets. */
export const buildReportWorkbook = (data) => [
  buildSummarySheet(data),
  buildSalesSheet(data),
  buildEmployeesSheet(data),
  buildStockSheet(data)
];

/** Generates the .xlsx file and triggers the browser download. */
export const downloadReportXlsx = async (data) => {
  await writeExcelFile(buildReportWorkbook(data), { fontFamily: 'Calibri', fontSize: 11 }).toFile(data.fileNames.xlsx);
};
