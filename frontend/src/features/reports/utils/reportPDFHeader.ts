/**
 * Lab report PDF header — left column (lab / order) and right column (patient).
 * Each row: fixed-width label + bold value.
 */

import { format, isValid, parseISO } from 'date-fns';
import type jsPDF from 'jspdf';
import { companyConfig } from '@/config';
import { displayId } from '@/utils';
import type { LabReportPayload } from '../types';

const FONT = 'courier';
/** Same 7pt as the result table in reportPDFBody. */
const FONT_SIZE = 7;
const LINE_HEIGHT = 4;

const LEFT_LABEL_CHARS = 15;
const RIGHT_LABEL_CHARS = 10;

const LEFT_LABELS = {
  branch: 'Branch',
  order: 'Order',
  sampling: 'Sampling',
  printingDate: 'Printing date',
  referentDoctor: 'Referent doctor',
} as const;

const RIGHT_LABELS = {
  patient: 'Patient',
  birthday: 'Birthday',
  sex: 'Sex',
  email: 'Email',
} as const;

interface HeaderFieldRow {
  label: string;
  value: string;
  highlightValue?: boolean;
}

export interface LabReportHeaderLayout {
  margin: number;
  pageWidth: number;
  leftX: number;
  rightX: number;
  rightEdge: number;
  leftValueX: number;
  rightValueX: number;
  referrerRowY: number;
}

export interface LabReportPageInfo {
  pageNumber: number;
  pageCount: number;
}

type OrderWithPatientContact = LabReportPayload['order'] & {
  patientEmail?: string;
};

function formatLabel(label: string, widthChars: number): string {
  return `${label.padEnd(widthChars, ' ')} :`;
}

function parseReportInstant(dateString?: string | null): Date | null {
  if (!dateString) return null;
  try {
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function formatReportDate(dateString?: string | null): string {
  const parsed = parseReportInstant(dateString);
  return parsed ? format(parsed, 'dd/MM/yyyy') : '';
}

function formatReportClock(dateString?: string | null): string {
  const parsed = parseReportInstant(dateString);
  return parsed ? format(parsed, 'HH:mm') : '';
}

/** `on: dd/MM/yyyy at: HH:mm` */
function formatOnAt(dateString?: string | null): string {
  const datePart = formatReportDate(dateString);
  const timePart = formatReportClock(dateString);
  if (datePart && timePart) return `on: ${datePart} at: ${timePart}`;
  if (datePart) return `on: ${datePart}`;
  if (timePart) return `at: ${timePart}`;
  return '';
}

/** `dd/MM/yyyy at: HH:mm` */
function formatAtDateTime(dateString?: string | null): string {
  const datePart = formatReportDate(dateString);
  const timePart = formatReportClock(dateString);
  if (datePart && timePart) return `${datePart} at: ${timePart}`;
  return datePart || timePart;
}

function formatAtFromDate(date: Date): string {
  return `${format(date, 'dd/MM/yyyy')} at: ${format(date, 'HH:mm')}`;
}

function genderLetter(gender?: string): string {
  if (!gender) return '';
  const normalized = gender.toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'M';
  if (normalized === 'female' || normalized === 'f') return 'F';
  return gender.charAt(0).toUpperCase();
}

function resolveBranchName(): string {
  const city = companyConfig.getContact().address.city?.trim();
  if (city) return city;
  return companyConfig.getName();
}

function resolveRegisteredAt(reportData: LabReportPayload): string | undefined {
  return (
    reportData.timestamps?.registeredAt ??
    reportData.order.orderDate ??
    reportData.order.createdAt
  );
}

function resolveCollectedAt(reportData: LabReportPayload): string | undefined {
  return (
    reportData.timestamps?.collectedAt ??
    reportData.sampleCollection?.collectedAt ??
    reportData.timestamps?.acceptedAt ??
    reportData.order.scheduledCollectionTime
  );
}

function resolveReferrer(reportData: LabReportPayload): string {
  return reportData.order.referringPhysician?.trim() ?? '';
}

function resolvePatientEmail(reportData: LabReportPayload): string {
  const order = reportData.order as OrderWithPatientContact;
  return reportData.patientEmail?.trim() || order.patientEmail?.trim() || '';
}

function formatPatientNameAndCode(reportData: LabReportPayload): string {
  const code = displayId.patient(reportData.patientId);
  return `${reportData.patientName}(Internal: ${code})`;
}

function formatBirthdayValue(reportData: LabReportPayload): string {
  const dobPart = reportData.patientDob
    ? formatReportDate(reportData.patientDob)
    : '';
  const age = reportData.patientAge;
  if (dobPart && age !== undefined) {
    const ageLabel = age === 1 ? '1 year old' : `${age} years old`;
    return `${dobPart} (${ageLabel})`;
  }
  if (dobPart) return dobPart;
  if (age !== undefined) {
    const ageLabel = age === 1 ? '1 year old' : `${age} years old`;
    return `(${ageLabel})`;
  }
  return '';
}

function formatOrderValue(reportData: LabReportPayload): string {
  const orderId = displayId.order(reportData.order.orderId);
  const when = formatOnAt(resolveRegisteredAt(reportData));
  return when ? `${orderId} ${when}` : orderId;
}

function measureValueStart(doc: jsPDF, labelChars: number): number {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(FONT_SIZE);
  return doc.getTextWidth(formatLabel('X'.repeat(labelChars), labelChars)) + 1.2;
}

function measureMaxBoldTextWidth(doc: jsPDF, values: string[]): number {
  doc.setFont(FONT, 'bold');
  doc.setFontSize(FONT_SIZE);
  let max = 0;
  for (const value of values) {
    if (!value) continue;
    max = Math.max(max, doc.getTextWidth(value));
  }
  return max;
}

/** Labels + values as one block, flush to the right page margin. */
function resolveRightColumnPositions(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  values: string[]
): { rightX: number; rightValueX: number; rightEdge: number } {
  const rightEdge = pageWidth - margin;
  const valueOffset = measureValueStart(doc, RIGHT_LABEL_CHARS);
  const maxValueWidth = measureMaxBoldTextWidth(doc, values) + 1;
  const blockWidth = valueOffset + maxValueWidth;
  const rightX = rightEdge - blockWidth;

  return {
    rightX,
    rightValueX: rightX + valueOffset,
    rightEdge,
  };
}

function resolveColumnPositions(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  rightColumnValues: string[]
): { leftX: number; leftValueX: number; rightX: number; rightValueX: number; rightEdge: number } {
  const leftX = margin;
  const leftValueX = leftX + measureValueStart(doc, LEFT_LABEL_CHARS);
  const right = resolveRightColumnPositions(doc, pageWidth, margin, rightColumnValues);

  return {
    leftX,
    leftValueX,
    ...right,
  };
}

function drawHeaderField(
  doc: jsPDF,
  colX: number,
  valueX: number,
  y: number,
  label: string,
  labelChars: number,
  value: string,
  options: { highlightValue?: boolean } = {}
): void {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text(formatLabel(label, labelChars), colX, y);

  if (!value) return;

  if (options.highlightValue) {
    doc.setFont(FONT, 'bold');
    const width = doc.getTextWidth(value) + 1.5;
    doc.setFillColor(235, 225, 248);
    doc.rect(valueX - 0.4, y - 2.2, width, 3, 'F');
  }

  doc.setFont(FONT, 'bold');
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text(value, valueX, y);
}

function buildLeftColumnRows(reportData: LabReportPayload): HeaderFieldRow[] {
  const collectedAt = resolveCollectedAt(reportData);
  const samplingValue = formatAtDateTime(collectedAt);

  return [
    {
      label: LEFT_LABELS.branch,
      value: resolveBranchName(),
      highlightValue: true,
    },
    {
      label: LEFT_LABELS.order,
      value: formatOrderValue(reportData),
    },
    {
      label: LEFT_LABELS.sampling,
      value: samplingValue,
    },
    {
      label: LEFT_LABELS.printingDate,
      value: formatAtFromDate(new Date()),
    },
    {
      label: LEFT_LABELS.referentDoctor,
      value: resolveReferrer(reportData),
    },
  ];
}

function buildRightColumnRows(reportData: LabReportPayload): HeaderFieldRow[] {
  return [
    {
      label: RIGHT_LABELS.patient,
      value: formatPatientNameAndCode(reportData),
    },
    {
      label: RIGHT_LABELS.birthday,
      value: formatBirthdayValue(reportData),
    },
    {
      label: RIGHT_LABELS.sex,
      value: genderLetter(reportData.patientGender),
    },
    {
      label: RIGHT_LABELS.email,
      value: resolvePatientEmail(reportData),
    },
  ];
}

/**
 * Renders the two-column lab report header.
 */
export function drawLabReportHeader(
  doc: jsPDF,
  reportData: LabReportPayload,
  margin: number
): { layout: LabReportHeaderLayout; endY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();
  const leftRows = buildLeftColumnRows(reportData);
  const rightRows = buildRightColumnRows(reportData);
  const rightColumnValues = rightRows.map(row => row.value);
  const { leftX, leftValueX, rightX, rightValueX, rightEdge } = resolveColumnPositions(
    doc,
    pageWidth,
    margin,
    rightColumnValues
  );
  const rowCount = Math.max(leftRows.length, rightRows.length);

  let y = margin;
  let referrerRowY = y;

  for (let index = 0; index < rowCount; index += 1) {
    const leftRow = leftRows[index];
    const rightRow = rightRows[index];

    if (leftRow) {
      if (leftRow.label === LEFT_LABELS.referentDoctor) {
        referrerRowY = y;
      }
      drawHeaderField(
        doc,
        leftX,
        leftValueX,
        y,
        leftRow.label,
        LEFT_LABEL_CHARS,
        leftRow.value,
        { highlightValue: leftRow.highlightValue }
      );
    }

    if (rightRow) {
      drawHeaderField(
        doc,
        rightX,
        rightValueX,
        y,
        rightRow.label,
        RIGHT_LABEL_CHARS,
        rightRow.value
      );
    }

    y += LINE_HEIGHT;
  }

  const layout: LabReportHeaderLayout = {
    margin,
    pageWidth,
    leftX,
    rightX,
    rightEdge,
    leftValueX,
    rightValueX,
    referrerRowY,
  };

  return { layout, endY: y + 2 };
}

/** Bottom-right page indicator: `Page x/y`. */
export function drawLabReportPageFooter(
  doc: jsPDF,
  margin: number,
  pageInfo: LabReportPageInfo
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const label = `Page ${pageInfo.pageNumber}/${pageInfo.pageCount}`;

  doc.setFont(FONT, 'normal');
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text(label, pageWidth - margin, pageHeight - margin / 2, { align: 'right' });
}
