/** Screen-level presentation hook for reportable order cards. */

import { useMemo } from 'react';
import type { ReportableOrder } from '@/types';
import {
  buildOrderContextPresentation,
  formatReportOrderTestsPreview,
  formatReportValidationStatus,
  getReportOrderTestLabels,
  resolveReportableOrderTests,
} from '@/utils/presentation';

export function useReportableOrderPresentation(order: ReportableOrder) {
  return useMemo(() => {
    const tests = resolveReportableOrderTests(order);
    const testsPreview = formatReportOrderTestsPreview(order);
    const { nameLabels, codeLabels } = getReportOrderTestLabels(order);
    const context = buildOrderContextPresentation(
      {
        patientId: order.patientId,
        patientName: order.patientName,
        gender: order.patientGender,
        dateOfBirth: order.patientDob,
      },
      { orderId: order.orderId, orderDate: order.orderDate },
    );

    return {
      order,
      context,
      tests,
      testsPreview,
      nameLabels,
      codeLabels,
      validationStatus: formatReportValidationStatus(
        order.validatedTestCount,
        order.activeTestCount,
      ),
      sortTestsValue: testsPreview.names,
    };
  }, [order]);
}
