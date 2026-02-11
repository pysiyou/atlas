/**
 * PDF report test results section: tables and instrument/interpretation per test.
 */

import type jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportData } from '../types';

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
  reportData: ReportData,
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

    const sampleType = (reportData.order.tests[0]?.sampleType || 'N/A').toUpperCase();
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
