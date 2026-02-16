/**
 * Command Center types - LabTestRow for test table (all statuses).
 */
import type { Order, OrderTest } from '@/types';

export interface LabTestRow {
  testId: number;
  testCode: string;
  testName: string;
  orderId: number;
  orderDate: string;
  patientId: number;
  patientName: string;
  test: OrderTest;
  order: Order;
}

/**
 * Flatten orders to lab test rows, sort by orderDate desc, then orderId/testId; limit to first N.
 */
export function buildLabTestRows(
  orders: Order[],
  getPatientName: (patientId: number | string) => string,
  limit: number
): LabTestRow[] {
  const rows: LabTestRow[] = [];
  for (const order of orders) {
    const patientName = getPatientName(order.patientId);
    for (const test of order.tests) {
      if (test.id == null) continue;
      rows.push({
        testId: test.id,
        testCode: test.testCode,
        testName: test.testName ?? test.testCode,
        orderId: order.orderId,
        orderDate: order.orderDate,
        patientId: order.patientId,
        patientName,
        test,
        order,
      });
    }
  }
  rows.sort((a, b) => {
    const d = new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
    if (d !== 0) return d;
    if (a.orderId !== b.orderId) return b.orderId - a.orderId;
    return (b.testId ?? 0) - (a.testId ?? 0);
  });
  return rows.slice(0, limit);
}
