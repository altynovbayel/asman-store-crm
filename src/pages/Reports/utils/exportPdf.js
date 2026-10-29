/**
 * PDF generation for Reports. Loaded on demand (dynamic import) so jsPDF is not part
 * of the main bundle. The document is built from data (not a screenshot) with an
 * embedded Roboto font, because jsPDF's standard fonts have no Cyrillic glyphs.
 */
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
// Roboto (SIL Open Font License 1.1), emitted by Vite as separate assets and fetched only on export
import robotoRegularUrl from '@expo-google-fonts/roboto/400Regular/Roboto_400Regular.ttf?url';
import robotoBoldUrl from '@expo-google-fonts/roboto/700Bold/Roboto_700Bold.ttf?url';
import { formatPrice } from '../../../utils/formatPrice';
import { formatDate } from '../../../utils/formatDate';

const FONT = 'Roboto';
const MARGIN = 12;

// Some ICU versions use U+202F as a thousands separator; Roboto has no glyph for it
const pdfText = (value) => String(value ?? '').replace(/\u202F/g, '\u00A0');
const money = (value) => pdfText(`${formatPrice(value)} сом`);

/** Shortens a single line with an ellipsis so it fits `maxWidth` (current font and size). */
const fitText = (doc, value, maxWidth) => {
  let line = pdfText(value);
  if (doc.getTextWidth(line) <= maxWidth) return line;
  while (line.length > 1 && doc.getTextWidth(`${line}…`) > maxWidth) {
    line = line.slice(0, -1);
  }
  return `${line.trimEnd()}…`;
};

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
};

const fetchFont = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return toBase64(await response.arrayBuffer());
};

let fontsPromise = null;
const loadFonts = () => {
  if (!fontsPromise) {
    fontsPromise = Promise.all([fetchFont(robotoRegularUrl), fetchFont(robotoBoldUrl)])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch((error) => {
        fontsPromise = null;
        throw new Error('Не удалось загрузить шрифт для PDF. Проверьте подключение к сети.', { cause: error });
      });
  }
  return fontsPromise;
};

// Widths sum to the printable width of landscape A4: 297 - 2 * MARGIN = 273 mm
const SALES_COLUMNS = [
  { header: 'Дата и время', width: 24 },
  { header: '№ продажи', width: 20 },
  { header: 'Продавец', width: 24 },
  { header: 'Товар', width: 58 },
  { header: 'Кол-во', width: 13, align: 'right' },
  { header: 'Цена (за ед.)', width: 21, align: 'right' },
  { header: 'Скидка (за ед.)', width: 19, align: 'right' },
  { header: 'Сумма позиции', width: 23, align: 'right' },
  { header: 'Оплата', width: 23 },
  { header: 'Покупатель', width: 26 },
  { header: 'Телефон', width: 22 }
];

/**
 * Builds the report document. `fonts` are base64 TTF strings ({ regular, bold }).
 * @returns {jsPDF}
 */
export const buildReportPdf = (data, fonts) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
  doc.addFont('Roboto-Regular.ttf', FONT, 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
  doc.addFont('Roboto-Bold.ttf', FONT, 'bold');
  doc.setProperties({ title: pdfText(`${data.storeName} — Отчёт ${data.periodLabel}`) });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;

  // Title: a long store name (from settings) wraps instead of running off the page
  doc.setFont(FONT, 'bold');
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(pdfText(`${data.storeName} — Отчёт`), contentWidth);
  doc.text(titleLines, MARGIN, 16);
  let y = 16 + (titleLines.length - 1) * 6.5;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(10);
  doc.text(pdfText(`Период: ${data.periodLabel}`), MARGIN, y + 7);
  doc.setTextColor(110);
  doc.text(pdfText(`Сформирован: ${formatDate(data.generatedAt)}`), MARGIN, y + 12.5);
  doc.setTextColor(0);
  y += 17;

  const tableStyles = { font: FONT, fontSize: 8, cellPadding: 1.6, overflow: 'linebreak', valign: 'top' };
  const headStyles = { font: FONT, fontStyle: 'bold', fillColor: [37, 99, 235], textColor: 255 };

  // KPI block (same values as on the Reports page)
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    theme: 'grid',
    styles: { ...tableStyles, fontSize: 10, halign: 'center' },
    headStyles,
    head: [['Выручка', 'Прибыль', 'Количество продаж', 'Средний чек']],
    body: [[
      money(data.kpi.revenue),
      money(data.kpi.profit),
      pdfText(`${data.kpi.salesCount} шт`),
      money(data.kpi.averageCheck)
    ]]
  });

  // Sales table: one row per item; header repeats on every page, long text wraps
  const body = data.saleRows.length === 0
    ? [[{ content: 'Продаж за выбранный период нет', colSpan: SALES_COLUMNS.length, styles: { halign: 'center' } }]]
    : data.saleRows.map((row) => [
      row.date ? formatDate(row.date) : '—',
      pdfText(row.saleNumber || '—'),
      pdfText(row.manager || '—'),
      pdfText(row.product || '—'),
      pdfText(row.quantity),
      money(row.unitPrice),
      money(row.unitDiscount),
      money(row.lineTotal),
      pdfText(row.payment || '—'),
      pdfText(row.customer || '—'),
      pdfText(row.phone || '—')
    ]);

  doc.setFont(FONT, 'bold');
  doc.setFontSize(11);
  const salesTitleY = doc.lastAutoTable.finalY + 8;
  doc.text('Продажи', MARGIN, salesTitleY);

  autoTable(doc, {
    startY: salesTitleY + 2.5,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN, bottom: 14 },
    theme: 'striped',
    showHead: 'everyPage',
    rowPageBreak: 'auto',
    styles: tableStyles,
    headStyles,
    head: [SALES_COLUMNS.map((c) => c.header)],
    body,
    columnStyles: Object.fromEntries(
      SALES_COLUMNS.map((c, i) => [i, { cellWidth: c.width, halign: c.align || 'left' }])
    )
  });

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(110);
  const pageLabelReserve = doc.getTextWidth(`Стр. ${pageCount} из ${pageCount}`) + 8;
  const footer = fitText(doc, `${data.storeName} — Отчёт · ${data.periodLabel}`, contentWidth - pageLabelReserve);
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.text(footer, MARGIN, pageHeight - 6);
    doc.text(`Стр. ${page} из ${pageCount}`, pageWidth - MARGIN, pageHeight - 6, { align: 'right' });
  }
  doc.setTextColor(0);

  return doc;
};

/** Generates the PDF and triggers the browser download. */
export const downloadReportPdf = async (data) => {
  const fonts = await loadFonts();
  buildReportPdf(data, fonts).save(data.fileNames.pdf);
};
