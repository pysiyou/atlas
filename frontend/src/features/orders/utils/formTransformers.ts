/**
 * Order Form Data Transformers
 * Transforms between form structure (with testCodes) and API structure (with tests)
 */

import type { Order, OrderTest } from '@/types';
import type { OrderFormInput } from '../schemas/order.schema';

type OrderTestCodeSource = Pick<OrderTest, 'testCode' | 'status'>;

export function getActiveOrderTestCodes(tests: OrderTestCodeSource[] = []): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const test of tests) {
    if (test.status === 'superseded' || test.status === 'removed') continue;
    if (!seen.has(test.testCode)) {
      seen.add(test.testCode);
      codes.push(test.testCode);
    }
  }
  return codes;
}

/**
 * Transform Order from API to form input structure
 * Converts tests array to testCodes array for form
 */
export function orderToFormInput(order?: Partial<Order>): Partial<OrderFormInput> {
  if (!order) {
    return {};
  }

  return {
    patientId: order.patientId,
    referringPhysician: order.referringPhysician || '',
    priority: order.priority || 'low',
    clinicalNotes: order.clinicalNotes || '',
    testCodes: getActiveOrderTestCodes(order.tests ?? []),
    // paymentMethod is form-only, not in Order type
  };
}

/**
 * Transform form input to API payload
 * Converts testCodes array to tests array with { testCode } objects
 */
export function formInputToPayload(formData: Partial<OrderFormInput>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Copy all fields except testCodes
  if (formData.patientId !== undefined) payload.patientId = formData.patientId;
  if (formData.referringPhysician !== undefined)
    payload.referringPhysician = formData.referringPhysician;
  if (formData.priority !== undefined) payload.priority = formData.priority;
  if (formData.clinicalNotes !== undefined) payload.clinicalNotes = formData.clinicalNotes;

  // Transform testCodes to tests format
  if (formData.testCodes && formData.testCodes.length > 0) {
    payload.tests = formData.testCodes.map(code => ({ testCode: code }));
  }

  // paymentMethod is not sent to order API (handled separately)

  return payload;
}
