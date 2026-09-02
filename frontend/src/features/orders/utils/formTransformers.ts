/**
 * Order Form Data Transformers
 * Transforms between form structure (with testCodes) and API structure (with tests)
 */

import type { OrderTest } from '@/types';
import type { OrderFormInput, Order } from '../schemas/order.schema';
import { getActiveTests } from './orderCalculator';

/**
 * Unique active catalog test codes for order edit forms.
 * Excludes superseded/removed rows and dedupes retest chains that share a code.
 */
export function getActiveOrderTestCodes(tests: OrderTest[] = []): string[] {
  const seen = new Set<string>();
  const codes: string[] = [];
  for (const test of getActiveTests(tests)) {
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
