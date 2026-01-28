/**
 * PDF Report Generation Utilities
 * Generate professional lab reports with jsPDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportData, ReportTemplate } from '../types';
import { format } from 'date-fns';

const DEFAULT_TEMPLATE: ReportTemplate = {
  name: 'Atlas Clinical Labs',
  headerText: 'Atlas Clinical Laboratories - Laboratory Report',
  footerText: 'This report contains confidential patient information. Handle according to applicable privacy laws.',
  includeSignature: true,
};

/**
 * Generate PDF report for lab results
 */
export function generateLabReport(reportData: ReportData, template: ReportTemplate = DEFAULT_TEMPLATE): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(14, 165, 233); // Brand color
  doc.text(template.headerText, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  doc.setDrawColor(14, 165, 233);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  
  yPosition += 15;

  // Patient Information Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Patient Information', 20, yPosition);
  yPosition += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const patientInfo = [
    ['Patient Name:', reportData.patientName],
    ['Order ID:', `ORD${reportData.order.orderId.toString().padStart(6, '0')}`],
    ['Order Date:', format(new Date(reportData.order.orderDate), 'MMM dd, yyyy HH:mm')],
    ['Priority:', reportData.order.priority.toUpperCase()],
  ];

  if (reportData.patientAge) {
    patientInfo.push(['Age:', `${reportData.patientAge} years`]);
  }
  if (reportData.patientGender) {
    patientInfo.push(['Gender:', reportData.patientGender]);
  }
  if (reportData.order.referringPhysician) {
    patientInfo.push(['Referring Physician:', reportData.order.referringPhysician]);
  }

  patientInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 70, yPosition);
    yPosition += 6;
  });

  yPosition += 10;

  // Test Results Section
  reportData.testResults.forEach((test) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${test.testName} (${test.testCode})`, 20, yPosition);
    yPosition += 7;

    // Parameters table
    const tableData = test.parameters.map(param => {
      return [
        param.name,
        `${param.value}${param.unit ? ' ' + param.unit : ''}`,
        param.referenceRange || 'N/A',
        param.status ? param.status.toUpperCase() : 'NORMAL',
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Parameter', 'Result', 'Reference Range', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [14, 165, 233],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 20, right: 20 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 3) {
          const status = data.cell.text[0];
          if (status.includes('CRITICAL')) {
            data.cell.styles.textColor = [239, 68, 68];
            data.cell.styles.fontStyle = 'bold';
          } else if (status.includes('HIGH') || status.includes('LOW')) {
            data.cell.styles.textColor = [245, 158, 11];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [34, 197, 94];
          }
        }
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // Notes
    if (test.technicianNotes) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Technician Notes:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'italic');
      const notesLines = doc.splitTextToSize(test.technicianNotes, pageWidth - 40);
      doc.text(notesLines, 20, yPosition);
      yPosition += notesLines.length * 5 + 5;
    }

    if (test.validationNotes) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Validation Notes:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'italic');
      const notesLines = doc.splitTextToSize(test.validationNotes, pageWidth - 40);
      doc.text(notesLines, 20, yPosition);
      yPosition += notesLines.length * 5 + 5;
    }

    yPosition += 5;
  });

  // Signature Section
  if (template.includeSignature) {
    // Check if we need a new page for signature
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 10;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, yPosition, pageWidth / 2 - 10, yPosition);
    
    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const lastTest = reportData.testResults[reportData.testResults.length - 1];
    if (lastTest.validatedBy && lastTest.validatedAt) {
      doc.text('Validated by: ' + lastTest.validatedBy, 20, yPosition);
      yPosition += 5;
      doc.text('Date: ' + format(new Date(lastTest.validatedAt), 'MMM dd, yyyy HH:mm'), 20, yPosition);
    }
  }

  // Footer on every page
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);
    
    // Footer text
    const footerLines = doc.splitTextToSize(template.footerText, pageWidth - 40);
    doc.text(footerLines, pageWidth / 2, pageHeight - 20, { align: 'center' });
    
    // Page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    
    // Generated timestamp
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, pageHeight - 10);
  }

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
