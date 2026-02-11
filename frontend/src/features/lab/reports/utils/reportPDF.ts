/**
 * PDF Report Generation - Orchestrator and public API
 * Generates professional lab reports with jsPDF; layout split into reportPDFHeader, reportPDFResults, reportPDFFooter.
 */

import jsPDF from 'jspdf';
import type { ReportData, ReportTemplate } from '../types';
import { getDefaultTemplate } from './reportPDFHelpers';
import { drawReportHeader } from './reportPDFHeader';
import { drawTestResultsSection } from './reportPDFResults';
import { drawSignatureAndPageFooters } from './reportPDFFooter';

/**
 * Generate PDF report for lab results with company header, patient details, test results, and footer.
 */
export function generateLabReport(
  reportData: ReportData,
  template: ReportTemplate = getDefaultTemplate()
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = drawReportHeader(doc, reportData, template, margin);
  yPosition = drawTestResultsSection(
    doc,
    reportData,
    yPosition,
    margin,
    pageWidth,
    pageHeight
  );
  drawSignatureAndPageFooters(
    doc,
    reportData,
    template,
    yPosition,
    margin,
    pageWidth,
    pageHeight
  );

  return doc;
}

/** Re-export helpers for consumers that need template or formatting. */
export { getDefaultTemplate, formatReportTimestamp } from './reportPDFHelpers';

/**
 * Open PDF in new window for preview
 */
export function previewPDF(doc: jsPDF): void {
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  window.open(pdfUrl, '_blank');
}

/**
 * Download PDF file
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
