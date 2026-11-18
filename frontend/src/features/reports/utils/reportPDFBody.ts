/**
 * Lab report PDF body — result tables with column headers, value bars, and reference intervals.
 */

import type jsPDF from 'jspdf';
import type { Gender, OrderableTest, AnalyteDefinition } from '@/types';
import { getTestAnalytesByCode } from '@/features/catalog';
import { getAnalyteReferenceIntervalLines } from '@/features/lab/cross';
import type { LabReportPayload } from '@/types';
import type { ReportResultRow } from './prepareReportData';
import { RESULT_NOT_AVAILABLE } from '@/types';

const FONT = 'courier';
const TITLE_SIZE = 7;
const SUBTITLE_SIZE = 7;
const TABLE_SIZE = 7;
const TABLE_HEAD_SIZE = 6;
const TABLE_HEAD_GAP = 1;
/** Reference range numbers (right column). */
const REFERENCE_VALUE_SIZE = 6;
/** Sex labels beside reference range values (Male / Female). */
const REFERENCE_LABEL_SIZE = 5;
const NOTES_SIZE = 6;

const ROW_HEIGHT = 3.6;
/** Vertical step between stacked reference lines (male / female / …). */
const REFERENCE_PAIR_LINE_HEIGHT = 3.4;
const SECTION_GAP = 3.5;
const CATEGORY_GAP = 5;

const BOTTOM_MARGIN = 18;
const RESULT_BAR_PADDING = 0.6;
const RESULT_BAR_HEIGHT = 3.1;
/** Vertical offset from text baseline to top of result / note gray bar (mm). */
const RESULT_BAR_BASELINE_OFFSET = 0.9;
const COL_GAP = 2;
const FLAG_COLUMN_WIDTH = 3;
/** Indent before nested result rows under each exam (one tab). */
const RESULT_TAB_INDENT = 3.5;

const COLOR_TEXT = { r: 0, g: 0, b: 0 } as const;
const COLOR_UNIT = { r: 107, g: 114, b: 128 } as const;
const COLOR_ABNORMAL = { r: 234, g: 88, b: 12 } as const;
const COLOR_CRITICAL = { r: 220, g: 38, b: 38 } as const;
const COLOR_RESULT_BAR = { r: 232, g: 232, b: 232 } as const;
const COLOR_RESULT_BAR_ABNORMAL = { r: 255, g: 237, b: 213 } as const;
const COLOR_RESULT_BAR_CRITICAL = { r: 254, g: 226, b: 226 } as const;
const COLOR_NOTE_BAR = { r: 245, g: 245, b: 245 } as const;
const COLOR_ROW_ALT = { r: 250, g: 250, b: 250 } as const;

type ReportTest = LabReportPayload['testResults'][number];

interface CategoryGroup {
  category: string;
  tests: ReportTest[];
}

interface BodyLayout {
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  colResultLabel: number;
  colResultLabelW: number;
  contentRight: number;
  /** Returns the Y where body content may resume after a new page chrome. */
  onNewPage?: (doc: jsPDF) => number;
}

interface ResultRowLayout {
  resultBarX: number;
  resultBarW: number;
  flagX: number;
  unitX: number;
}

interface ReferenceSubColumnLayout {
  valueRightX: number;
  labelRightX: number;
}

interface ReportPatientContext {
  gender?: Gender;
  age?: number;
}

function groupTestsByCategory(testResults: ReportTest[]): CategoryGroup[] {
  const order: string[] = [];
  const map = new Map<string, ReportTest[]>();

  for (const test of testResults) {
    const category = test.category.trim() || 'Uncategorized';
    if (!map.has(category)) {
      order.push(category);
      map.set(category, []);
    }
    map.get(category)!.push(test);
  }

  return order.map(category => ({
    category,
    tests: map.get(category) ?? [],
  }));
}

function withResultIndent(layout: BodyLayout, indent: number): BodyLayout {
  return {
    ...layout,
    colResultLabel: layout.margin + indent,
    colResultLabelW: Math.max(layout.colResultLabelW - indent, 20),
  };
}

function getBodyLayout(
  doc: jsPDF,
  margin: number,
  onNewPage?: (doc: jsPDF) => number
): BodyLayout {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const colResultLabelW = contentWidth * 0.36;

  return {
    margin,
    pageWidth,
    pageHeight,
    contentWidth,
    colResultLabel: margin,
    colResultLabelW,
    contentRight: margin + contentWidth,
    onNewPage,
  };
}

function ensureVerticalSpace(
  doc: jsPDF,
  y: number,
  needed: number,
  layout: BodyLayout
): number {
  if (y + needed <= layout.pageHeight - BOTTOM_MARGIN) {
    return y;
  }
  doc.addPage();
  return layout.onNewPage ? layout.onNewPage(doc) : layout.margin;
}

function resultValueText(resultRow: ReportResultRow): string {
  const raw = String(resultRow.value ?? '').trim();
  if (!raw || raw === RESULT_NOT_AVAILABLE) {
    return RESULT_NOT_AVAILABLE;
  }
  return raw;
}

function resultUnitText(resultRow: ReportResultRow): string | undefined {
  const value = resultValueText(resultRow);
  if (value === RESULT_NOT_AVAILABLE) return undefined;
  const unit = resultRow.unit?.trim();
  return unit || undefined;
}

/** Directional flag like classic lab printouts (`<` low, `>` high). */
function resultFlagSymbol(status?: string): string | null {
  if (!status || status === 'normal') return null;
  if (status === 'low' || status === 'critical-low') return '<';
  if (status === 'high' || status === 'critical-high' || status === 'critical') return '>';
  return null;
}

function isCriticalStatus(status?: string): boolean {
  return (
    status === 'critical' ||
    status === 'critical-high' ||
    status === 'critical-low'
  );
}

function isAbnormalStatus(status?: string): boolean {
  return Boolean(status && status !== 'normal');
}

function reportPatientFromPayload(reportData: LabReportPayload): ReportPatientContext {
  const gender =
    reportData.patientGender === 'male' || reportData.patientGender === 'female'
      ? reportData.patientGender
      : undefined;
  return { gender, age: reportData.patientAge };
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
};

/** Courier-safe units (×10⁹/L → x10^9/L) for jsPDF. */
export function formatUnitForPdf(unit: string): string {
  let text = unit.trim().replace(/×/g, 'x');
  text = text.replace(/x10([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/gi, (_match, superscript: string) => {
    const digits = [...superscript]
      .map(char => SUPERSCRIPT_DIGITS[char] ?? char)
      .join('');
    return `x10^${digits}`;
  });
  return [...text]
    .map(char => SUPERSCRIPT_DIGITS[char] ?? char)
    .join('');
}

function computeResultRowLayout(
  doc: jsPDF,
  layout: BodyLayout,
  resultRows: ReportResultRow[]
): ResultRowLayout {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(TABLE_SIZE);

  let maxValueWidth = 0;

  for (const row of resultRows) {
    maxValueWidth = Math.max(maxValueWidth, doc.getTextWidth(resultValueText(row)));
  }

  const resultBarX = layout.colResultLabel + layout.colResultLabelW + COL_GAP;
  const resultBarW = maxValueWidth + RESULT_BAR_PADDING * 2;
  const flagX = resultBarX + resultBarW + COL_GAP;
  const unitX = flagX + FLAG_COLUMN_WIDTH + COL_GAP;

  doc.setFont(FONT, 'normal');
  return { resultBarX, resultBarW, flagX, unitX };
}

function computeReferenceSubColumnLayout(
  doc: jsPDF,
  layout: BodyLayout,
  test: ReportTest,
  catalogAnalytes: Record<string, AnalyteDefinition>,
  patient: ReportPatientContext
): ReferenceSubColumnLayout {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(REFERENCE_VALUE_SIZE);

  let maxValueWidth = 0;
  let maxLabelWidth = 0;

  doc.setFontSize(REFERENCE_LABEL_SIZE);
  for (const row of test.parameters) {
    const lines = getAnalyteReferenceIntervalLines(
      catalogAnalytes[row.code],
      row.referenceRange,
      patient,
      'all_catalog_bands'
    );
    for (const line of lines) {
      doc.setFontSize(REFERENCE_VALUE_SIZE);
      maxValueWidth = Math.max(maxValueWidth, doc.getTextWidth(line.value));
      if (line.label?.trim()) {
        doc.setFontSize(REFERENCE_LABEL_SIZE);
        maxLabelWidth = Math.max(maxLabelWidth, doc.getTextWidth(line.label));
      }
    }
  }
  doc.setFontSize(REFERENCE_VALUE_SIZE);

  const valueRightX = layout.contentRight;
  const labelRightX =
    maxLabelWidth > 0 ? valueRightX - maxValueWidth - COL_GAP : valueRightX;

  return { valueRightX, labelRightX };
}

function referenceLineCount(
  resultRow: ReportResultRow,
  catalogAnalytes: Record<string, AnalyteDefinition>,
  patient: ReportPatientContext
): number {
  const lines = getAnalyteReferenceIntervalLines(
    catalogAnalytes[resultRow.code],
    resultRow.referenceRange,
    patient,
    'all_catalog_bands'
  );
  return Math.max(lines.length, 1);
}

function referenceBlockHeight(lineCount: number): number {
  if (lineCount <= 1) return ROW_HEIGHT;
  return lineCount * REFERENCE_PAIR_LINE_HEIGHT;
}

function drawResultRowBackground(
  doc: jsPDF,
  layout: BodyLayout,
  y: number,
  rowHeight: number,
  alternate: boolean
): void {
  if (!alternate) return;
  const top = y - ROW_HEIGHT + 0.5;
  doc.setFillColor(COLOR_ROW_ALT.r, COLOR_ROW_ALT.g, COLOR_ROW_ALT.b);
  doc.rect(layout.colResultLabel, top, layout.contentRight - layout.colResultLabel, rowHeight, 'F');
}

function drawResultBar(
  doc: jsPDF,
  y: number,
  value: string,
  rowLayout: ResultRowLayout,
  abnormal: boolean,
  critical: boolean
): void {
  const barTop = y - RESULT_BAR_HEIGHT + RESULT_BAR_BASELINE_OFFSET;
  const fill = critical
    ? COLOR_RESULT_BAR_CRITICAL
    : abnormal
      ? COLOR_RESULT_BAR_ABNORMAL
      : COLOR_RESULT_BAR;
  doc.setFillColor(fill.r, fill.g, fill.b);
  doc.rect(rowLayout.resultBarX, barTop, rowLayout.resultBarW, RESULT_BAR_HEIGHT, 'F');

  doc.setFont(FONT, 'bold');
  doc.setFontSize(TABLE_SIZE);
  if (abnormal) {
    doc.setTextColor(
      critical ? COLOR_CRITICAL.r : COLOR_ABNORMAL.r,
      critical ? COLOR_CRITICAL.g : COLOR_ABNORMAL.g,
      critical ? COLOR_CRITICAL.b : COLOR_ABNORMAL.b
    );
  } else {
    doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  }

  const textX = rowLayout.resultBarX + rowLayout.resultBarW - RESULT_BAR_PADDING;
  doc.text(value, textX, y, { align: 'right' });
  doc.setFont(FONT, 'normal');
  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
}

function drawResultCell(
  doc: jsPDF,
  y: number,
  resultRow: ReportResultRow,
  rowLayout: ResultRowLayout
): void {
  const value = resultValueText(resultRow);
  const unit = resultUnitText(resultRow);
  const unitText = unit ? formatUnitForPdf(unit) : undefined;
  const flag = resultFlagSymbol(resultRow.status);
  const abnormal = isAbnormalStatus(resultRow.status);
  const critical = isCriticalStatus(resultRow.status);

  if (value !== RESULT_NOT_AVAILABLE) {
    drawResultBar(doc, y, value, rowLayout, abnormal, critical);
  } else {
    doc.setFont(FONT, 'normal');
    doc.setFontSize(TABLE_SIZE);
    doc.setTextColor(COLOR_UNIT.r, COLOR_UNIT.g, COLOR_UNIT.b);
    doc.text(value, rowLayout.resultBarX, y, { align: 'left' });
    doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  }

  if (flag) {
    doc.setFont(FONT, 'bold');
    doc.setFontSize(TABLE_SIZE);
    doc.setTextColor(
      critical ? COLOR_CRITICAL.r : COLOR_ABNORMAL.r,
      critical ? COLOR_CRITICAL.g : COLOR_ABNORMAL.g,
      critical ? COLOR_CRITICAL.b : COLOR_ABNORMAL.b
    );
    doc.text(flag, rowLayout.flagX, y, { align: 'left' });
    doc.setFont(FONT, 'normal');
    doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  }

  if (unitText) {
    doc.setFont(FONT, 'normal');
    doc.setFontSize(TABLE_SIZE);
    doc.setTextColor(COLOR_UNIT.r, COLOR_UNIT.g, COLOR_UNIT.b);
    doc.text(unitText, rowLayout.unitX, y, { align: 'left' });
    doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  }
}

function drawReferenceCell(
  doc: jsPDF,
  y: number,
  resultRow: ReportResultRow,
  subColumns: ReferenceSubColumnLayout,
  catalogAnalytes: Record<string, AnalyteDefinition>,
  patient: ReportPatientContext
): number {
  const lines = getAnalyteReferenceIntervalLines(
    catalogAnalytes[resultRow.code],
    resultRow.referenceRange,
    patient,
    'all_catalog_bands'
  );

  doc.setFont(FONT, 'normal');

  const lineHeight = lines.length > 1 ? REFERENCE_PAIR_LINE_HEIGHT : 0;
  for (let i = 0; i < lines.length; i += 1) {
    const lineY = y + i * (lines.length > 1 ? lineHeight : 0);
    const label = lines[i].label?.trim();
    if (label) {
      doc.setFontSize(REFERENCE_LABEL_SIZE);
      doc.setTextColor(COLOR_UNIT.r, COLOR_UNIT.g, COLOR_UNIT.b);
      doc.text(label, subColumns.labelRightX, lineY, { align: 'right' });
    }
    doc.setFontSize(REFERENCE_VALUE_SIZE);
    doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
    doc.text(lines[i].value, subColumns.valueRightX, lineY, { align: 'right' });
  }

  doc.setFontSize(TABLE_SIZE);
  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  return lines.length;
}

function drawReportResultRow(
  doc: jsPDF,
  y: number,
  layout: BodyLayout,
  resultRow: ReportResultRow,
  rowLayout: ResultRowLayout,
  referenceSubColumns: ReferenceSubColumnLayout,
  catalogAnalytes: Record<string, AnalyteDefinition>,
  patient: ReportPatientContext,
  rowIndex: number
): number {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(TABLE_SIZE);

  const nameLines = doc.splitTextToSize(resultRow.name, layout.colResultLabelW - 1);
  const refLineCount = referenceLineCount(resultRow, catalogAnalytes, patient);
  const refHeight = referenceBlockHeight(refLineCount);
  const rowHeight = Math.max(nameLines.length * ROW_HEIGHT, ROW_HEIGHT, refHeight);

  drawResultRowBackground(doc, layout, y, rowHeight, rowIndex % 2 === 1);

  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  drawResultCell(doc, y, resultRow, rowLayout);
  drawReferenceCell(doc, y, resultRow, referenceSubColumns, catalogAnalytes, patient);

  for (let i = 0; i < nameLines.length; i += 1) {
    const lineY = y + i * ROW_HEIGHT;
    if (nameLines[i]) {
      doc.text(nameLines[i], layout.colResultLabel, lineY, { align: 'left' });
    }
  }

  return y + rowHeight;
}

function drawResultsTableHeader(
  doc: jsPDF,
  y: number,
  resultsLayout: BodyLayout,
  rowLayout: ResultRowLayout,
  referenceSubColumns: ReferenceSubColumnLayout
): number {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(TABLE_HEAD_SIZE);
  doc.setTextColor(COLOR_UNIT.r, COLOR_UNIT.g, COLOR_UNIT.b);
  doc.text('RESULT', resultsLayout.colResultLabel, y, { align: 'left' });
  doc.text('VALUE', rowLayout.resultBarX, y, { align: 'left' });
  doc.text('REFERENCE INTERVAL', referenceSubColumns.valueRightX, y, { align: 'right' });
  doc.setFont(FONT, 'normal');
  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  return y + TABLE_HEAD_GAP + ROW_HEIGHT * 0.65;
}

function drawNoteBlock(doc: jsPDF, y: number, layout: BodyLayout, note: string): number {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(NOTES_SIZE);
  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  const label = 'NOTE:';
  doc.text(label, layout.colResultLabel, y);

  const labelWidth = doc.getTextWidth(label) + COL_GAP;
  const barX = layout.colResultLabel + labelWidth;
  const barW = layout.contentRight - barX;
  const barTop = y - RESULT_BAR_HEIGHT + RESULT_BAR_BASELINE_OFFSET;

  doc.setFillColor(COLOR_NOTE_BAR.r, COLOR_NOTE_BAR.g, COLOR_NOTE_BAR.b);
  doc.rect(barX, barTop, barW, RESULT_BAR_HEIGHT, 'F');

  doc.setFont(FONT, 'normal');
  const lines = doc.splitTextToSize(note, barW - RESULT_BAR_PADDING * 2);
  for (let i = 0; i < lines.length; i += 1) {
    const lineY = y + i * ROW_HEIGHT;
    if (i > 0) {
      doc.setFillColor(COLOR_NOTE_BAR.r, COLOR_NOTE_BAR.g, COLOR_NOTE_BAR.b);
      doc.rect(
        barX,
        lineY - RESULT_BAR_HEIGHT + RESULT_BAR_BASELINE_OFFSET,
        barW,
        RESULT_BAR_HEIGHT,
        'F'
      );
    }
    doc.text(lines[i], barX + RESULT_BAR_PADDING, lineY, { align: 'left' });
  }

  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  return y + lines.length * ROW_HEIGHT;
}

function drawTestSection(
  doc: jsPDF,
  test: ReportTest,
  startY: number,
  layout: BodyLayout,
  orderableTests: OrderableTest[],
  patient: ReportPatientContext
): number {
  let y = ensureVerticalSpace(doc, startY, ROW_HEIGHT * 3, layout);
  y += 2;

  const title = test.testName;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(TITLE_SIZE);
  doc.text(title, layout.margin, y);
  doc.setFont(FONT, 'normal');
  y += 3.5;

  if (test.methodology) {
    doc.setFont(FONT, 'normal');
    doc.setFontSize(SUBTITLE_SIZE);
    doc.setTextColor(COLOR_UNIT.r, COLOR_UNIT.g, COLOR_UNIT.b);
    doc.text(`(Method: ${test.methodology})`, layout.margin, y);
    doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
    y += 3.5;
  }

  y += 1;

  const resultsLayout = withResultIndent(layout, RESULT_TAB_INDENT);
  const catalogAnalytes = getTestAnalytesByCode(test.testCode, orderableTests);
  const rowLayout = computeResultRowLayout(doc, resultsLayout, test.parameters);
  const referenceSubColumns = computeReferenceSubColumnLayout(
    doc,
    resultsLayout,
    test,
    catalogAnalytes,
    patient
  );

  y = ensureVerticalSpace(doc, y, ROW_HEIGHT, resultsLayout);
  y = drawResultsTableHeader(doc, y, resultsLayout, rowLayout, referenceSubColumns);

  for (let rowIndex = 0; rowIndex < test.parameters.length; rowIndex += 1) {
    const row = test.parameters[rowIndex];
    const refLines = referenceLineCount(row, catalogAnalytes, patient);
    const neededHeight = Math.max(ROW_HEIGHT * 2, referenceBlockHeight(refLines));
    y = ensureVerticalSpace(doc, y, neededHeight, resultsLayout);
    y = drawReportResultRow(
      doc,
      y,
      resultsLayout,
      row,
      rowLayout,
      referenceSubColumns,
      catalogAnalytes,
      patient,
      rowIndex
    );
  }

  const notes = [test.technicianNotes?.trim(), test.validationNotes?.trim()].filter(
    (note): note is string => Boolean(note)
  );
  if (notes.length > 0) {
    y = ensureVerticalSpace(doc, y, ROW_HEIGHT * 2, resultsLayout);
    y += 1;
    for (const note of notes) {
      y = ensureVerticalSpace(doc, y, ROW_HEIGHT, resultsLayout);
      y = drawNoteBlock(doc, y, resultsLayout, note);
    }
  }

  return y + SECTION_GAP;
}

function drawCategorySection(
  doc: jsPDF,
  group: CategoryGroup,
  startY: number,
  layout: BodyLayout,
  orderableTests: OrderableTest[],
  patient: ReportPatientContext
): number {
  let y = ensureVerticalSpace(doc, startY, CATEGORY_GAP + ROW_HEIGHT * 4, layout);
  if (startY > layout.margin + 4) {
    y += CATEGORY_GAP;
  }

  doc.setFont(FONT, 'bold');
  doc.setFontSize(TITLE_SIZE + 0.5);
  doc.text(group.category.toUpperCase(), layout.margin, y);
  y += 3.5;

  for (const test of group.tests) {
    y = drawTestSection(doc, test, y, layout, orderableTests, patient);
  }

  return y;
}

/**
 * Draws all order test results below the header separator.
 */
export function drawLabReportBody(
  doc: jsPDF,
  reportData: LabReportPayload,
  startY: number,
  margin: number,
  orderableTests: OrderableTest[] = [],
  onNewPage?: (doc: jsPDF) => number
): number {
  const layout = getBodyLayout(doc, margin, onNewPage);
  const patient = reportPatientFromPayload(reportData);
  let y = startY + 4;

  if (reportData.testResults.length === 0) {
    doc.setFont(FONT, 'normal');
    doc.setFontSize(TABLE_SIZE);
    doc.text('No active tests on this order.', layout.margin, y);
    return y + ROW_HEIGHT;
  }

  const groups = groupTestsByCategory(reportData.testResults);
  for (const group of groups) {
    y = drawCategorySection(doc, group, y, layout, orderableTests, patient);
  }

  return y;
}
