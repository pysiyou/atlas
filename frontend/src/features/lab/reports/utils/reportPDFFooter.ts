/**
 * PDF report signature section and page footers.
 */

import type jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { ReportData, ReportTemplate } from '../types';

export function drawSignatureAndPageFooters(
  doc: jsPDF,
  reportData: ReportData,
  template: ReportTemplate,
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number
): void {
  let yPosition = startY;

  if (template.includeSignature) {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }
    yPosition += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, yPosition, pageWidth / 2 - 10, yPosition);
    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const lastTest = reportData.testResults[reportData.testResults.length - 1];
    if (lastTest?.validatedAt) {
      let validatedByName = 'N/A';
      if (
        lastTest.validatedByName &&
        lastTest.validatedByName !== 'N/A' &&
        lastTest.validatedByName !== 'Unknown'
      ) {
        validatedByName = lastTest.validatedByName;
      } else if (lastTest.validatedBy) {
        validatedByName = lastTest.validatedBy;
      } else {
        validatedByName = '-';
      }
      doc.text(`Validated by: ${validatedByName}`, margin, yPosition);
      yPosition += 5;
      doc.text(
        `Date: ${format(new Date(lastTest.validatedAt), 'yyyy-MM-dd hh:mm a')}`,
        margin,
        yPosition
      );
    }
  }

  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    const footerText = `${template.footerText} Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`;
    const footerLines = doc.splitTextToSize(footerText, pageWidth - margin * 2);
    doc.text(footerLines, pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 5, pageHeight - 8, {
      align: 'right',
    });
  }
}
