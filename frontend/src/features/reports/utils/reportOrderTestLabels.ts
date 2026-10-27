import { formatTruncatedListPreview } from '@/utils/array';
import type { ReportableOrder } from '../types';
import { getActiveOrderTests } from './prepareReportData';

export function getReportOrderTestLabels(order: ReportableOrder): {
  nameLabels: string[];
  codeLabels: string[];
} {
  const nameLabels =
    order.testNames.length > 0
      ? order.testNames
      : order.order
        ? getActiveOrderTests(order.order).map(test => test.testName)
        : [];
  const codeLabels =
    order.testCodes.length > 0
      ? order.testCodes
      : order.order
        ? getActiveOrderTests(order.order).map(test => test.testCode)
        : [];
  return { nameLabels, codeLabels };
}

export function formatReportOrderTestsPreview(order: ReportableOrder): {
  names: string;
  codes: string;
  fullNames: string;
  fullCodes: string;
} {
  const { nameLabels, codeLabels } = getReportOrderTestLabels(order);
  const fullNames = nameLabels.join(', ');
  const fullCodes = codeLabels.join(', ');
  const names =
    nameLabels.length > 0
      ? formatTruncatedListPreview(nameLabels)
      : `${order.activeTestCount} test(s)`;
  const codes = formatTruncatedListPreview(codeLabels);
  return { names, codes, fullNames, fullCodes };
}
