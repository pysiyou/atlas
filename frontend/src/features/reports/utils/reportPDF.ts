/** Lab report PDF — printable export (header + body; body expanded incrementally). */
import type jsPDF from 'jspdf';
import { getBrandingPresentation, getCompanyFullName } from '@/config';
import type  { OrderableTest } from '@/types';
import type { LabReportPayload, ReportTemplate } from '@/types';
import { drawLabReportBody } from './reportPDFBody';
import { drawLabReportHeader, drawLabReportPageFooter } from './reportPDFHeader';

const MARGIN = 12.7;

export function getDefaultTemplate(): ReportTemplate {
  const reports = getBrandingPresentation().reports;
  return {
    name: getCompanyFullName(),
    headerText: reports.headerText,
    footerText: reports.footerText,
    includeSignature: reports.includeSignature,
  };
}

function drawBodySeparator(doc: jsPDF, startY: number, margin: number, pageWidth: number): void {
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(margin, startY, pageWidth - margin, startY);
}

function stampPageFooters(doc: jsPDF, margin: number): void {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawLabReportPageFooter(doc, margin, { pageNumber: page, pageCount });
  }
}

/**
 * Generate a lab report PDF. Dynamically imports jsPDF to keep the bundle split.
 */
export async function generateLabReport(
  reportData: LabReportPayload,
  _template: ReportTemplate = getDefaultTemplate(),
  orderableTests: OrderableTest[] = []
): Promise<jsPDF> {
  const { default: JsPDF } = await import('jspdf');
  const doc = new JsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const { endY } = drawLabReportHeader(doc, reportData, MARGIN);

  drawBodySeparator(doc, endY, MARGIN, pageWidth);
  drawLabReportBody(doc, reportData, endY, MARGIN, orderableTests, nextDoc => {
    const nextHeader = drawLabReportHeader(nextDoc, reportData, MARGIN);
    drawBodySeparator(
      nextDoc,
      nextHeader.endY,
      MARGIN,
      nextDoc.internal.pageSize.getWidth()
    );
    return nextHeader.endY;
  });
  stampPageFooters(doc, MARGIN);

  return doc;
}

/** Trigger a browser download for the generated PDF. */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
