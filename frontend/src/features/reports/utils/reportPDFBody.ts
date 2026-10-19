/**
 * Lab report PDF body — classic result table (gray value bars, aligned units, right-aligned ranges).
 */

import type jsPDF from 'jspdf';
import type { Gender, Test, TestParameter } from '@/types';
import { catalogParametersByCode } from '@/features/catalog/testLookup';
import { getParameterReferenceIntervalLines } from '@/features/lab/utils/labResult';
import type { LabReportPayload } from '../types';
import { RESULT_NOT_AVAILABLE } from '../types';

const FONT = 'courier';
const TITLE_SIZE = 7;
const SUBTITLE_SIZE = 7;
const TABLE_SIZE = 7;
/** Reference range numbers (right column). */
const REFERENCE_VALUE_SIZE = 6;
/** Sex labels beside reference range values (Male / Female). */
const REFERENCE_LABEL_SIZE = 5;
const NOTES_SIZE = 6;

const ROW_HEIGHT = 3.6;
/** Stacked Male / Female reference lines (minimal leading). */
const REFERENCE_PAIR_LINE_HEIGHT = 2.35;
const SECTION_GAP = 3.5;
const CATEGORY_GAP = 5;

const BOTTOM_MARGIN = 18;
const RESULT_BAR_PADDING = 0.6;
const RESULT_BAR_HEIGHT = 3.1;
/** Vertical offset from text baseline to top of result / note gray bar (mm). */
const RESULT_BAR_BASELINE_OFFSET = 0.9;
const COL_GAP = 2;
const FLAG_COLUMN_WIDTH = 3;
/** Indent before parameter / result rows under each exam (one tab). */
const RESULT_TAB_INDENT = 3.5;

const COLOR_TEXT = { r: 0, g: 0, b: 0 } as const;
const COLOR_UNIT = { r: 107, g: 114, b: 128 } as const;
const COLOR_ABNORMAL = { r: 234, g: 88, b: 12 } as const;
const COLOR_CRITICAL = { r: 220, g: 38, b: 38 } as const;
const COLOR_RESULT_BAR = { r: 232, g: 232, b: 232 } as const;
const COLOR_NOTE_BAR = { r: 232, g: 232, b: 232 } as const;

type ReportTest = LabReportPayload['testResults'][number];
type ReportParameter = ReportTest['parameters'][number];

interface CategoryGroup {
  category: string;
  tests: ReportTest[];
}

interface BodyLayout {
  margin: number;
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  colParameter: number;
  colParameterW: number;
  contentRight: number;
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
    colParameter: layout.margin + indent,
    colParameterW: Math.max(layout.colParameterW - indent, 20),
  };
}

function getBodyLayout(doc: jsPDF, margin: number): BodyLayout {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  const colParameterW = contentWidth * 0.36;

  return {
    margin,
    pageWidth,
    pageHeight,
    contentWidth,
    colParameter: margin,
    colParameterW,
    contentRight: margin + contentWidth,
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
  return layout.margin;
}

function resultValueText(parameter: ReportParameter): string {
  const raw = String(parameter.value ?? '').trim();
  if (!raw || raw === RESULT_NOT_AVAILABLE) {
    return RESULT_NOT_AVAILABLE;
  }
  return raw;
}

function resultUnitText(parameter: ReportParameter): string | undefined {
  const value = resultValueText(parameter);
  if (value === RESULT_NOT_AVAILABLE) return undefined;
  const unit = parameter.unit?.trim();
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
  parameters: ReportParameter[]
): ResultRowLayout {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(TABLE_SIZE);

  let maxValueWidth = 0;

  for (const parameter of parameters) {
    maxValueWidth = Math.max(maxValueWidth, doc.getTextWidth(resultValueText(parameter)));
  }

  const resultBarX = layout.colParameter + layout.colParameterW + COL_GAP;
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
  catalogParameters: Record<string, TestParameter>,
  patient: ReportPatientContext
): ReferenceSubColumnLayout {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(REFERENCE_VALUE_SIZE);

  let maxValueWidth = 0;

  for (const parameter of test.parameters) {
    const lines = getParameterReferenceIntervalLines(
      catalogParameters[parameter.code],
      parameter.referenceRange,
      patient
    );
    for (const line of lines) {
      maxValueWidth = Math.max(maxValueWidth, doc.getTextWidth(line.value));
    }
  }

  const valueRightX = layout.contentRight;
  const labelRightX = valueRightX - maxValueWidth - COL_GAP;

  return { valueRightX, labelRightX };
}

function referenceLineCount(
  parameter: ReportParameter,
  catalogParameters: Record<string, TestParameter>,
  patient: ReportPatientContext
): number {
  const lines = getParameterReferenceIntervalLines(
    catalogParameters[parameter.code],
    parameter.referenceRange,
    patient
  );
  return Math.max(lines.length, 1);
}

function referenceBlockHeight(lineCount: number): number {
  if (lineCount <= 1) return ROW_HEIGHT;
  return lineCount * REFERENCE_PAIR_LINE_HEIGHT;
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
  doc.setFillColor(COLOR_RESULT_BAR.r, COLOR_RESULT_BAR.g, COLOR_RESULT_BAR.b);
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
  parameter: ReportParameter,
  rowLayout: ResultRowLayout
): void {
  const value = resultValueText(parameter);
  const unit = resultUnitText(parameter);
  const unitText = unit ? formatUnitForPdf(unit) : undefined;
  const flag = resultFlagSymbol(parameter.status);
  const abnormal = isAbnormalStatus(parameter.status);
  const critical = isCriticalStatus(parameter.status);

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
  parameter: ReportParameter,
  subColumns: ReferenceSubColumnLayout,
  catalogParameters: Record<string, TestParameter>,
  patient: ReportPatientContext
): number {
  const lines = getParameterReferenceIntervalLines(
    catalogParameters[parameter.code],
    parameter.referenceRange,
    patient
  );

  doc.setFont(FONT, 'normal');

  const lineHeight = lines.length > 1 ? REFERENCE_PAIR_LINE_HEIGHT : 0;
  for (let i = 0; i < lines.length; i += 1) {
    const lineY = lines.length > 1 ? y + i * lineHeight : y;
    doc.setFontSize(REFERENCE_VALUE_SIZE);
    doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
    doc.text(lines[i].value, subColumns.valueRightX, lineY, { align: 'right' });
    const label = lines[i].label;
    if (label) {
      doc.setFontSize(REFERENCE_LABEL_SIZE);
      doc.setTextColor(COLOR_UNIT.r, COLOR_UNIT.g, COLOR_UNIT.b);
      doc.text(label, subColumns.labelRightX, lineY, { align: 'right' });
    }
  }

  doc.setFontSize(TABLE_SIZE);
  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  return lines.length;
}

function drawParameterRow(
  doc: jsPDF,
  y: number,
  layout: BodyLayout,
  parameter: ReportParameter,
  rowLayout: ResultRowLayout,
  referenceSubColumns: ReferenceSubColumnLayout,
  catalogParameters: Record<string, TestParameter>,
  patient: ReportPatientContext
): number {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(TABLE_SIZE);
  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);

  const nameLines = doc.splitTextToSize(parameter.name, layout.colParameterW - 1);
  drawResultCell(doc, y, parameter, rowLayout);
  const refLineCount = drawReferenceCell(
    doc,
    y,
    parameter,
    referenceSubColumns,
    catalogParameters,
    patient
  );

  const refHeight = referenceBlockHeight(refLineCount);
  const rowHeight = Math.max(nameLines.length * ROW_HEIGHT, ROW_HEIGHT, refHeight);

  for (let i = 0; i < nameLines.length; i += 1) {
    const lineY = y + i * ROW_HEIGHT;
    if (nameLines[i]) {
      doc.text(nameLines[i], layout.colParameter, lineY, { align: 'left' });
    }
  }

  return y + rowHeight;
}

function drawNoteBlock(doc: jsPDF, y: number, layout: BodyLayout, note: string): number {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(NOTES_SIZE);
  doc.setTextColor(COLOR_TEXT.r, COLOR_TEXT.g, COLOR_TEXT.b);
  const label = 'NOTE:';
  doc.text(label, layout.colParameter, y);

  const labelWidth = doc.getTextWidth(label) + COL_GAP;
  const barX = layout.colParameter + labelWidth;
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
  catalogTests: Test[],
  patient: ReportPatientContext
): number {
  let y = ensureVerticalSpace(doc, startY, ROW_HEIGHT * 3, layout);
  y += 2;

  const title = test.testName;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(TITLE_SIZE);
  doc.text(title, layout.margin, y);
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
  const catalogParameters = catalogParametersByCode(test.testCode, catalogTests);
  const rowLayout = computeResultRowLayout(doc, resultsLayout, test.parameters);
  const referenceSubColumns = computeReferenceSubColumnLayout(
    doc,
    resultsLayout,
    test,
    catalogParameters,
    patient
  );

  for (const parameter of test.parameters) {
    const refLines = referenceLineCount(parameter, catalogParameters, patient);
    const neededHeight = Math.max(ROW_HEIGHT * 2, referenceBlockHeight(refLines));
    y = ensureVerticalSpace(doc, y, neededHeight, resultsLayout);
    y = drawParameterRow(
      doc,
      y,
      resultsLayout,
      parameter,
      rowLayout,
      referenceSubColumns,
      catalogParameters,
      patient
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
  catalogTests: Test[],
  patient: ReportPatientContext
): number {
  let y = ensureVerticalSpace(doc, startY, CATEGORY_GAP + ROW_HEIGHT * 4, layout);
  if (startY > layout.margin + 4) {
    y += CATEGORY_GAP;
  }

  doc.setFont(FONT, 'bold');
  doc.setFontSize(TITLE_SIZE);
  doc.text(group.category.toUpperCase(), layout.margin, y);
  y += 3.5;

  for (const test of group.tests) {
    y = drawTestSection(doc, test, y, layout, catalogTests, patient);
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
  catalogTests: Test[] = []
): number {
  const layout = getBodyLayout(doc, margin);
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
    y = drawCategorySection(doc, group, y, layout, catalogTests, patient);
  }

  return y;
}
