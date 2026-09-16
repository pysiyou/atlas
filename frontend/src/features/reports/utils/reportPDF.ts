/** PDF lab report generation — template, results tables, signature/footers, and public API. */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { companyConfig } from '@/config';
import type { ValidatedTestReportPayload, ReportTemplate } from '../types';
import { drawReportHeader } from './reportPDFHeader';

export function getDefaultTemplate(): ReportTemplate {
  const reports = companyConfig.getReports();
  return {
    name: companyConfig.getFullName(),
    headerText: reports.headerText,
    footerText: reports.footerText,
    includeSignature: reports.includeSignature,
  };
}

interface TableRow {
  investigation: string;
  result: string;
  referenceValue: string;
  unit: string;
  isSectionHeader?: boolean;
  isAbnormal?: boolean;
  hasCode?: boolean;
}

export function drawTestResultsSection(
  doc: jsPDF,
  reportData: ValidatedTestReportPayload,
  startY: number,
  margin: number,
  pageWidth: number,
  pageHeight: number
): number {
  let yPosition = startY;

  reportData.testResults.forEach(test => {
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${test.testName} (${test.testCode})`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 2;

    const sampleType = ((reportData.order.tests ?? [])[0]?.sampleType || 'N/A').toUpperCase();
    const tableData: TableRow[] = [
      { investigation: 'Primary Sample Type :', result: sampleType, referenceValue: '', unit: '' },
    ];

    test.parameters.forEach(param => {
      const resultValue = String(param.value);
      const isAbnormal = !!(param.status && param.status.toLowerCase() !== 'normal');
      const isSectionHeader =
        param.name === param.name.toUpperCase() &&
        param.name.length > 3 &&
        !param.name.includes(':');
      const referenceValue = param.referenceRange || '';
      const paramDisplayName = param.code ? `${param.name}\n${param.code}` : param.name;
      tableData.push({
        investigation: paramDisplayName,
        result: resultValue,
        referenceValue,
        unit: param.unit || '-',
        isSectionHeader,
        isAbnormal,
        hasCode: !!param.code,
      });
    });

    const tableBody = tableData.map(row => [
      row.investigation,
      row.result,
      row.referenceValue,
      row.unit,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['INVESTIGATION', 'RESULT', 'REFERENCE VALUE', 'UNIT']],
      body: tableBody,
      theme: 'plain',
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' },
        1: { cellWidth: 'auto', halign: 'left' },
        2: { cellWidth: 'auto', halign: 'left' },
        3: { cellWidth: 20, halign: 'right' },
      },
      styles: {
        lineColor: [220, 220, 220],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [250, 250, 250],
        textColor: [107, 114, 128],
        fontStyle: 'bold',
        fontSize: 9,
        lineWidth: 0.5,
        lineColor: [229, 231, 235],
      },
      bodyStyles: {
        fontSize: 9,
        lineWidth: 0.3,
        lineColor: [220, 220, 220],
        textColor: [31, 41, 55],
      },
      didParseCell: data => {
        const rowIndex = data.row.index;
        const rowData = tableData[rowIndex];
        if (data.section === 'body' && data.column.index === 0 && rowData?.isSectionHeader) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [250, 250, 250];
        }
        if (data.section === 'body' && data.column.index === 1 && rowData?.isAbnormal) {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }
    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55);
    if (test.technicianNotes) {
      doc.text(`Instruments: ${test.technicianNotes}`, margin, yPosition);
      yPosition += 5;
    }
    if (test.validationNotes) {
      doc.text(`Interpretation: ${test.validationNotes}`, margin, yPosition);
      yPosition += 5;
    }
    doc.text('Thanks for Reference', margin, yPosition);
    yPosition += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('****End of Report****', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  });

  return yPosition;
}

export function drawSignatureAndPageFooters(
  doc: jsPDF,
  reportData: ValidatedTestReportPayload,
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

/**
 * Generate PDF report for lab results with company header, patient details, test results, and footer.
 */
export function generateLabReport(
  reportData: ValidatedTestReportPayload,
  template: ReportTemplate = getDefaultTemplate()
): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  let yPosition = drawReportHeader(doc, reportData, template, margin);
  yPosition = drawTestResultsSection(doc, reportData, yPosition, margin, pageWidth, pageHeight);
  drawSignatureAndPageFooters(doc, reportData, template, yPosition, margin, pageWidth, pageHeight);

  return doc;
}

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

