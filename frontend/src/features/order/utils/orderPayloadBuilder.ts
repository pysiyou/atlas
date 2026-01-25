/**
 * Order Payload Builder
 * Builds payloads for order creation and updates
 */

import type { Order, OrderTest, Patient, Test } from '@/types';
import type { OrderFormData } from '../hooks/useOrderForm';

/**
 * Builds validated order tests payload from selected test codes.
 */
function buildOrderTests(selectedTestCodes: string[], activeTests: Test[]): OrderTest[] {
  return selectedTestCodes.map(testCode => {
    const test = activeTests.find(t => t.code === testCode);
    if (!test) throw new Error(`Test ${testCode} not found`);
    return {
      testCode: test.code,
      testName: test.name,
      sampleType: test.sampleType,
      status: 'pending',
      priceAtOrder: test.price,
      results: null,
    };
  });
}

/**
 * Builds a new order payload for creation.
 */
export function buildNewOrderPayload(
  formData: OrderFormData,
  selectedPatient: Patient,
  activeTests: Test[],
  currentUserId: number
): Omit<Order, 'orderId'> & { orderId?: number } {
  const now = new Date().toISOString();
  const orderTests = buildOrderTests(formData.selectedTests, activeTests);
  const totalPrice = orderTests.reduce((sum, test) => sum + test.priceAtOrder, 0);

  return {
    orderId: 0, // Temporary - backend will assign real ID
    patientId:
      typeof selectedPatient.id === 'string'
        ? parseInt(selectedPatient.id, 10)
        : selectedPatient.id,
    patientName: selectedPatient.fullName,
    orderDate: now,
    referringPhysician: formData.referringPhysician.trim() || undefined,
    tests: orderTests,
    priority: formData.priority,
    clinicalNotes: formData.clinicalNotes.trim() || undefined,
    totalPrice,
    paymentStatus: 'unpaid',
    overallStatus: 'ordered',
    createdBy: currentUserId,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Builds an updated order payload for PUT /orders/:id.
 * Includes editable order data; backend sets updatedBy from current user.
 */
export function buildUpdatedOrderPayload(
  formData: OrderFormData,
  existingOrder: Order,
  activeTests: Test[]
): Partial<Order> & { tests?: Array<{ testCode: string }> } {
  // Calculate new total price:
  // - Keep price for existing tests (use their priceAtOrder)
  // - Add current price for new tests
  const existingTestCodes = new Set(existingOrder.tests.map(t => t.testCode));
  const newTestCodes = formData.selectedTests.filter(code => !existingTestCodes.has(code));
  
  const existingTestsPrice = existingOrder.tests
    .filter(t => formData.selectedTests.includes(t.testCode))
    .reduce((sum, test) => sum + test.priceAtOrder, 0);
  
  const newTestsPrice = newTestCodes.reduce((sum, testCode) => {
    const test = activeTests.find(t => t.code === testCode);
    return sum + (test?.price || 0);
  }, 0);
  
  const totalPrice = existingTestsPrice + newTestsPrice;

  // Build tests array for backend (list of test codes)
  const tests = formData.selectedTests.map(testCode => ({ testCode }));

  const payload: Partial<Order> & { tests?: Array<{ testCode: string }> } = {
    referringPhysician: formData.referringPhysician.trim() || undefined,
    priority: formData.priority,
    clinicalNotes: formData.clinicalNotes.trim() || undefined,
    totalPrice,
    tests, // Send tests array to backend for add/remove logic
  };

  return payload;
}

/**
 * Gets test codes to add (new tests not in existing order)
 */
export function getTestsToAdd(
  selectedTestCodes: string[],
  existingOrder: Order
): string[] {
  const existingTestCodes = new Set(existingOrder.tests.map(t => t.testCode));
  return selectedTestCodes.filter(code => !existingTestCodes.has(code));
}

/**
 * Gets test codes to remove (existing tests not in selected)
 */
export function getTestsToRemove(
  selectedTestCodes: string[],
  existingOrder: Order
): string[] {
  const selectedSet = new Set(selectedTestCodes);
  return existingOrder.tests
    .filter(t => !selectedSet.has(t.testCode))
    .map(t => t.testCode);
}
