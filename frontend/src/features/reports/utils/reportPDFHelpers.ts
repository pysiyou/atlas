/**
 * PDF report helpers: template configuration.
 */

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
