/**
 * PDF report header: company panel, report title, patient and processing details.
 */

import type jsPDF from 'jspdf';
import type { ReportData, ReportTemplate } from '../types';
import { companyConfig } from '@/config';
import { formatReportTime } from '@/utils/date';

interface HeaderLayout {
  pageWidth: number;
  margin: number;
  headerStartY: number;
  headerHeight: number;
  leftPanelWidth: number;
  rightPanelWidth: number;
  leftPanelX: number;
  rightPanelX: number;
}

function getHeaderLayout(doc: jsPDF, margin: number): HeaderLayout {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerStartY = margin;
  const headerHeight = 50;
  const leftPanelWidth = (pageWidth - margin * 2) * 0.4;
  const rightPanelWidth = (pageWidth - margin * 2) * 0.6;
  const leftPanelX = margin;
  const rightPanelX = leftPanelX + leftPanelWidth;

  return {
    pageWidth,
    margin,
    headerStartY,
    headerHeight,
    leftPanelWidth,
    rightPanelWidth,
    leftPanelX,
    rightPanelX,
  };
}

function drawCompanyPanel(doc: jsPDF, layout: HeaderLayout): void {
  const { headerStartY, headerHeight, leftPanelWidth, leftPanelX } = layout;

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
}

function drawReportTitle(doc: jsPDF, layout: HeaderLayout, reportData: ReportData): number {
  const { headerStartY, rightPanelX } = layout;
  const currentY = headerStartY + 5;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const reportTitle =
    reportData.testResults.length > 0
      ? `${reportData.testResults.map(t => t.testName).join(', ')} Results ( ${reportData.testResults.map(t => t.testCode).join(', ')} )`
      : 'Test Results';
  doc.text(reportTitle, rightPanelX + 5, currentY);
  return currentY + 6;
}

function drawLabelValue(
  doc: jsPDF,
  x: number,
  y: number,
  label: string,
  value: string,
  valueX: number
): void {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(55, 65, 81);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(value, valueX, y);
}

function drawPatientDetails(doc: jsPDF, layout: HeaderLayout, reportData: ReportData, startY: number): void {
  const { rightPanelX } = layout;
  const subCol1X = rightPanelX;
  let subColY = startY;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reportData.patientName, subCol1X + 5, subColY);
  subColY += 5;

  if (reportData.patientAge !== undefined) {
    drawLabelValue(doc, subCol1X + 5, subColY, 'Age:', String(reportData.patientAge), subCol1X + 20);
    subColY += 4;
  }
  if (reportData.patientGender) {
    drawLabelValue(
      doc,
      subCol1X + 5,
      subColY,
      'Gender:',
      reportData.patientGender.toUpperCase(),
      subCol1X + 25
    );
    subColY += 4;
  }

  const orderExtended = reportData.order as typeof reportData.order & {
    patientPhone?: string;
    patientEmail?: string;
  };
  if (orderExtended.patientPhone) {
    drawLabelValue(doc, subCol1X + 5, subColY, 'Phone:', orderExtended.patientPhone, subCol1X + 25);
  } else if (orderExtended.patientEmail) {
    drawLabelValue(doc, subCol1X + 5, subColY, 'Email:', orderExtended.patientEmail, subCol1X + 25);
  }
}

function drawProcessingDetails(
  doc: jsPDF,
  layout: HeaderLayout,
  reportData: ReportData,
  startY: number
): void {
  const { rightPanelWidth, rightPanelX } = layout;
  const subCol1Width = rightPanelWidth * 0.5;
  const subCol2X = rightPanelX + subCol1Width;
  let subColY = startY;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text('Processing Details', subCol2X + 5, subColY);
  subColY += 5;

  const collectedAt =
    reportData.timestamps?.collectedAt || reportData.sampleCollection?.collectedAt;
  if (collectedAt) {
    drawLabelValue(
      doc,
      subCol2X + 5,
      subColY,
      'Sample:',
      formatReportTime(collectedAt),
      subCol2X + 25
    );
    subColY += 4;
  }

  const reportedAt = reportData.timestamps?.reportedAt;
  drawLabelValue(
    doc,
    subCol2X + 5,
    subColY,
    'Results:',
    formatReportTime(reportedAt || new Date().toISOString()),
    subCol2X + 25
  );
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
    } else if (!testResult.validatedAt) {
      verifiedByName = '-';
    }
    drawLabelValue(doc, subCol2X + 5, subColY, 'Verified by:', verifiedByName, subCol2X + 30);
  }
}

export function drawReportHeader(
  doc: jsPDF,
  reportData: ReportData,
  _template: ReportTemplate,
  margin: number
): number {
  const layout = getHeaderLayout(doc, margin);

  drawCompanyPanel(doc, layout);
  const titleEndY = drawReportTitle(doc, layout, reportData);
  drawPatientDetails(doc, layout, reportData, titleEndY);
  drawProcessingDetails(doc, layout, reportData, titleEndY);

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(
    layout.margin,
    layout.headerStartY + layout.headerHeight,
    layout.pageWidth - layout.margin,
    layout.headerStartY + layout.headerHeight
  );

  return layout.headerStartY + layout.headerHeight + 10;
}
