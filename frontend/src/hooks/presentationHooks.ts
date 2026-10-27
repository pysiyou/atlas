/**
 * Screen-level presentation hooks. Import via @/utils/presentation (not this path directly).
 */

import { useMemo } from 'react';
import type { ReportableOrder } from '@/features/reports/types';
import type { Order, OrderTest } from '@/types';
import {
  buildOrderContextPresentation,
  formatReportOrderTestsPreview,
  formatReportValidationStatus,
  getReportOrderTestLabels,
  resolveOrderTestsPresentation,
  resolveReportableOrderTests,
} from '@/utils/presentation';
import {
  buildWorklistRowPresentation,
  type WorklistRowSource,
} from '@/features/shared/entityPresentation';

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
      { orderId: order.orderId, orderDate: order.orderDate }
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
        order.activeTestCount
      ),
      sortTestsValue: testsPreview.names,
    };
  }, [order]);
}

export interface OrderDetailPresentationInput {
  order: Order;
  getTestName?: (testCode: string) => string;
}

export function useOrderDetailPresentation({
  order,
  getTestName,
}: OrderDetailPresentationInput) {
  return useMemo(() => {
    const activeTests = (order.tests ?? []).filter(t => t.status !== 'removed');
    const testsPresentation = resolveOrderTestsPresentation({
      activeTests,
      getTestName,
      layout: 'namesFirst',
      showAllNames: true,
    });

    const context = buildOrderContextPresentation(
      {
        patientId: order.patientId,
        patientName: order.patientName,
      },
      { orderId: order.orderId, orderDate: order.orderDate }
    );

    return {
      order,
      context,
      activeTests: activeTests as OrderTest[],
      testsPresentation,
    };
  }, [order, getTestName]);
}

export function useWorklistItemPresentation(row: WorklistRowSource) {
  return useMemo(() => buildWorklistRowPresentation(row), [row]);
}

export interface OrderListRowPresentationInput {
  orderId: number;
  patientId: number;
  patientName: string;
  patientGender?: string | null;
  patientDob?: string | null;
  orderDate: string;
  tests: OrderTest[];
  testCount?: number;
  testCodes?: string[];
  getTestName?: (code: string) => string;
}

export function useOrderListRowPresentation(row: OrderListRowPresentationInput) {
  return useMemo(() => {
    const context = buildOrderContextPresentation(
      {
        patientId: row.patientId,
        patientName: row.patientName,
        gender: row.patientGender,
        dateOfBirth: row.patientDob,
      },
      { orderId: row.orderId, orderDate: row.orderDate }
    );

    const tests = resolveOrderTestsPresentation({
      activeTests: row.tests,
      fallbackCount: row.testCount,
      testCodes: row.testCodes,
      getTestName: row.getTestName,
      layout: 'namesFirst',
    });

    return { context, tests };
  }, [row]);
}
