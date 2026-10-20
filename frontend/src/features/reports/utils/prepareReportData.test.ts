import { describe, expect, it } from 'vitest';
import type { Order, OrderTest, Test } from '@/types';
import type { ReportableOrder } from '../types';
import { RESULT_NOT_AVAILABLE } from '../types';
import {
  filterReportableOrdersByDateRange,
  getActiveOrderTests,
  prepareReportData,
} from './prepareReportData';

function orderTest(overrides: Partial<OrderTest> & Pick<OrderTest, 'testCode' | 'testName' | 'status'>): OrderTest {
  return {
    sampleType: 'blood',
    priceAtOrder: 10,
    results: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

function order(tests: OrderTest[]): Order {
  return {
    orderId: 12,
    patientId: 3,
    patientName: 'Ada Lovelace',
    orderDate: '2026-02-01T10:00:00Z',
    tests,
    totalPrice: 10,
    paymentStatus: 'unpaid',
    overallStatus: 'running',
    priority: 'low',
    createdBy: '1',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-01T10:00:00Z',
  };
}

function reportable(tests: OrderTest[]): ReportableOrder {
  const active = tests.filter(test => test.status !== 'removed' && test.status !== 'superseded');
  return {
    orderId: 12,
    orderDate: '2026-02-01T10:00:00Z',
    patientId: 3,
    patientName: 'Ada Lovelace',
    patientDob: '2004-06-10',
    patientAge: 22,
    patientGender: 'female',
    activeTestCount: active.length,
    validatedTestCount: active.filter(test => test.status === 'validated').length,
    testCodes: active.map(test => test.testCode),
    testNames: active.map(test => test.testName),
    order: order(tests),
  };
}

const catalog = [
  {
    code: 'CBC',
    name: 'Complete Blood Count',
    parameters: [
      { name: 'Hemoglobin', code: 'HGB', unit: 'g/dL', referenceRange: '12-16', type: 'numeric' },
      { name: 'WBC', code: 'WBC', unit: '10^3/uL', referenceRange: '4-11', type: 'numeric' },
    ],
  },
] as Test[];

describe('getActiveOrderTests', () => {
  it('drops removed and superseded tests and sorts by id', () => {
    const tests = [
      orderTest({ id: 3, testCode: 'LIP', testName: 'Lipid', status: 'pending' }),
      orderTest({ id: 1, testCode: 'CBC', testName: 'CBC', status: 'removed' }),
      orderTest({ id: 2, testCode: 'GLU', testName: 'Glucose', status: 'superseded' }),
    ];
    expect(getActiveOrderTests(order(tests)).map(test => test.testCode)).toEqual(['LIP']);
  });
});

describe('filterReportableOrdersByDateRange', () => {
  it('returns all orders when no range is set', () => {
    const items = [reportable([orderTest({ testCode: 'CBC', testName: 'CBC', status: 'pending' })])];
    expect(filterReportableOrdersByDateRange(items, null)).toEqual(items);
  });
});

describe('prepareReportData', () => {
  it('includes every active test and catalog placeholders for missing results', () => {
    const payload = prepareReportData({
      reportableOrder: reportable([
        orderTest({
          id: 1,
          testCode: 'CBC',
          testName: 'Complete Blood Count',
          status: 'pending',
        }),
        orderTest({
          id: 2,
          testCode: 'GLU',
          testName: 'Glucose',
          status: 'validated',
          results: { GLU: { value: 95, unit: 'mg/dL', status: 'normal' } },
          resultEnteredAt: '2026-02-02T11:30:00Z',
          resultValidatedAt: '2026-02-02T12:00:00Z',
        }),
        orderTest({ id: 3, testCode: 'OLD', testName: 'Old', status: 'removed' }),
      ]),
      patients: undefined,
      catalogTests: catalog,
      getSample: () => undefined,
      getUserName: () => 'Tech',
    });

    expect(payload.testResults.map(test => test.testCode)).toEqual(['CBC', 'GLU']);
    expect(payload.testResults[0].parameters).toEqual([
      { name: 'Hemoglobin', code: 'HGB', value: RESULT_NOT_AVAILABLE },
      { name: 'WBC', code: 'WBC', value: RESULT_NOT_AVAILABLE },
    ]);
    expect(payload.testResults[1].parameters[0]).toMatchObject({
      name: 'GLU',
      value: 95,
    });
    expect(payload.timestamps?.reportedAt).toBe('2026-02-02T12:00:00Z');
    expect(payload.patientDob).toBe('2004-06-10');
    expect(payload.timestamps?.acceptedAt).toBe('2026-02-02T11:30:00Z');
  });

  it('uses collection time as lab acceptance when no result has been entered', () => {
    const payload = prepareReportData({
      reportableOrder: reportable([
        orderTest({
          id: 1,
          testCode: 'GLU',
          testName: 'Glucose',
          status: 'pending',
          sampleId: 9,
        }),
      ]),
      patients: undefined,
      catalogTests: [],
      getSample: () => ({
        status: 'collected',
        collectedAt: '2026-02-01T11:00:00Z',
        collectedBy: '1',
      }),
      getUserName: () => 'Tech',
    });

    expect(payload.timestamps?.collectedAt).toBe('2026-02-01T11:00:00Z');
    expect(payload.timestamps?.acceptedAt).toBe('2026-02-01T11:00:00Z');
  });

  it('emits a single placeholder row when a test has no catalog parameters and no results', () => {
    const payload = prepareReportData({
      reportableOrder: reportable([
        orderTest({ id: 1, testCode: 'GLU', testName: 'Glucose', status: 'pending' }),
      ]),
      patients: undefined,
      catalogTests: [],
      getSample: () => undefined,
      getUserName: () => 'Tech',
    });

    expect(payload.testResults[0].parameters).toEqual([
      { name: 'Glucose', code: 'GLU', value: RESULT_NOT_AVAILABLE },
    ]);
  });
});
