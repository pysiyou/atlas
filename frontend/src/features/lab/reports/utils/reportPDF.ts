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
 * Format timestamp for report display - matches modal preview format
 */
function formatReportTimestamp(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd hh:mm a');
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

  // ========== REPORT HEADER SECTION - Two Column Layout (matches modal) ==========
  const headerStartY = yPosition;
  const headerHeight = 50;
  
  // Left Panel: Company Information (40% width, light blue background)
  const leftPanelWidth = (pageWidth - margin * 2) * 0.40;
  const rightPanelWidth = (pageWidth - margin * 2) * 0.60;
  const leftPanelX = margin;
  const rightPanelX = leftPanelX + leftPanelWidth;
  
  // Left panel background — maps to --surface-report-panel (RGB 224, 242, 247)
  doc.setFillColor(224, 242, 247);
  doc.rect(leftPanelX, headerStartY, leftPanelWidth, headerHeight, 'F');
  
  // Company Name
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18); // text-2xl equivalent
  doc.setFont('helvetica', 'bold');
  let currentY = headerStartY + 8;
  doc.text(companyConfig.getName(), leftPanelX + 5, currentY);
  currentY += 6;
  
  // Company Subtitle
  if (company.company.subtitle) {
    doc.setFontSize(9); // text-xs equivalent
    doc.setFont('helvetica', 'bold');
    doc.text(company.company.subtitle, leftPanelX + 5, currentY);
    currentY += 4;
  }
  
  // Address Lines
  doc.setFontSize(9); // text-xs equivalent
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81); // text-gray-700
  if (contact.address.street) {
    doc.text(contact.address.street, leftPanelX + 5, currentY);
    currentY += 3.5;
  }
  const { city, state, zipCode } = contact.address;
  const addressParts = [city, state, zipCode].filter(Boolean);
  if (addressParts.length > 0) {
    doc.text(addressParts.join(', '), leftPanelX + 5, currentY);
    currentY += 3.5;
  }
  if (contact.address.country) {
    doc.text(contact.address.country, leftPanelX + 5, currentY);
  }
  
  // Right Panel: Report Title and Details (white background)
  currentY = headerStartY + 5;
  
  // Report Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14); // text-base equivalent
  doc.setFont('helvetica', 'bold');
  const reportTitle = reportData.testResults.length > 0
    ? `${reportData.testResults.map(t => t.testName).join(', ')} Results ( ${reportData.testResults.map(t => t.testCode).join(', ')} )`
    : 'Test Results';
  doc.text(reportTitle, rightPanelX + 5, currentY);
  currentY += 6;
  
  // Patient and Processing Details - Two Sub-columns
  const subCol1Width = rightPanelWidth * 0.5;
  const subCol1X = rightPanelX;
  const subCol2X = rightPanelX + subCol1Width;
  
  // Left Sub-column: Patient Demographics
  let subColY = currentY;
  doc.setFontSize(14); // text-base equivalent
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.patientName, subCol1X + 5, subColY);
  subColY += 5;
  
  if (reportData.patientAge) {
    doc.setFontSize(9); // text-xs equivalent
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81); // text-gray-700
    doc.text('Age:', subCol1X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55); // text-gray-800
    doc.text(String(reportData.patientAge), subCol1X + 20, subColY);
    subColY += 4;
  }
  
  if (reportData.patientGender) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Gender:', subCol1X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(reportData.patientGender.toUpperCase(), subCol1X + 25, subColY);
    subColY += 4;
  }
  
  // Phone or Email
  const orderExtended = reportData.order as typeof reportData.order & { 
    patientPhone?: string;
    patientEmail?: string;
  };
  if (orderExtended.patientPhone) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Phone:', subCol1X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(orderExtended.patientPhone, subCol1X + 25, subColY);
    subColY += 4;
  } else if (orderExtended.patientEmail) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Email:', subCol1X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(orderExtended.patientEmail, subCol1X + 25, subColY);
  }
  
  // Right Sub-column: Processing Details
  subColY = currentY;
  doc.setFontSize(14); // text-base equivalent
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Processing Details', subCol2X + 5, subColY);
  subColY += 5;
  
  const collectedAt = reportData.timestamps?.collectedAt || reportData.sampleCollection?.collectedAt;
  if (collectedAt) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Sample:', subCol2X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatReportTimestamp(collectedAt), subCol2X + 25, subColY);
    subColY += 4;
  }
  
  const reportedAt = reportData.timestamps?.reportedAt;
  if (reportedAt) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Results:', subCol2X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatReportTimestamp(reportedAt), subCol2X + 25, subColY);
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Results:', subCol2X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(formatReportTimestamp(new Date().toISOString()), subCol2X + 25, subColY);
  }
  subColY += 4;
  
  // Verified by
  if (reportData.testResults[0]) {
    const testResult = reportData.testResults[0];
    let verifiedByName = 'N/A';
    
    // Try validatedByName first (pre-resolved)
    if (testResult.validatedByName && testResult.validatedByName !== 'N/A' && testResult.validatedByName !== 'Unknown') {
      verifiedByName = testResult.validatedByName;
    } else if (testResult.validatedBy) {
      // Fall back to validatedBy ID (will show as ID if not resolved)
      verifiedByName = testResult.validatedBy;
    } else if (testResult.validatedAt) {
      verifiedByName = 'N/A';
    } else {
      verifiedByName = '-';
    }
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Verified by:', subCol2X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
    doc.text(verifiedByName, subCol2X + 30, subColY);
  }
  
  // Bottom border line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, headerStartY + headerHeight, pageWidth - margin, headerStartY + headerHeight);
  
  yPosition = headerStartY + headerHeight + 10;

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
    const sampleType = (reportData.order.tests[0]?.sampleType || 'N/A').toUpperCase();
    
    // Build table data with Primary Sample Type as first row
    const tableData: Array<{
      investigation: string;
      result: string;
      referenceValue: string;
      unit: string;
      isSectionHeader?: boolean;
      isAbnormal?: boolean;
      hasCode?: boolean;
    }> = [
      { investigation: 'Primary Sample Type :', result: sampleType, referenceValue: '', unit: '' },
    ];
    
    // Add parameters
    test.parameters.forEach(param => {
      // Format result value
      const resultValue = String(param.value);
      
      // Check if value is abnormal
      const isAbnormal = !!(param.status && param.status.toLowerCase() !== 'normal');
      
      // Check if parameter name is a section header (all caps, length > 3)
      const isSectionHeader = param.name === param.name.toUpperCase() && param.name.length > 3 && !param.name.includes(':');
      
      // Format reference value (no status labels, just the range)
      const referenceValue = param.referenceRange || '';
      
      // Format parameter name: name on first line, code on second line (if available)
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

    // Convert to array format for autoTable
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
        0: { cellWidth: 'auto', halign: 'left' }, // Investigation - left aligned
        1: { cellWidth: 'auto', halign: 'left' }, // Result - left aligned (matches modal)
        2: { cellWidth: 'auto', halign: 'left' }, // Reference Value - left aligned (matches modal)
        3: { cellWidth: 20, halign: 'right' }, // Unit - right aligned
      },
      styles: {
        lineColor: [220, 220, 220], // border-border-subtle
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [250, 250, 250], // bg-surface-canvas
        textColor: [107, 114, 128], // text-text-tertiary
        fontStyle: 'bold',
        fontSize: 9,
        lineWidth: 0.5,
        lineColor: [229, 231, 235], // border-border-strong
      },
      bodyStyles: {
        fontSize: 9,
        lineWidth: 0.3,
        lineColor: [220, 220, 220], // border-border-subtle
        textColor: [31, 41, 55], // text-text-primary
      },
      didParseCell: (data) => {
        const rowIndex = data.row.index;
        const rowData = tableData[rowIndex];
        
        // Section headers: bold, background color
        if (data.section === 'body' && data.column.index === 0 && rowData?.isSectionHeader) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [250, 250, 250]; // bg-surface-canvas/50
        }
        
        // Abnormal result values: red and bold
        if (data.section === 'body' && data.column.index === 1 && rowData?.isAbnormal) {
          data.cell.styles.textColor = [220, 38, 38]; // text-feedback-danger-text
          data.cell.styles.fontStyle = 'bold';
        }
        
        // Investigation column: bold name, normal code (if has code)
        if (data.section === 'body' && data.column.index === 0 && rowData?.hasCode && !rowData?.isSectionHeader) {
          // First line (name) should be bold, second line (code) normal
          // This is handled by the multi-line text format
        }
      },
    });

    yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

    // ========== INSTRUMENT AND INTERPRETATION SECTION (per test, matches modal) ==========
    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    yPosition += 5;
    doc.setFontSize(9); // text-xs equivalent
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(31, 41, 55); // text-text-primary
    
    // Instrument info (if available)
    if (test.technicianNotes) {
      doc.text(`Instruments: ${test.technicianNotes}`, margin, yPosition);
      yPosition += 5;
    }
    
    // Interpretation (if available)
    if (test.validationNotes) {
      doc.text(`Interpretation: ${test.validationNotes}`, margin, yPosition);
      yPosition += 5;
    }
    
    doc.text('Thanks for Reference', margin, yPosition);
    yPosition += 8;
    
    // End of Report
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('****End of Report****', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
  });

  // ========== SIGNATURE SECTION ==========
  // Note: Modal doesn't show signature section, but keeping for template compatibility
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
      // Use same logic as modal for verified by
      let validatedByName = 'N/A';
      if (lastTest.validatedByName && lastTest.validatedByName !== 'N/A' && lastTest.validatedByName !== 'Unknown') {
        validatedByName = lastTest.validatedByName;
      } else if (lastTest.validatedBy) {
        validatedByName = lastTest.validatedBy;
      } else {
        validatedByName = '-';
      }
      
      doc.text(`Validated by: ${validatedByName}`, margin, yPosition);
      yPosition += 5;
      doc.text(`Date: ${format(new Date(lastTest.validatedAt), 'yyyy-MM-dd hh:mm a')}`, margin, yPosition);
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
    
    // Footer text with generation timestamp (matches modal)
    const footerText = `${template.footerText} Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`;
    const footerLines = doc.splitTextToSize(footerText, pageWidth - margin * 2);
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
