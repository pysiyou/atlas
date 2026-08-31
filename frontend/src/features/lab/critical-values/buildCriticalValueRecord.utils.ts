/**
 * Maps an enriched lab test to a CriticalValueRecord for notification UI.
 */

import type { CriticalValueRecord } from './criticalValues.api';
import type { TestWithContext } from '@/types';

export type TestWithCriticalFields = TestWithContext & {
  id?: number;
  criticalNotificationSent?: boolean;
  criticalNotifiedAt?: string;
  criticalNotifiedTo?: string;
  criticalAcknowledgedAt?: string;
};

export function buildCriticalValueRecord(
  test: TestWithCriticalFields
): CriticalValueRecord | null {
  if (!test.hasCriticalValues || test.id == null) {
    return null;
  }

  return {
    id: test.id,
    orderId: test.orderId,
    testCode: test.testCode,
    testName: test.testName,
    patientId: test.patientId,
    patientName: test.patientName,
    flags: test.flags,
    criticalNotificationSent: test.criticalNotificationSent ?? false,
    criticalNotifiedAt: test.criticalNotifiedAt,
    criticalNotifiedTo: test.criticalNotifiedTo,
    criticalAcknowledgedAt: test.criticalAcknowledgedAt,
    resultEnteredAt: test.resultEnteredAt,
    status: test.status,
  };
}
