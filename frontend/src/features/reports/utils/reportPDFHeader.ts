/**
 * Hospital-style lab report header — request metadata left, patient identity right.
 */

import { format, isValid, parseISO } from 'date-fns';
import type jsPDF from 'jspdf';
import { companyConfig } from '@/config/company';
import { displayId } from '@/utils/id';
import type { LabReportPayload } from '../types';

const FONT = 'helvetica';
const FONT_SIZE = 9;
const PATIENT_NAME_SIZE = 10;
const LINE_HEIGHT = 4.8;
const COLUMN_GAP = 8;
const EMPTY_VALUE = '—';

const LEFT_LABELS = {
  department: 'Department',
  request: 'Request',
  collectedAt: 'Collection Date',
  printedAt: 'Print Date',
  acceptedAt: 'Lab Acceptance',
  prescriber: 'Prescriber',
} as const;

const RIGHT_LABELS = {
  patient: 'Patient',
  dateOfBirth: 'Date of Birth',
  age: 'Age',
  sex: 'Sex',
  mrn: 'MRN',
} as const;

export interface LabReportHeaderLayout {
  margin: number;
  pageWidth: number;
}

export interface LabReportHeaderPageInfo {
  pageNumber: number;
  pageCount: number;
}

/**
 * Parses an ISO/date value into a valid Date, or null when missing/invalid.
 */
function parseHeaderDate(dateString?: string | Date | null): Date | null {
  if (!dateString) return null;
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return isValid(date) ? date : null;
  } catch {
    return null;
  }
}

/** Header date: `dd/MM/yyyy`. */
export function formatHeaderDate(dateString?: string | Date | null): string {
  const date = parseHeaderDate(dateString);
  if (!date) return '';
  return format(date, 'dd/MM/yyyy');
}

/** Header clock: `HH:mm`. */
export function formatHeaderClock(dateString?: string | Date | null): string {
  const date = parseHeaderDate(dateString);
  if (!date) return '';
  return format(date, 'HH:mm');
}

/**
 * Header datetime matching the reference layout: `dd/MM/yyyy Time: HH:mm`.
 */
export function formatHeaderDateTime(dateString?: string | Date | null): string {
  const datePart = formatHeaderDate(dateString);
  const timePart = formatHeaderClock(dateString);
  if (datePart && timePart) return `${datePart} Time: ${timePart}`;
  return datePart || timePart;
}

/**
 * Request value: `{orderId} of {dd/MM/yyyy} Time: {HH:mm}`.
 */
export function formatRequestValue(
  orderId: number,
  dateString?: string | Date | null
): string {
  if (!Number.isInteger(orderId) || orderId < 0) return EMPTY_VALUE;
  const id = displayId.order(orderId);
  const dateTime = formatHeaderDateTime(dateString);
  return dateTime ? `${id} of ${dateTime}` : id;
}

function genderLetter(gender?: string): string {
  if (!gender) return '';
  const normalized = gender.toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'M';
  if (normalized === 'female' || normalized === 'f') return 'F';
  return gender.charAt(0).toUpperCase();
}

function resolveDepartmentName(): string {
  const city = companyConfig.getContact().address.city?.trim();
  if (city) return city;
  return companyConfig.getName();
}

function resolvePrescriber(reportData: LabReportPayload): string {
  const raw = reportData.order.referringPhysician?.trim();
  return raw || EMPTY_VALUE;
}

function displayOrEmpty(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : EMPTY_VALUE;
}

/**
 * Truncates text with an ellipsis so it fits `maxWidth` in the current font.
 */
function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  if (maxWidth <= 0) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  const ellipsis = '...';
  const ellipsisWidth = doc.getTextWidth(ellipsis);
  if (ellipsisWidth >= maxWidth) return '';
  let next = text;
  while (next.length > 0 && doc.getTextWidth(next) + ellipsisWidth > maxWidth) {
    next = next.slice(0, -1);
  }
  return next.length > 0 ? `${next}${ellipsis}` : '';
}

/**
 * Draws `Label: Value` at (x, y) and returns the x after the last character.
 */
function drawLabeledValue(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  options: { maxWidth?: number; valueSize?: number } = {}
): number {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);
  const labelText = `${label}: `;
  doc.text(labelText, x, y);
  const valueX = x + doc.getTextWidth(labelText);
  const valueSize = options.valueSize ?? FONT_SIZE;
  doc.setFontSize(valueSize);
  const remainingWidth =
    options.maxWidth != null
      ? Math.max(options.maxWidth - (valueX - x), 4)
      : undefined;
  const fitted =
    remainingWidth != null ? fitText(doc, value, remainingWidth) : value;
  doc.text(fitted, valueX, y);
  return valueX + doc.getTextWidth(fitted);
}

export interface LabReportHeaderField {
  label: string;
  value: string;
  valueSize?: number;
}

export interface LabReportHeaderModel {
  left: LabReportHeaderField[];
  right: LabReportHeaderField[][];
}

/**
 * Builds the printable header rows. `printedAt` is injected so tests can freeze print time.
 */
export function buildLabReportHeaderModel(
  reportData: LabReportPayload,
  printedAt: Date = new Date()
): LabReportHeaderModel {
  const registeredAt =
    reportData.timestamps?.registeredAt ??
    reportData.order.orderDate ??
    reportData.order.createdAt;
  const collectedAt =
    reportData.timestamps?.collectedAt ?? reportData.sampleCollection?.collectedAt;
  const acceptedAt = reportData.timestamps?.acceptedAt ?? collectedAt;

  const patientName = displayOrEmpty(reportData.patientName?.toUpperCase());
  const dateOfBirth = displayOrEmpty(formatHeaderDate(reportData.patientDob));
  const sex = genderLetter(reportData.patientGender) || EMPTY_VALUE;
  const dobRow: LabReportHeaderField[] = [
    { label: RIGHT_LABELS.dateOfBirth, value: dateOfBirth },
  ];
  if (reportData.patientAge !== undefined && reportData.patientAge >= 0) {
    dobRow.push({ label: RIGHT_LABELS.age, value: `${reportData.patientAge} Years` });
  }

  return {
    left: [
      { label: LEFT_LABELS.department, value: resolveDepartmentName() },
      {
        label: LEFT_LABELS.request,
        value: formatRequestValue(reportData.order.orderId, registeredAt),
      },
      {
        label: LEFT_LABELS.collectedAt,
        value: displayOrEmpty(formatHeaderDateTime(collectedAt)),
      },
      {
        label: LEFT_LABELS.printedAt,
        value: formatHeaderDateTime(printedAt),
      },
      {
        label: LEFT_LABELS.acceptedAt,
        value: displayOrEmpty(formatHeaderDateTime(acceptedAt)),
      },
      { label: LEFT_LABELS.prescriber, value: resolvePrescriber(reportData) },
    ],
    right: [
      [{ label: RIGHT_LABELS.patient, value: patientName, valueSize: PATIENT_NAME_SIZE }],
      dobRow,
      [{ label: RIGHT_LABELS.sex, value: sex }],
      [{ label: RIGHT_LABELS.mrn, value: displayId.patient(reportData.patientId) }],
    ],
  };
}

function drawHeaderRule(doc: jsPDF, y: number, margin: number, pageWidth: number): void {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.45);
  doc.line(margin, y, pageWidth - margin, y);
}

/**
 * Renders the two-column identity header and the rule beneath it.
 */
export function drawLabReportHeader(
  doc: jsPDF,
  reportData: LabReportPayload,
  margin: number
): { layout: LabReportHeaderLayout; endY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - margin * 2;
  const leftWidth = contentWidth * 0.54;
  const rightX = margin + leftWidth + COLUMN_GAP;
  const rightWidth = Math.max(contentWidth - leftWidth - COLUMN_GAP, 40);
  const model = buildLabReportHeaderModel(reportData);
  const rowCount = Math.max(model.left.length, model.right.length);

  let y = margin;
  for (let index = 0; index < rowCount; index += 1) {
    const leftField = model.left[index];
    if (leftField) {
      drawLabeledValue(doc, margin, y, leftField.label, leftField.value, {
        maxWidth: leftWidth,
        valueSize: leftField.valueSize,
      });
    }

    const rightFields = model.right[index] ?? [];
    let cursorX = rightX;
    const lastRightIndex = rightFields.length - 1;
    rightFields.forEach((field, fieldIndex) => {
      const remaining = rightX + rightWidth - cursorX;
      if (remaining < 8) return;
      const fieldMaxWidth =
        fieldIndex === lastRightIndex
          ? remaining
          : Math.min(remaining, rightWidth * 0.62);
      cursorX =
        drawLabeledValue(doc, cursorX, y, field.label, field.value, {
          maxWidth: fieldMaxWidth,
          valueSize: field.valueSize,
        }) + 5;
    });
    y += LINE_HEIGHT;
  }
  y += 1.2;

  drawHeaderRule(doc, y, margin, pageWidth);

  return {
    layout: { margin, pageWidth },
    endY: y + 2,
  };
}

/**
 * Draws `Page n / total` in the bottom-right footer.
 */
export function drawLabReportPageNumber(
  doc: jsPDF,
  layout: LabReportHeaderLayout,
  pageInfo: LabReportHeaderPageInfo
): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = pageHeight - Math.max(layout.margin - 4, 8);
  doc.setFont(FONT, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Page ${pageInfo.pageNumber} / ${pageInfo.pageCount}`,
    layout.pageWidth - layout.margin,
    y,
    { align: 'right' }
  );
}
