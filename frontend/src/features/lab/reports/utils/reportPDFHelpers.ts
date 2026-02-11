/**
 * PDF report helpers: template, timestamp formatting.
 */

import { format } from 'date-fns';
import { companyConfig } from '@/config';
import type { ReportTemplate } from '../types';

export function getDefaultTemplate(): ReportTemplate {
  const reports = companyConfig.getReports();
  return {
    name: companyConfig.getFullName(),
    headerText: reports.headerText,
    footerText: reports.footerText,
    includeSignature: reports.includeSignature,
  };
}

export function formatReportTimestamp(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), 'yyyy-MM-dd hh:mm a');
  } catch {
    return 'N/A';
  }
}
