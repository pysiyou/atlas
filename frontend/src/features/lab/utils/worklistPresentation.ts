/**
 * Presentation helpers for flat worklist API rows.
 */

import {
  buildWorklistRowPresentation,
  type WorklistRowSource,
} from '@/utils/presentation';

export type { WorklistRowSource };

export function toWorklistRowSource(item: {
  orderId: number;
  patientId: number;
  patientName: string;
  patientDob?: string | null;
  patientGender?: string | null;
  testName: string;
  testCode: string;
  orderDate?: string;
  referentDoctor?: string | null;
  status: string;
  statusPresentation?: WorklistRowSource['statusPresentation'];
}): WorklistRowSource {
  return {
    orderId: item.orderId,
    patientId: item.patientId,
    patientName: item.patientName,
    patientDob: item.patientDob,
    patientGender: item.patientGender,
    testName: item.testName,
    testCode: item.testCode,
    orderDate: item.orderDate,
    referentDoctor: item.referentDoctor,
    status: item.status,
    statusPresentation: item.statusPresentation,
  };
}

export { buildWorklistRowPresentation };
