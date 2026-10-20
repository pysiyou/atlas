import { describe, expect, it } from 'vitest';
import type { LabReportPayload } from '../types';
import type { Order } from '@/types';
import {
  buildLabReportHeaderModel,
  formatHeaderDate,
  formatHeaderDateTime,
  formatRequestValue,
} from './reportPDFHeader';

function payload(overrides: Partial<LabReportPayload> = {}): LabReportPayload {
  const order: Order = {
    orderId: 293509,
    patientId: 1,
    patientName: 'Ngouelondele Maro Grace Divina',
    orderDate: '2026-10-02T08:36:00',
    totalPrice: 0,
    paymentStatus: 'unpaid',
    overallStatus: 'validated',
    priority: 'low',
    createdBy: '1',
    createdAt: '2026-10-02T08:36:00',
    updatedAt: '2026-10-02T08:36:00',
    referringPhysician: 'Vantadori Luana',
    ...((overrides.order as Partial<Order> | undefined) ?? {}),
  };
  return {
    order,
    patientId: 1,
    patientName: 'Ngouelondele Maro Grace Divina',
    patientDob: '2004-06-10',
    patientAge: 22,
    patientGender: 'female',
    timestamps: {
      registeredAt: '2026-10-02T08:36:00',
      collectedAt: '2026-10-02T08:36:00',
      acceptedAt: '2026-10-05T11:52:00',
      reportedAt: '2026-10-05T14:50:00',
    },
    testResults: [],
    ...overrides,
    order,
  };
}

describe('formatHeaderDate', () => {
  it('formats ISO dates as dd/MM/yyyy', () => {
    expect(formatHeaderDate('2004-06-10')).toBe('10/06/2004');
    expect(formatHeaderDate(new Date(2026, 9, 2, 8, 36, 0))).toBe('02/10/2026');
  });

  it('returns empty string for missing or invalid dates', () => {
    expect(formatHeaderDate(undefined)).toBe('');
    expect(formatHeaderDate('not-a-date')).toBe('');
  });
});

describe('formatHeaderDateTime', () => {
  it('formats date and clock with a Time label', () => {
    const local = new Date(2026, 9, 2, 8, 36, 0);
    expect(formatHeaderDateTime(local)).toBe('02/10/2026 Time: 08:36');
  });

  it('returns empty string when the value is missing', () => {
    expect(formatHeaderDateTime(null)).toBe('');
  });
});

describe('formatRequestValue', () => {
  it('joins the order display id with date and time', () => {
    const local = new Date(2026, 9, 2, 8, 36, 0);
    expect(formatRequestValue(293509, local)).toBe(
      'ORD293509 of 02/10/2026 Time: 08:36'
    );
  });

  it('returns a dash for an invalid order id', () => {
    expect(formatRequestValue(-1, '2026-10-02T08:36:00Z')).toBe('—');
  });

  it('keeps the order id when the date is missing', () => {
    expect(formatRequestValue(12, undefined)).toBe('ORD0012');
  });
});

describe('buildLabReportHeaderModel', () => {
  it('maps request metadata on the left and patient identity on the right', () => {
    const printedAt = new Date(2026, 9, 5, 14, 50, 0);
    const model = buildLabReportHeaderModel(payload(), printedAt);

    expect(model.left.map(field => field.label)).toEqual([
      'Department',
      'Request',
      'Collection Date',
      'Print Date',
      'Lab Acceptance',
      'Prescriber',
    ]);
    expect(model.left[1]?.value).toBe('ORD293509 of 02/10/2026 Time: 08:36');
    expect(model.left[2]?.value).toBe('02/10/2026 Time: 08:36');
    expect(model.left[3]?.value).toBe('05/10/2026 Time: 14:50');
    expect(model.left[4]?.value).toBe('05/10/2026 Time: 11:52');
    expect(model.left[5]?.value).toBe('Vantadori Luana');

    expect(model.right[0]).toEqual([
      { label: 'Patient', value: 'NGOUELONDELE MARO GRACE DIVINA', valueSize: 10 },
    ]);
    expect(model.right[1]).toEqual([
      { label: 'Date of Birth', value: '10/06/2004' },
      { label: 'Age', value: '22 Years' },
    ]);
    expect(model.right[2]).toEqual([{ label: 'Sex', value: 'F' }]);
    expect(model.right[3]).toEqual([{ label: 'MRN', value: 'PAT0001' }]);
  });

  it('uses a dash when collection and prescriber are missing', () => {
    const model = buildLabReportHeaderModel(
      payload({
        timestamps: { registeredAt: '2026-10-02T08:36:00' },
        order: {
          ...payload().order,
          referringPhysician: '',
        },
      })
    );

    expect(model.left[2]?.value).toBe('—');
    expect(model.left[4]?.value).toBe('—');
    expect(model.left[5]?.value).toBe('—');
  });
});
