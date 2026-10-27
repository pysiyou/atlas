/**
 * Lab report PDF header — left column (lab / order) and right column (patient).
 * Each row: fixed-width label + bold value.
 */

import { format } from 'date-fns';
import type jsPDF from 'jspdf';
import { buildReportHeaderViewModel, type ReportHeaderSource } from '@/utils/presentation';
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

function labPayloadToHeaderSource(reportData: LabReportPayload): ReportHeaderSource {
  const order = reportData.order as OrderWithPatientContact;
  return {
    patientId: reportData.patientId,
    patientName: reportData.patientName,
    patientDob: reportData.patientDob,
    patientAge: reportData.patientAge,
    patientGender: reportData.patientGender,
    patientEmail: reportData.patientEmail,
    order: {
      orderId: order.orderId,
      orderDate: order.orderDate,
      createdAt: order.createdAt,
      referentDoctorName: order.referentDoctorName,
      scheduledCollectionTime: order.scheduledCollectionTime,
      patientEmail: order.patientEmail,
    },
    timestamps: reportData.timestamps,
    sampleCollection: reportData.sampleCollection,
  };
}

function formatLabel(label: string, widthChars: number): string {
  return `${label.padEnd(widthChars, ' ')} :`;
}

function formatAtFromDate(date: Date): string {
  return `${format(date, 'dd/MM/yyyy')} at: ${format(date, 'HH:mm')}`;
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
  const vm = buildReportHeaderViewModel(labPayloadToHeaderSource(reportData));

  return [
    {
      label: LEFT_LABELS.branch,
      value: vm.branchName,
      highlightValue: true,
    },
    {
      label: LEFT_LABELS.order,
      value: vm.orderDisplay,
    },
    {
      label: LEFT_LABELS.sampling,
      value: vm.samplingDisplay,
    },
    {
      label: LEFT_LABELS.printingDate,
      value: formatAtFromDate(new Date()),
    },
    {
      label: LEFT_LABELS.referentDoctor,
      value: vm.referentDoctor,
    },
  ];
}

function buildRightColumnRows(reportData: LabReportPayload): HeaderFieldRow[] {
  const vm = buildReportHeaderViewModel(labPayloadToHeaderSource(reportData));

  return [
    {
      label: RIGHT_LABELS.patient,
      value: vm.patientDisplay,
    },
    {
      label: RIGHT_LABELS.birthday,
      value: vm.birthdayDisplay,
    },
    {
      label: RIGHT_LABELS.sex,
      value: vm.sexDisplay,
    },
    {
      label: RIGHT_LABELS.email,
      value: vm.emailDisplay,
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
