/**
 * PDF Report Generation Utilities
 * Generate professional lab reports with jsPDF matching medical lab report format
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ReportData, ReportTemplate } from '../types';
import { format } from 'date-fns';
import { companyConfig } from '@/config';

/**
 * Get default report template from company configuration
 */
const getDefaultTemplate = (): ReportTemplate => {
  const reports = companyConfig.getReports();
  return {
    name: companyConfig.getFullName(),
    headerText: reports.headerText,
    footerText: reports.footerText,
    includeSignature: reports.includeSignature,
  };
};

/**
 * Convert hex color to RGB array
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [14, 165, 233]; // Default blue
}

/**
 * Format phone numbers for display
 */
function formatPhoneNumbers(phone: string | string[]): string {
  if (Array.isArray(phone)) {
    return phone.join(' | ');
  }
  return phone;
}

/**
 * Format timestamp for report display
 */
function formatReportTimestamp(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return format(date, 'hh:mm a dd MMM, yy');
  } catch {
    return 'N/A';
  }
}

/**
 * Generate PDF report for lab results with professional medical lab format
 * Large function is necessary for comprehensive report layout with company header, patient details, and test results
 */
// eslint-disable-next-line max-lines-per-function
export function generateLabReport(reportData: ReportData, template: ReportTemplate = getDefaultTemplate()): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  const company = companyConfig.getConfig();
  const contact = company.contact;
  const brandColor = hexToRgb(company.branding.primaryColor);

  // ========== COMPANY HEADER SECTION ==========
  // Logo placeholder (left side) - 20x20mm
  const logoSize = 12;
  doc.setFillColor(...brandColor);
  doc.roundedRect(margin, yPosition, logoSize, logoSize, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('LOGO', margin + logoSize / 2, yPosition + logoSize / 2, { align: 'center', baseline: 'middle' });

  // Company name and tagline (left, next to logo)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const companyNameX = margin + logoSize + 5;
  doc.text(company.company.fullName, companyNameX, yPosition + 4);

  // Tagline below company name
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(company.company.tagline, companyNameX, yPosition + 8);

  // Contact info (right side)
  const contactX = pageWidth - margin - 60;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  // Phone
  const phoneNumbers = formatPhoneNumbers(contact.phone);
  if (phoneNumbers) {
    doc.setTextColor(34, 197, 94); // Green for phone
    doc.text('📞', contactX, yPosition + 4);
    doc.setTextColor(0, 0, 0);
    doc.text(phoneNumbers, contactX + 5, yPosition + 4);
  }

  // Email
  if (contact.email) {
    doc.setTextColor(234, 179, 8); // Yellow/amber for email
    doc.text('✉', contactX, yPosition + 8);
    doc.setTextColor(0, 0, 0);
    doc.text(contact.email, contactX + 5, yPosition + 8);
  }

  // Full address (centered below company info)
  yPosition += logoSize + 5;
  if (contact.address.fullAddress) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(contact.address.fullAddress, pageWidth / 2, yPosition, { align: 'center' });
  }

  yPosition += 8;

  // ========== WEBSITE BAR ==========
  // Blue bar with website
  doc.setFillColor(...brandColor);
  doc.rect(margin, yPosition, pageWidth - margin * 2, 6, 'F');
  
  // Website text (white, right-aligned on bar)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const website = contact.website.startsWith('www.') ? contact.website : `www.${contact.website}`;
  doc.text(website, pageWidth - margin - 5, yPosition + 4, { align: 'right' });

  yPosition += 10;

  // ========== PATIENT & SAMPLE DETAILS SECTION ==========
  // Three-column layout with vertical dividers
  const detailsStartY = yPosition;
  const sectionHeight = 35;
  const col1Width = (pageWidth - margin * 2) * 0.35; // 35% for patient info
  const col2Width = (pageWidth - margin * 2) * 0.35; // 35% for sample collection
  const col3Width = (pageWidth - margin * 2) * 0.30; // 30% for barcode/timestamps
  
  const col1X = margin;
  const col2X = col1X + col1Width;
  const col3X = col2X + col2Width;
  
  // Draw vertical dividers
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(col2X, detailsStartY, col2X, detailsStartY + sectionHeight);
  doc.line(col3X, detailsStartY, col3X, detailsStartY + sectionHeight);
  
  // Top border line (light blue/teal)
  doc.setDrawColor(...brandColor);
  doc.setLineWidth(0.5);
  doc.line(margin, detailsStartY, pageWidth - margin, detailsStartY);
  
  // Bottom border line (light gray)
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, detailsStartY + sectionHeight, pageWidth - margin, detailsStartY + sectionHeight);
  
  // ========== COLUMN 1: PATIENT INFORMATION ==========
  doc.setTextColor(0, 0, 0);
  let currentY = detailsStartY + 5;
  
  // Patient Name (large, bold)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.patientName, col1X + 3, currentY);
  currentY += 6;
  
  // Age
  if (reportData.patientAge) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Age : ${reportData.patientAge} Years`, col1X + 3, currentY);
    currentY += 4;
  }
  
  // Sex
  if (reportData.patientGender) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Sex : ${reportData.patientGender}`, col1X + 3, currentY);
    currentY += 4;
  }
  
  // PID (below age and sex)
  if (reportData.patientId) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`PID : ${reportData.patientId}`, col1X + 3, currentY);
  }
  
  // QR Code (positioned to the right, aligned with patient name area)
  const qrSize = 18;
  const qrX = col1X + col1Width - qrSize - 3;
  const qrY = detailsStartY + 5; // Align with patient name
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.rect(qrX, qrY, qrSize, qrSize);
  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.text('QR', qrX + qrSize / 2, qrY + qrSize / 2, { align: 'center', baseline: 'middle' });

  // ========== COLUMN 2: SAMPLE COLLECTION DETAILS ==========
  currentY = detailsStartY + 5;
  
  // Sample Collected At heading
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Sample Collected At:', col2X + 5, currentY);
  currentY += 5;
  
  // Collection address (can span multiple lines) - use company address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const collectionAddress = companyConfig.getContact().address.fullAddress || 'N/A';
  const addressLines = doc.splitTextToSize(collectionAddress, col2Width - 10);
  doc.text(addressLines, col2X + 5, currentY);
  currentY += addressLines.length * 4 + 2;
  
  // Referring Doctor
  if (reportData.order.referringPhysician) {
    doc.setFont('helvetica', 'bold');
    doc.text('Ref. By:', col2X + 5, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(reportData.order.referringPhysician, col2X + 25, currentY);
  }

  // ========== COLUMN 3: BARCODE AND TIMESTAMPS ==========
  currentY = detailsStartY + 3;
  
  // Barcode
  const barcodeHeight = 12;
  const barcodeWidth = col3Width - 10;
  const barcodeX = col3X + 5;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  // Draw barcode lines (more realistic)
  const numBars = 30;
  for (let i = 0; i < numBars; i++) {
    const barX = barcodeX + (i * (barcodeWidth / numBars));
    doc.line(barX, currentY, barX, currentY + barcodeHeight);
  }
  
  // Barcode number below barcode (format: 00001 00001 3 5)
  currentY += barcodeHeight + 3;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const patientIdStr = reportData.patientId ? reportData.patientId.toString().padStart(5, '0') : '00000';
  const orderIdStr = reportData.order.orderId.toString().padStart(5, '0');
  const barcodeNumber = `${orderIdStr} ${patientIdStr} ${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}`;
  doc.text(barcodeNumber, barcodeX, currentY);
  currentY += 5;
  
  // Timestamps - Two-column layout with labels left-aligned and values right-aligned
  doc.setFontSize(7);
  const timestamps = reportData.timestamps || {};
  const timestampValueX = col3X + col3Width - 5; // Right edge of column 3
  
  const registeredAt = timestamps.registeredAt || reportData.order.orderDate;
  doc.setFont('helvetica', 'bold');
  doc.text('Registered on:', barcodeX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatReportTimestamp(registeredAt), timestampValueX, currentY, { align: 'right' });
  currentY += 4;
  
  const collectedAt = timestamps.collectedAt || reportData.sampleCollection?.collectedAt;
  doc.setFont('helvetica', 'bold');
  doc.text('Collected on:', barcodeX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatReportTimestamp(collectedAt), timestampValueX, currentY, { align: 'right' });
  currentY += 4;
  
  const reportedAt = timestamps.reportedAt || new Date().toISOString();
  doc.setFont('helvetica', 'bold');
  doc.text('Reported on:', barcodeX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formatReportTimestamp(reportedAt), timestampValueX, currentY, { align: 'right' });

  yPosition = detailsStartY + sectionHeight + 10;

  // ========== TEST RESULTS SECTION ==========
  reportData.testResults.forEach((test) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 100) {
      doc.addPage();
      yPosition = margin;
    }

    // Test name header (centered)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${test.testName} (${test.testCode})`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 7;

    // Top border line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 2;

    // Primary Sample Type row as part of the table
    const sampleType = reportData.order.tests[0]?.sampleType || 'N/A';
    
    // Build table data with Primary Sample Type as first row
    const tableData: Array<{
      investigation: string;
      result: string;
      referenceValue: string;
      unit: string;
      isSectionHeader?: boolean;
      status?: 'low' | 'high' | 'borderline';
      hasCode?: boolean;
    }> = [
      { investigation: 'Primary Sample Type :', result: sampleType, referenceValue: '', unit: '' },
    ];
    
    // Add parameters
    test.parameters.forEach(param => {
      // Format result value (number only, no unit)
      const resultValue = String(param.value);
      
      // Determine status
      let status: 'low' | 'high' | 'borderline' | undefined;
      if (param.status && param.status.toLowerCase() !== 'normal') {
        const statusLower = param.status.toLowerCase();
        if (statusLower === 'low' || statusLower === 'critical-low') {
          status = 'low';
        } else if (statusLower === 'high' || statusLower === 'critical-high') {
          status = 'high';
        } else if (statusLower === 'borderline') {
          status = 'borderline';
        }
      }
      
      // Check if parameter name is a section header (all caps, length > 3)
      const isSectionHeader = param.name === param.name.toUpperCase() && param.name.length > 3 && !param.name.includes(':');
      
      // Format reference value with status label
      let referenceValue = param.referenceRange || '';
      if (status) {
        const statusLabel = status === 'low' ? 'Low' : status === 'high' ? 'High' : 'Borderline';
        referenceValue = statusLabel + (referenceValue ? ' ' + referenceValue : '');
      }
      
      // Format parameter name: name on first line, code on second line (if available)
      const paramDisplayName = param.code ? `${param.name}\n${param.code}` : param.name;
      
      tableData.push({
        investigation: paramDisplayName,
        result: resultValue,
        referenceValue,
        unit: param.unit || '',
        isSectionHeader,
        status,
        hasCode: !!param.code,
      });
    });

    // Convert to array format for autoTable
    const tableBody = tableData.map(row => [
      row.investigation,
      row.result,
      row.referenceValue,
      row.unit,
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Investigation', 'Result', 'Reference Value', 'Unit']],
      body: tableBody,
      theme: 'plain',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 10,
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 9,
        lineWidth: 0.3,
        lineColor: [200, 200, 200],
      },
      margin: { left: margin, right: margin },
      columnStyles: {
        0: { cellWidth: 'auto', halign: 'left' }, // Investigation - left aligned
        1: { cellWidth: 'auto', halign: 'center' }, // Result - center aligned
        2: { cellWidth: 'auto', halign: 'center' }, // Reference Value - center aligned
        3: { cellWidth: 20, halign: 'right' }, // Unit - right aligned
      },
      didParseCell: (data) => {
        const rowIndex = data.row.index;
        const rowData = tableData[rowIndex];
        
        // Section headers: bold, uppercase in Investigation column
        if (data.section === 'body' && data.column.index === 0 && rowData?.isSectionHeader) {
          data.cell.styles.fontStyle = 'bold';
        }
        
        // Color code result values based on status
        if (data.section === 'body' && data.column.index === 1 && rowData?.status) {
          if (rowData.status === 'low') {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
          } else if (rowData.status === 'high') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          }
        }
        
        // Color code reference value status labels
        if (data.section === 'body' && data.column.index === 2 && rowData?.status) {
          if (rowData.status === 'low') {
            data.cell.styles.textColor = [59, 130, 246]; // Blue
          } else if (rowData.status === 'high') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
          } else if (rowData.status === 'borderline') {
            data.cell.styles.textColor = [245, 158, 11]; // Orange
          }
        }
      },
    });

    yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    yPosition += 5;
  });

  // ========== INSTRUMENT AND INTERPRETATION SECTION ==========
  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  yPosition += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Instrument info (if available)
  const lastTest = reportData.testResults[reportData.testResults.length - 1];
  if (lastTest.technicianNotes) {
    doc.text(`Instruments: ${lastTest.technicianNotes}`, margin, yPosition);
    yPosition += 5;
  }
  
  // Interpretation (if available)
  if (lastTest.validationNotes) {
    doc.text(`Interpretation: ${lastTest.validationNotes}`, margin, yPosition);
    yPosition += 5;
  }
  
  yPosition += 5;
  doc.text('Thanks for Reference', margin, yPosition);
  yPosition += 8;
  
  // End of Report
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('****End of Report****', pageWidth / 2, yPosition, { align: 'center' });

  // ========== SIGNATURE SECTION ==========
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
    if (lastTest.validatedAt) {
      const validatedByName = lastTest.validatedByName && lastTest.validatedByName !== 'N/A' 
        ? lastTest.validatedByName 
        : (lastTest.validatedBy ? lastTest.validatedBy : 'Unknown');
      doc.text(`Validated by: ${validatedByName}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Date: ${format(new Date(lastTest.validatedAt), 'MMM dd, yyyy HH:mm')}`, margin, yPosition);
    }
  }

  // ========== FOOTER ON EVERY PAGE ==========
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    // Footer text
    const footerLines = doc.splitTextToSize(template.footerText, pageWidth - margin * 2);
    doc.text(footerLines, pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    // Page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 5, pageHeight - 8, { align: 'right' });
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
