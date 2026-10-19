/**
 * Legacy-style lab report header — left metadata block + right column anchored to page margin.
 */

import { format, isValid, parseISO } from 'date-fns';
import type jsPDF from 'jspdf';
import { companyConfig } from '@/config';
import { displayId } from '@/utils';
import type { LabReportPayload } from '../types';

const FONT = 'courier';
const FONT_SIZE = 8;
const LINE_HEIGHT = 5.2;

/** Character width for label text before ` :` (Courier is fixed-width). */
const LEFT_LABEL_CHARS = 11;
const RIGHT_LABEL_CHARS = 12;

const LEFT_LABELS = {
  patient: 'Patient',
  orderNo: 'Order No.',
  branch: 'Branch',
  address: 'Address',
  referrer: 'Referrer',
} as const;

const RIGHT_LABELS = {
  orderDate: 'Order Date',
  reportDate: 'Report Date',
  pageNumber: 'Page Number',
} as const;

export interface LabReportHeaderLayout {
  margin: number;
  pageWidth: number;
  leftX: number;
  rightX: number;
  rightEdge: number;
  leftValueX: number;
  rightValueX: number;
  pageNumberY: number;
  referrerRowY: number;
}

export interface LabReportHeaderPageInfo {
  pageNumber: number;
  pageCount: number;
}

function formatLabel(label: string, widthChars: number): string {
  return `${label.padEnd(widthChars, ' ')} :`;
}

function formatReportDate(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '';
  }
}

function formatReportClock(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return '';
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

/** Single header value: `dd/MM/yyyy HH:mm` (no separate time row). */
function formatReportDateTime(dateString?: string | null): string {
  const datePart = formatReportDate(dateString);
  const timePart = formatReportClock(dateString);
  if (datePart && timePart) return `${datePart} ${timePart}`;
  return datePart || timePart;
}

function genderSuffix(gender?: string): string {
  if (!gender) return '';
  const normalized = gender.toLowerCase();
  if (normalized === 'male' || normalized === 'm') return 'M';
  if (normalized === 'female' || normalized === 'f') return 'F';
  return gender.charAt(0).toUpperCase();
}

function formatPatientDemographics(reportData: LabReportPayload): string {
  const agePart =
    reportData.patientAge !== undefined ? `${reportData.patientAge}/` : '';
  const genderPart = genderSuffix(reportData.patientGender);
  const suffix =
    agePart || genderPart ? ` (${agePart}${genderPart})` : '';
  return `${reportData.patientName}${suffix}`;
}

function resolveBranchName(): string {
  const city = companyConfig.getContact().address.city?.trim();
  if (city) return city;
  return companyConfig.getName();
}

function resolveReferrer(reportData: LabReportPayload): string {
  const raw = reportData.order.referringPhysician?.trim();
  return raw || '-';
}

function measureValueStart(doc: jsPDF, labelChars: number): number {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(FONT_SIZE);
  const sample = formatLabel('X'.repeat(labelChars), labelChars);
  return doc.getTextWidth(sample) + 1.2;
}

/** Right column: labels + values flush to the right page margin. */
function resolveRightColumn(
  doc: jsPDF,
  pageWidth: number,
  margin: number
): { rightX: number; rightValueX: number; rightEdge: number } {
  const rightEdge = pageWidth - margin;
  doc.setFont(FONT, 'normal');
  doc.setFontSize(FONT_SIZE);

  const valueOffset = measureValueStart(doc, RIGHT_LABEL_CHARS);
  const sampleValues = ['14/10/2026 12:31', '1 / 999'];
  const maxValueWidth = sampleValues.reduce(
    (max, sample) => Math.max(max, doc.getTextWidth(sample)),
    0
  );
  const blockWidth = valueOffset + maxValueWidth + 1.5;
  const rightX = rightEdge - blockWidth;

  return {
    rightX,
    rightValueX: rightX + valueOffset,
    rightEdge,
  };
}

function drawLabel(doc: jsPDF, x: number, y: number, label: string, labelChars: number): void {
  doc.setFont(FONT, 'normal');
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text(formatLabel(label, labelChars), x, y);
}

function drawValue(
  doc: jsPDF,
  x: number,
  y: number,
  value: string,
  bold = false
): void {
  doc.setFont(FONT, bold ? 'bold' : 'normal');
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text(value, x, y);
}

function drawColumnField(
  doc: jsPDF,
  colX: number,
  valueX: number,
  y: number,
  label: string,
  labelChars: number,
  value: string,
  options: {
    boldValue?: boolean;
    highlightValue?: boolean;
  } = {}
): void {
  drawLabel(doc, colX, y, label, labelChars);
  if (options.highlightValue && value) {
    doc.setFont(FONT, 'bold');
    doc.setFontSize(FONT_SIZE);
    const width = doc.getTextWidth(value) + 1.5;
    doc.setFillColor(235, 225, 248);
    doc.rect(valueX - 0.4, y - 3.1, width, 4.2, 'F');
  }
  drawValue(doc, valueX, y, value, options.boldValue ?? false);
}

function drawPatientField(
  doc: jsPDF,
  colX: number,
  valueX: number,
  y: number,
  reportData: LabReportPayload
): void {
  drawLabel(doc, colX, y, LEFT_LABELS.patient, LEFT_LABEL_CHARS);
  const patientCode = displayId.patient(reportData.patientId);
  drawValue(doc, valueX, y, `${patientCode} `, false);
  const nameX = valueX + doc.getTextWidth(`${patientCode} `);
  drawValue(doc, nameX, y, formatPatientDemographics(reportData), true);
}

/**
 * Renders the reference-style header block.
 */
export function drawLabReportHeader(
  doc: jsPDF,
  reportData: LabReportPayload,
  margin: number,
  pageInfo: LabReportHeaderPageInfo
): { layout: LabReportHeaderLayout; endY: number } {
  const pageWidth = doc.internal.pageSize.getWidth();

  const leftX = margin;
  const leftValueX = leftX + measureValueStart(doc, LEFT_LABEL_CHARS);
  const { rightX, rightValueX, rightEdge } = resolveRightColumn(doc, pageWidth, margin);

  let y = margin;

  const registeredAt =
    reportData.timestamps?.registeredAt ??
    reportData.order.orderDate ??
    reportData.order.createdAt;
  const reportedAt = reportData.timestamps?.reportedAt;
  const address = reportData.sampleCollection?.address?.trim() ?? '';

  drawPatientField(doc, leftX, leftValueX, y, reportData);
  drawColumnField(
    doc,
    rightX,
    rightValueX,
    y,
    RIGHT_LABELS.orderDate,
    RIGHT_LABEL_CHARS,
    formatReportDateTime(registeredAt)
  );
  y += LINE_HEIGHT;

  drawColumnField(
    doc,
    leftX,
    leftValueX,
    y,
    LEFT_LABELS.orderNo,
    LEFT_LABEL_CHARS,
    displayId.order(reportData.order.orderId),
    { boldValue: true }
  );
  drawColumnField(
    doc,
    rightX,
    rightValueX,
    y,
    RIGHT_LABELS.reportDate,
    RIGHT_LABEL_CHARS,
    formatReportDateTime(reportedAt)
  );
  y += LINE_HEIGHT;

  drawColumnField(doc, leftX, leftValueX, y, LEFT_LABELS.branch, LEFT_LABEL_CHARS, resolveBranchName(), {
    boldValue: true,
    highlightValue: true,
  });
  const pageNumberY = y;
  drawColumnField(
    doc,
    rightX,
    rightValueX,
    y,
    RIGHT_LABELS.pageNumber,
    RIGHT_LABEL_CHARS,
    `${pageInfo.pageNumber} / ${pageInfo.pageCount}`
  );
  y += LINE_HEIGHT;

  drawColumnField(doc, leftX, leftValueX, y, LEFT_LABELS.address, LEFT_LABEL_CHARS, address);
  y += LINE_HEIGHT;

  const referrerRowY = y;
  drawColumnField(
    doc,
    leftX,
    leftValueX,
    y,
    LEFT_LABELS.referrer,
    LEFT_LABEL_CHARS,
    resolveReferrer(reportData),
    { boldValue: true }
  );
  y += LINE_HEIGHT;

  doc.setFont(FONT, 'bold');
  doc.setFontSize(FONT_SIZE);
  doc.setTextColor(0, 0, 0);
  doc.text('Final Report', leftX, y);
  y += LINE_HEIGHT;

  const layout: LabReportHeaderLayout = {
    margin,
    pageWidth,
    leftX,
    rightX,
    rightEdge,
    leftValueX,
    rightValueX,
    pageNumberY,
    referrerRowY,
  };

  return { layout, endY: y + 2 };
}

/**
 * Updates only the page-number field on an already-drawn header.
 */
export function drawLabReportPageNumber(
  doc: jsPDF,
  layout: LabReportHeaderLayout,
  pageInfo: LabReportHeaderPageInfo
): void {
  drawColumnField(
    doc,
    layout.rightX,
    layout.rightValueX,
    layout.pageNumberY,
    RIGHT_LABELS.pageNumber,
    RIGHT_LABEL_CHARS,
    `${pageInfo.pageNumber} / ${pageInfo.pageCount}`
  );
}
