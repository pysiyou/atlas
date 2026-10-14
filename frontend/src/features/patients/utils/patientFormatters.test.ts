import { describe, expect, it } from 'vitest';
import type { Order, OrderTest } from '@/types';
import { getReportableOrders } from './patientFormatters';

function order(overrides: Partial<Order> & { tests: OrderTest[] }): Order {
  return {
    orderId: 1,
    patientId: 1,
    patientName: 'Ada',
    orderDate: '2026-01-01T00:00:00Z',
    totalPrice: 0,
    paymentStatus: 'unpaid',
    overallStatus: 'ordered',
    priority: 'low',
    createdBy: '1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function testLine(status: OrderTest['status']): OrderTest {
  return {
    testCode: 'CBC',
    testName: 'CBC',
    sampleType: 'blood',
    status,
    priceAtOrder: 0,
    results: null,
    createdAt: '',
    updatedAt: '',
  };
}

describe('getReportableOrders', () => {
  it('includes pending active tests and excludes cancelled orders', () => {
    const pending = order({ orderId: 1, tests: [testLine('pending')] });
    const cancelled = order({
      orderId: 2,
      overallStatus: 'cancelled',
      tests: [testLine('validated')],
    });
    const removedOnly = order({ orderId: 3, tests: [testLine('removed')] });
    expect(getReportableOrders([pending, cancelled, removedOnly]).map(item => item.orderId)).toEqual([
      1,
    ]);
  });
});
