/**
 * Lab report PDF body — results grouped by exam category (validation-style grid, no flags).
 */

import type jsPDF from 'jspdf';
import type { Gender, Test, TestParameter } from '@/types';
import { catalogParametersByCode } from '@/features/catalog/testLookup';
import { getParameterReferenceIntervalLines } from '@/features/lab/utils/labResult';
import type { LabReportPayload } from '../types';
import { RESULT_NOT_AVAILABLE } from '../types';

const FONT = 'courier';
const TITLE_SIZE = 11;
const SUBTITLE_SIZE = 9;
const TABLE_SIZE = 9;
const TABLE_HEAD_SIZE = 8;
/** Sex labels beside reference range values (Male / Female). */
const REFERENCE_LABEL_SIZE = 7;
const NOTES_SIZE = 8;

const ROW_HEIGHT = 4.8;
/** Tighter line spacing for multi-line reference cells (Male / Female pairs). */
const REFERENCE_LINE_HEIGHT = 4.1;
const SECTION_GAP = 6;
const CATEGORY_GAP = 8;
const TABLE_HEAD_GAP = 2;

const BOTTOM_MARGIN = 18;
/** Gap between value / unit / status sub-columns inside REFERENCE INTERVAL labels. */
const RESULT_SUBCOL_GAP = 2;
/** Tight gap after result value before unit (matches preview inline-flex). */
const RESULT_INLINE_GAP = 1;

const COLOR_TEXT = { r: 0, g: 0, b: 0 } as const;
const COLOR_UNIT = { r: 107, g: 114, b: 128 } as const;
const COLOR_ABNORMAL = { r: 234, g: 88, b: 12 } as const;
const COLOR_CRITICAL = { r: 220, g: 38, b: 38 } as const;

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
  colResult: number;
  colReference: number;
  colParameterW: number;
  colResultW: number;
  colReferenceW: number;
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

function getBodyLayout(doc: jsPDF, margin: number): BodyLayout {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;

  const colParameterW = contentWidth * 0.4;
  const colResultW = contentWidth * 0.32;
  const colReferenceW = contentWidth * 0.28;

  return {
    margin,
    pageWidth,
    pageHeight,
    contentWidth,
    colParameter: margin,
    colResult: margin + colParameterW,
    colReference: margin + colParameterW + colResultW,
    colParameterW,
    colResultW,
    colReferenceW,
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

function resultStatusLabel(status?: string): string | null {
  if (!status || status === 'normal') return null;
  if (status === 'critical' || status === 'critical-high' || status === 'critical-low') {
    return 'Critical';
  }
  if (status === 'high') return 'High';
  if (status === 'low') return 'Low';
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

interface ResultSubColumnLayout {
  unitStartX: number;
  statusStartX: number;
}

interface ReferenceSubColumnLayout {
  labelStartX: number;
}

interface ReportPatientContext {
  gender?: Gender;
  age?: number;
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

/** Aligned unit + status columns within RESULT (values stay left at colResult). */
function computeResultSubColumnLayout(
  doc: jsPDF,
  layout: BodyLayout,
  parameters: ReportParameter[]
): ResultSubColumnLayout {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(TABLE_SIZE);

  let maxValueWidth = 0;
  let maxUnitWidth = 0;

  for (const parameter of parameters) {
    maxValueWidth = Math.max(maxValueWidth, doc.getTextWidth(resultValueText(parameter)));
    const unit = resultUnitText(parameter);
    if (unit) {
      maxUnitWidth = Math.max(maxUnitWidth, doc.getTextWidth(formatUnitForPdf(unit)));
    }
  }

  const unitStartX = layout.colResult + maxValueWidth + RESULT_INLINE_GAP;
  const statusStartX = unitStartX + maxUnitWidth + RESULT_INLINE_GAP;

  return { unitStartX, statusStartX };
}

/** Value / Male|Female label columns within REFERENCE INTERVAL (matches preview grid). */
function computeReferenceSubColumnLayout(
  doc: jsPDF,
  layout: BodyLayout,
  test: ReportTest,
  catalogParameters: Record<string, TestParameter>,
  patient: ReportPatientContext
): ReferenceSubColumnLayout {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(TABLE_SIZE);

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

  const labelStartX = layout.colReference + maxValueWidth + RESULT_SUBCOL_GAP;
  return { labelStartX };
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
  return lineCount * REFERENCE_LINE_HEIGHT;
}

function drawReferenceCell(
  doc: jsPDF,
  layout: BodyLayout,
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
  doc.setFontSize(TABLE_SIZE);
  setTextColor(doc, COLOR_UNIT);

  const lineHeight = lines.length > 1 ? REFERENCE_LINE_HEIGHT : ROW_HEIGHT;
  for (let i = 0; i < lines.length; i += 1) {
    const lineY = y + i * lineHeight;
    doc.setFontSize(TABLE_SIZE);
    doc.text(lines[i].value, layout.colReference, lineY, { align: 'left' });
    const label = lines[i].label;
    if (label) {
      doc.setFontSize(REFERENCE_LABEL_SIZE);
      doc.text(label, subColumns.labelStartX, lineY, { align: 'left' });
    }
  }

  doc.setFontSize(TABLE_SIZE);
  setTextColor(doc, COLOR_TEXT);
  return lines.length;
}

function setTextColor(doc: jsPDF, color: { r: number; g: number; b: number }): void {
  doc.setTextColor(color.r, color.g, color.b);
}

/** Value left-aligned; unit and status in shared sub-columns per exam table. */
function drawResultCell(
  doc: jsPDF,
  layout: BodyLayout,
  y: number,
  parameter: ReportParameter,
  subColumns: ResultSubColumnLayout
): number {
  const value = resultValueText(parameter);
  const unit = resultUnitText(parameter);
  const unitText = unit ? formatUnitForPdf(unit) : undefined;
  const statusLabel = resultStatusLabel(parameter.status);
  const abnormal = isAbnormalStatus(parameter.status);
  const statusColor = isCriticalStatus(parameter.status) ? COLOR_CRITICAL : COLOR_ABNORMAL;

  doc.setFont(FONT, 'normal');
  doc.setFontSize(TABLE_SIZE);

  if (abnormal) {
    setTextColor(doc, statusColor);
  } else {
    setTextColor(doc, COLOR_TEXT);
  }
  doc.text(value, layout.colResult, y, { align: 'left' });

  if (unitText) {
    setTextColor(doc, COLOR_UNIT);
    doc.text(unitText, subColumns.unitStartX, y, { align: 'left' });
  }

  if (statusLabel) {
    setTextColor(doc, statusColor);
    doc.text(statusLabel, subColumns.statusStartX, y, { align: 'left' });
  }

  setTextColor(doc, COLOR_TEXT);
  return 1;
}

function drawTableHeader(doc: jsPDF, y: number, layout: BodyLayout): number {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(TABLE_HEAD_SIZE);
  doc.setTextColor(107, 114, 128);
  doc.text('PARAMETER', layout.colParameter, y);
  doc.text('RESULT', layout.colResult, y);
  doc.text('REFERENCE INTERVAL', layout.colReference, y);
  doc.setTextColor(0, 0, 0);
  return y + TABLE_HEAD_GAP + ROW_HEIGHT;
}

function drawParameterRow(
  doc: jsPDF,
  y: number,
  layout: BodyLayout,
  parameter: ReportParameter,
  resultSubColumns: ResultSubColumnLayout,
  referenceSubColumns: ReferenceSubColumnLayout,
  catalogParameters: Record<string, TestParameter>,
  patient: ReportPatientContext
): number {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(TABLE_SIZE);

  const nameLines = doc.splitTextToSize(parameter.name, layout.colParameterW - 1);
  drawResultCell(doc, layout, y, parameter, resultSubColumns);
  const refLineCount = drawReferenceCell(
    doc,
    layout,
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

function drawTestSection(
  doc: jsPDF,
  test: ReportTest,
  startY: number,
  layout: BodyLayout,
  catalogTests: Test[],
  patient: ReportPatientContext
): number {
  let y = ensureVerticalSpace(doc, startY, SECTION_GAP + ROW_HEIGHT * 3, layout);
  y += SECTION_GAP * 0.5;

  const title = `${test.testName} (${test.testCode})`;
  doc.setFont(FONT, 'bold');
  doc.setFontSize(TITLE_SIZE);
  doc.text(title, layout.margin, y);
  y += 5;

  if (test.methodology) {
    doc.setFont(FONT, 'normal');
    doc.setFontSize(SUBTITLE_SIZE);
    doc.text(`Method: ${test.methodology}`, layout.margin, y);
    y += 5;
  }

  y = ensureVerticalSpace(doc, y, ROW_HEIGHT * 2, layout);
  y = drawTableHeader(doc, y, layout);

  const catalogParameters = catalogParametersByCode(test.testCode, catalogTests);
  const resultSubColumns = computeResultSubColumnLayout(doc, layout, test.parameters);
  const referenceSubColumns = computeReferenceSubColumnLayout(
    doc,
    layout,
    test,
    catalogParameters,
    patient
  );

  for (const parameter of test.parameters) {
    const refLines = referenceLineCount(parameter, catalogParameters, patient);
    const neededHeight = Math.max(ROW_HEIGHT * 2, referenceBlockHeight(refLines));
    y = ensureVerticalSpace(doc, y, neededHeight, layout);
    y = drawParameterRow(
      doc,
      y,
      layout,
      parameter,
      resultSubColumns,
      referenceSubColumns,
      catalogParameters,
      patient
    );
  }

  const notes = [test.technicianNotes?.trim(), test.validationNotes?.trim()].filter(
    (note): note is string => Boolean(note)
  );
  if (notes.length > 0) {
    y = ensureVerticalSpace(doc, y, ROW_HEIGHT * 2, layout);
    y += 2;
    doc.setFont(FONT, 'normal');
    doc.setFontSize(NOTES_SIZE);
    doc.setTextColor(55, 65, 81);
    for (const note of notes) {
      const lines = doc.splitTextToSize(note, layout.contentWidth);
      for (const line of lines) {
        y = ensureVerticalSpace(doc, y, ROW_HEIGHT, layout);
        doc.text(line, layout.margin, y);
        y += ROW_HEIGHT;
      }
    }
    doc.setTextColor(0, 0, 0);
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
  y += CATEGORY_GAP;

  doc.setFont(FONT, 'bold');
  doc.setFontSize(TITLE_SIZE);
  doc.text(group.category.toUpperCase(), layout.margin, y);
  y += 6;

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
