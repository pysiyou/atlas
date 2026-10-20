/** Lab report PDF — printable export (header + body; body expanded incrementally). */
import type jsPDF from 'jspdf';
import { companyConfig } from '@/config';
import type { Test } from '@/types';
import type { LabReportPayload, ReportTemplate } from '../types';
import { drawLabReportBody } from './reportPDFBody';
import {
  drawLabReportHeader,
  drawLabReportPageNumber,
  type LabReportHeaderLayout,
} from './reportPDFHeader';

const MARGIN = 12.7;

export function getDefaultTemplate(): ReportTemplate {
  const reports = companyConfig.getReports();
  return {
    name: companyConfig.getFullName(),
    headerText: reports.headerText,
    footerText: reports.footerText,
    includeSignature: reports.includeSignature,
  };
}

function stampPageNumbers(doc: jsPDF, layout: LabReportHeaderLayout): void {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawLabReportPageNumber(doc, layout, { pageNumber: page, pageCount });
  }
}

/**
 * Generate a lab report PDF. Dynamically imports jsPDF to keep the bundle split.
 */
export async function generateLabReport(
  reportData: LabReportPayload,
  _template: ReportTemplate = getDefaultTemplate(),
  catalogTests: Test[] = []
): Promise<jsPDF> {
  const { default: JsPDF } = await import('jspdf');
  const doc = new JsPDF();

  const { layout, endY } = drawLabReportHeader(doc, reportData, MARGIN);
  drawLabReportBody(doc, reportData, endY, MARGIN, catalogTests, nextDoc => {
    const nextHeader = drawLabReportHeader(nextDoc, reportData, MARGIN);
    return nextHeader.endY;
  });
  stampPageNumbers(doc, layout);

  return doc;
}

/** Trigger a browser download for the generated PDF. */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
