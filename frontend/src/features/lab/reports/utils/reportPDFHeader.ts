/**
 * PDF report header: company panel, report title, patient and processing details.
 */

import type jsPDF from 'jspdf';
import type { ReportData, ReportTemplate } from '../types';
import { companyConfig } from '@/config';
import { formatReportTimestamp } from './reportPDFHelpers';

export function drawReportHeader(
  doc: jsPDF,
  reportData: ReportData,
  _template: ReportTemplate,
  margin: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerStartY = margin;
  const headerHeight = 50;

  const leftPanelWidth = (pageWidth - margin * 2) * 0.4;
  const rightPanelWidth = (pageWidth - margin * 2) * 0.6;
  const leftPanelX = margin;
  const rightPanelX = leftPanelX + leftPanelWidth;

  doc.setFillColor(224, 242, 247);
  doc.rect(leftPanelX, headerStartY, leftPanelWidth, headerHeight, 'F');

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  let currentY = headerStartY + 8;
  doc.text(companyConfig.getName(), leftPanelX + 5, currentY);
  currentY += 6;

  const company = companyConfig.getConfig();
  const contact = company.contact;
  if (company.company.subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(company.company.subtitle, leftPanelX + 5, currentY);
    currentY += 4;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
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

  currentY = headerStartY + 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const reportTitle =
    reportData.testResults.length > 0
      ? `${reportData.testResults.map(t => t.testName).join(', ')} Results ( ${reportData.testResults.map(t => t.testCode).join(', ')} )`
      : 'Test Results';
  doc.text(reportTitle, rightPanelX + 5, currentY);
  currentY += 6;

  const subCol1Width = rightPanelWidth * 0.5;
  const subCol1X = rightPanelX;
  const subCol2X = rightPanelX + subCol1Width;

  let subColY = currentY;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.patientName, subCol1X + 5, subColY);
  subColY += 5;

  if (reportData.patientAge !== undefined) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text('Age:', subCol1X + 5, subColY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(31, 41, 55);
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

  subColY = currentY;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Processing Details', subCol2X + 5, subColY);
  subColY += 5;

  const collectedAt =
    reportData.timestamps?.collectedAt || reportData.sampleCollection?.collectedAt;
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

  if (reportData.testResults[0]) {
    const testResult = reportData.testResults[0];
    let verifiedByName = 'N/A';
    if (
      testResult.validatedByName &&
      testResult.validatedByName !== 'N/A' &&
      testResult.validatedByName !== 'Unknown'
    ) {
      verifiedByName = testResult.validatedByName;
    } else if (testResult.validatedBy) {
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

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, headerStartY + headerHeight, pageWidth - margin, headerStartY + headerHeight);

  return headerStartY + headerHeight + 10;
}
