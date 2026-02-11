/**
 * Test factories for Order entities
 * Uses @faker-js/faker for realistic test data
 */

import { faker } from '@faker-js/faker';
import type { Order, OrderTest, TestResult } from '@/types';

/**
 * Creates a mock TestResult object
 */
export const createMockTestResult = (overrides?: Partial<TestResult>): TestResult => ({
  value: faker.number.float({ min: 10, max: 100, fractionDigits: 2 }),
  unit: faker.helpers.arrayElement(['mg/dL', 'mmol/L', 'U/L', '%']),
  referenceRange: '10-100',
  status: faker.helpers.arrayElement(['normal', 'high', 'low', 'critical']),
  ...overrides,
});

/**
 * Creates a mock OrderTest object
 */
export const createMockOrderTest = (overrides?: Partial<OrderTest>): OrderTest => {
  const hasResults = faker.datatype.boolean();

  return {
    id: faker.number.int({ min: 1, max: 10000 }),
    testCode: `TST-${faker.string.numeric(3)}`,
    testName: faker.helpers.arrayElement([
      'Complete Blood Count',
      'Lipid Panel',
      'Glucose Test',
      'Thyroid Panel',
      'Liver Function Test',
    ]),
    sampleType: faker.helpers.arrayElement(['blood', 'urine', 'serum', 'plasma']),
    status: faker.helpers.arrayElement([
      'pending',
      'sample-collected',
      'in-progress',
      'resulted',
      'validated',
    ]) as 'pending' | 'sample-collected' | 'in-progress' | 'resulted' | 'validated',
    priceAtOrder: faker.number.float({ min: 10, max: 200, fractionDigits: 2 }),
    sampleId: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 5000 }) : undefined,
    results: hasResults
      ? {
          glucose: createMockTestResult(),
          cholesterol: createMockTestResult(),
        }
      : null,
    resultEnteredAt: hasResults ? faker.date.recent().toISOString() : undefined,
    enteredBy: hasResults ? faker.person.fullName() : undefined,
    technicianNotes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    flags: faker.datatype.boolean() ? ['hemolyzed', 'lipemic'] : undefined,
    createdAt: faker.date.recent().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  };
};

/**
 * Creates a mock Order object with realistic data
 */
export const createMockOrder = (overrides?: Partial<Order>): Order => {
  const createdAt = faker.date.past().toISOString();
  const testsCount = faker.number.int({ min: 1, max: 5 });
  const tests = Array.from({ length: testsCount }, () => createMockOrderTest());
  const totalPrice = tests.reduce((sum, test) => sum + test.priceAtOrder, 0);

  return {
    orderId: faker.number.int({ min: 1, max: 10000 }),
    patientId: faker.number.int({ min: 1, max: 5000 }),
    patientName: faker.person.fullName(),
    orderDate: createdAt,
    tests,
    totalPrice,
    paymentStatus: faker.helpers.arrayElement(['pending', 'paid']),
    overallStatus: faker.helpers.arrayElement(['ordered', 'in-progress', 'completed']) as
      | 'ordered'
      | 'in-progress'
      | 'completed',
    appointmentId: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 3000 }) : undefined,
    scheduledCollectionTime: faker.datatype.boolean()
      ? faker.date.future().toISOString()
      : undefined,
    specialInstructions: faker.datatype.boolean() ? [faker.lorem.sentence()] : undefined,
    patientPrepInstructions: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    clinicalNotes: faker.datatype.boolean() ? faker.lorem.paragraph() : undefined,
    referringPhysician: faker.datatype.boolean() ? faker.person.fullName() : undefined,
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
    createdBy: String(faker.number.int({ min: 1, max: 100 })),
    createdAt,
    updatedAt: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
    ...overrides,
  };
};

/**
 * Creates an array of mock orders
 */
export const createMockOrders = (count: number, overrides?: Partial<Order>): Order[] => {
  return Array.from({ length: count }, () => createMockOrder(overrides));
};
