/**
 * Order Data Generator
 * Generates orders with comprehensive state coverage for testing all workflows
 */

import { faker } from '@faker-js/faker';
import { generateOrderId } from '../utils/id-generator';
import { weightedRandom, chance, pickOne, pickRandom } from '../utils/probability';
import { generateClinicalNotes, getRandomPhysician } from '../utils/medical-data';
import {
  getDateInRange,
  addHours,
  addMinutes,
  toISOString,
  getWorkingHoursTime,
} from '../utils/date-utils';

// Types (matching src/types/order.ts)
type TestStatus = 'ordered' | 'collected' | 'in-progress' | 'completed' | 'validated' | 'reported';
type OrderStatus = 'ordered' | 'in-progress' | 'completed' | 'delivered';
type PriorityLevel = 'routine' | 'urgent' | 'stat';
type PaymentStatus = 'pending' | 'partial' | 'paid';
type ResultStatus = 'normal' | 'high' | 'low' | 'critical' | 'critical-high' | 'critical-low';

interface TestResult {
  value: string | number;
  unit?: string;
  referenceRange?: string;
  status: ResultStatus;
}

interface OrderTest {
  testCode: string;
  status: TestStatus;
  priceAtOrder: number;
  sampleId?: string;
  results: Record<string, TestResult> | null;
  resultEnteredAt?: string;
  enteredBy?: string;
  resultValidatedAt?: string;
  validatedBy?: string;
  validationNotes?: string;
  flags?: string[];
  technicianNotes?: string;
  isReflexTest?: boolean;
  triggeredBy?: string;
  reflexRule?: string;
  isRepeatTest?: boolean;
  repeatReason?: string;
  originalTestId?: string;
  repeatNumber?: number;
  hasCriticalValues?: boolean;
  criticalNotificationSent?: boolean;
  criticalNotifiedAt?: string;
  criticalNotifiedTo?: string;
  criticalAcknowledgedAt?: string;
}

interface Order {
  orderId: string;
  patientId: string;
  orderDate: string;
  tests: OrderTest[];
  totalPrice: number;
  paymentStatus: PaymentStatus;
  overallStatus: OrderStatus;
  appointmentId?: string;
  scheduledCollectionTime?: string;
  specialInstructions?: string[];
  patientPrepInstructions?: string;
  clinicalNotes?: string;
  referringPhysician?: string;
  priority: PriorityLevel;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Test catalog entry type (simplified for generator)
interface TestCatalogEntry {
  test_code: string;
  display_name: string;
  price: number;
  turnaround_time_hours: number;
  result_items: Array<{
    item_code: string;
    item_name: string;
    value_type: 'NUMERIC' | 'SELECT' | 'TEXT';
    unit: string;
    decimals_suggested?: number;
    reference_range?: {
      adult_general?: { low?: number; high?: number };
      adult_male?: { low?: number; high?: number };
      adult_female?: { low?: number; high?: number };
    };
    critical_range?: { low?: number; high?: number };
    allowed_values?: string[];
  }>;
}

// Patient type (simplified)
interface Patient {
  id: string;
  fullName: string;
  gender: 'male' | 'female' | 'other';
  medicalHistory: {
    chronicConditions: string[];
  };
}

// Staff user IDs
const STAFF_IDS = ['USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005'];
const TECHNICIAN_IDS = ['USR-002', 'USR-003', 'USR-004'];
const VALIDATOR_IDS = ['USR-001', 'USR-002'];

// Special instructions
const SPECIAL_INSTRUCTIONS = [
  'Patient is fasting',
  'Difficult venipuncture - use butterfly needle',
  'Patient anxious - explain procedure',
  'Right arm only (left has IV)',
  'Patient on blood thinners',
  'Collect in AM only',
  'Time-sensitive sample',
];

// Patient prep instructions
const PREP_INSTRUCTIONS = [
  'Fasting for 10-12 hours required',
  'Avoid alcohol 24 hours before test',
  'Bring list of current medications',
  'Avoid strenuous exercise 24 hours before',
  'No fasting required',
  'Collect first morning urine',
];

// Order state configurations for comprehensive testing
interface OrderStateConfig {
  orderStatus: OrderStatus;
  testStatuses: TestStatus[];
  paymentStatus: PaymentStatus;
  weight: number;
}

const ORDER_STATE_CONFIGS: OrderStateConfig[] = [
  // Orders just placed - nothing collected
  { orderStatus: 'ordered', testStatuses: ['ordered'], paymentStatus: 'pending', weight: 15 },
  { orderStatus: 'ordered', testStatuses: ['ordered'], paymentStatus: 'partial', weight: 5 },
  { orderStatus: 'ordered', testStatuses: ['ordered'], paymentStatus: 'paid', weight: 5 },

  // In progress - samples collected
  { orderStatus: 'in-progress', testStatuses: ['collected'], paymentStatus: 'pending', weight: 8 },
  { orderStatus: 'in-progress', testStatuses: ['collected'], paymentStatus: 'paid', weight: 10 },
  { orderStatus: 'in-progress', testStatuses: ['in-progress'], paymentStatus: 'paid', weight: 8 },

  // Mixed states - some tests further along
  { orderStatus: 'in-progress', testStatuses: ['collected', 'in-progress'], paymentStatus: 'paid', weight: 5 },
  { orderStatus: 'in-progress', testStatuses: ['in-progress', 'completed'], paymentStatus: 'paid', weight: 5 },

  // Results entered but not validated
  { orderStatus: 'in-progress', testStatuses: ['completed'], paymentStatus: 'paid', weight: 8 },
  { orderStatus: 'in-progress', testStatuses: ['completed'], paymentStatus: 'pending', weight: 3 },

  // Validated - ready for reporting
  { orderStatus: 'completed', testStatuses: ['validated'], paymentStatus: 'paid', weight: 12 },
  { orderStatus: 'completed', testStatuses: ['validated'], paymentStatus: 'pending', weight: 3 },

  // Reported - fully complete
  { orderStatus: 'delivered', testStatuses: ['reported'], paymentStatus: 'paid', weight: 15 },
];

/**
 * Generate a test result value based on the result item definition
 */
function generateResultValue(
  resultItem: TestCatalogEntry['result_items'][0],
  gender: 'male' | 'female' | 'other',
  forceAbnormal: boolean = false
): { value: string | number; status: ResultStatus } {
  const { value_type, reference_range, critical_range, allowed_values, decimals_suggested } = resultItem;

  // For SELECT type, pick from allowed values
  if (value_type === 'SELECT' && allowed_values && allowed_values.length > 0) {
    const value = pickOne(allowed_values);
    // Check if it's a "normal" value
    const normalValues = ['Negative', 'Normal', 'Non-reactive', 'Clear', 'Yellow', 'Absent'];
    const isNormal = normalValues.some(n => value.toLowerCase().includes(n.toLowerCase()));
    return {
      value,
      status: isNormal ? 'normal' : (chance(30) ? 'high' : 'normal'),
    };
  }

  // For TEXT type, generate a text value
  if (value_type === 'TEXT') {
    return {
      value: 'Within normal limits',
      status: 'normal',
    };
  }

  // For NUMERIC type, generate based on reference range
  if (value_type === 'NUMERIC' && reference_range) {
    // Get appropriate range based on gender
    let range = reference_range.adult_general;
    if (gender === 'male' && reference_range.adult_male) {
      range = reference_range.adult_male;
    } else if (gender === 'female' && reference_range.adult_female) {
      range = reference_range.adult_female;
    }

    if (range && range.low !== undefined && range.high !== undefined) {
      const { low, high } = range;
      const rangeSpan = high - low;
      const decimals = decimals_suggested ?? 1;

      // Decide if value should be normal, abnormal, or critical
      let resultStatus: ResultStatus;
      let value: number;

      if (forceAbnormal || chance(20)) {
        // Generate abnormal value
        if (critical_range && chance(10)) {
          // Critical value
          if (chance(50) && critical_range.low !== undefined) {
            value = faker.number.float({
              min: critical_range.low * 0.5,
              max: critical_range.low,
              fractionDigits: decimals
            });
            resultStatus = 'critical-low';
          } else if (critical_range.high !== undefined) {
            value = faker.number.float({
              min: critical_range.high,
              max: critical_range.high * 1.5,
              fractionDigits: decimals
            });
            resultStatus = 'critical-high';
          } else {
            value = faker.number.float({ min: low, max: high, fractionDigits: decimals });
            resultStatus = 'normal';
          }
        } else {
          // Abnormal but not critical
          const offset = Math.max(0.5, rangeSpan * 0.3);
          if (chance(50)) {
            const minVal = Math.max(0, low - offset);
            const maxVal = Math.max(minVal + 0.1, low - 0.1);
            value = faker.number.float({
              min: minVal,
              max: maxVal,
              fractionDigits: decimals
            });
            resultStatus = 'low';
          } else {
            const minVal = high + 0.1;
            const maxVal = high + offset;
            value = faker.number.float({
              min: minVal,
              max: Math.max(minVal + 0.1, maxVal),
              fractionDigits: decimals
            });
            resultStatus = 'high';
          }
        }
      } else {
        // Normal value
        value = faker.number.float({ min: low, max: high, fractionDigits: decimals });
        resultStatus = 'normal';
      }

      return { value, status: resultStatus };
    }
  }

  // Fallback for items without reference ranges
  return {
    value: faker.number.float({ min: 1, max: 100, fractionDigits: 1 }),
    status: 'normal',
  };
}

/**
 * Generate test results for a test
 */
function generateTestResults(
  testEntry: TestCatalogEntry,
  gender: 'male' | 'female' | 'other',
  hasCriticalOverride: boolean = false
): { results: Record<string, TestResult>; hasCritical: boolean } {
  const results: Record<string, TestResult> = {};
  let hasCritical = false;

  for (const resultItem of testEntry.result_items) {
    const { value, status } = generateResultValue(
      resultItem,
      gender,
      hasCriticalOverride && resultItem === testEntry.result_items[0]
    );

    if (status === 'critical' || status === 'critical-high' || status === 'critical-low') {
      hasCritical = true;
    }

    // Format reference range string
    let refRangeStr: string | undefined;
    if (resultItem.reference_range) {
      const range = gender === 'male' && resultItem.reference_range.adult_male
        ? resultItem.reference_range.adult_male
        : gender === 'female' && resultItem.reference_range.adult_female
          ? resultItem.reference_range.adult_female
          : resultItem.reference_range.adult_general;

      if (range && range.low !== undefined && range.high !== undefined) {
        refRangeStr = `${range.low}-${range.high}`;
      }
    }

    results[resultItem.item_code] = {
      value,
      unit: resultItem.unit || undefined,
      referenceRange: refRangeStr,
      status,
    };
  }

  return { results, hasCritical };
}

/**
 * Generate an order test based on status requirements
 */
function generateOrderTest(
  testEntry: TestCatalogEntry,
  status: TestStatus,
  orderDate: Date,
  patient: Patient,
  forceCritical: boolean = false
): OrderTest {
  const orderTest: OrderTest = {
    testCode: testEntry.test_code,
    status,
    priceAtOrder: testEntry.price,
    results: null,
  };

  // Add data based on status progression
  const statusOrder: TestStatus[] = ['ordered', 'collected', 'in-progress', 'completed', 'validated', 'reported'];
  const statusIndex = statusOrder.indexOf(status);

  // For collected+ status, results start being entered
  if (statusIndex >= statusOrder.indexOf('completed')) {
    const { results, hasCritical } = generateTestResults(
      testEntry,
      patient.gender,
      forceCritical
    );
    orderTest.results = results;

    // Add result entry info
    const resultEnteredAt = addHours(orderDate, testEntry.turnaround_time_hours * 0.7);
    orderTest.resultEnteredAt = toISOString(resultEnteredAt);
    orderTest.enteredBy = pickOne(TECHNICIAN_IDS);

    // Add flags for abnormal results
    const abnormalResults = Object.entries(results).filter(
      ([, r]) => r.status !== 'normal'
    );
    if (abnormalResults.length > 0) {
      orderTest.flags = abnormalResults.map(([code, r]) => `${code}: ${r.status}`);
    }

    // Handle critical values
    if (hasCritical) {
      orderTest.hasCriticalValues = true;
      if (statusIndex >= statusOrder.indexOf('validated')) {
        orderTest.criticalNotificationSent = true;
        orderTest.criticalNotifiedAt = toISOString(addMinutes(resultEnteredAt, 15));
        orderTest.criticalNotifiedTo = getRandomPhysician();
        if (chance(80)) {
          orderTest.criticalAcknowledgedAt = toISOString(addMinutes(resultEnteredAt, 45));
        }
      }
    }

    // Add technician notes sometimes
    if (chance(15)) {
      orderTest.technicianNotes = pickOne([
        'Sample slightly hemolyzed',
        'Repeat requested by supervisor',
        'Manual differential performed',
        'Sample diluted 1:10',
        'QC passed',
      ]);
    }
  }

  // For validated+ status, add validation info
  if (statusIndex >= statusOrder.indexOf('validated')) {
    const validatedAt = addHours(orderDate, testEntry.turnaround_time_hours);
    orderTest.resultValidatedAt = toISOString(validatedAt);
    orderTest.validatedBy = pickOne(VALIDATOR_IDS);

    if (chance(20)) {
      orderTest.validationNotes = pickOne([
        'Results consistent with clinical presentation',
        'Recommend follow-up testing',
        'Values within expected range for patient condition',
        'No delta check failures',
      ]);
    }
  }

  return orderTest;
}

/**
 * Generate number of tests per order with weighted distribution
 */
function generateTestCount(): number {
  return weightedRandom([
    [1, 40],
    [2, 35],
    [3, 15],
    [4, 7],
    [5, 3],
  ]);
}

/**
 * Generate an order
 */
function generateOrder(
  patient: Patient,
  testCatalog: TestCatalogEntry[],
  stateConfig: OrderStateConfig,
  orderDate: Date,
  forceCritical: boolean = false
): Order {
  const orderId = generateOrderId(orderDate);
  const createdAt = getWorkingHoursTime(orderDate);
  const staffId = pickOne(STAFF_IDS);

  // Select tests for this order
  const testCount = generateTestCount();
  const selectedTests = pickRandom(testCatalog, testCount);

  // Generate tests with appropriate statuses
  const tests: OrderTest[] = selectedTests.map((testEntry, index) => {
    // For mixed status configs, distribute statuses
    const testStatus = stateConfig.testStatuses.length > 1
      ? stateConfig.testStatuses[index % stateConfig.testStatuses.length]
      : stateConfig.testStatuses[0];

    return generateOrderTest(
      testEntry,
      testStatus,
      orderDate,
      patient,
      forceCritical && index === 0
    );
  });

  // Calculate total price
  const totalPrice = tests.reduce((sum, t) => sum + t.priceAtOrder, 0);

  // Generate priority
  const priority = weightedRandom<PriorityLevel>([
    ['routine', 75],
    ['urgent', 20],
    ['stat', 5],
  ]);

  // Build order
  const order: Order = {
    orderId,
    patientId: patient.id,
    orderDate: toISOString(orderDate),
    tests,
    totalPrice,
    paymentStatus: stateConfig.paymentStatus,
    overallStatus: stateConfig.orderStatus,
    priority,
    createdBy: staffId,
    createdAt: toISOString(createdAt),
    updatedAt: toISOString(addHours(createdAt, faker.number.int({ min: 1, max: 48 }))),
  };

  // Add optional fields
  if (chance(40)) {
    order.referringPhysician = getRandomPhysician();
  }

  if (chance(30)) {
    order.clinicalNotes = generateClinicalNotes(patient.medicalHistory.chronicConditions);
  }

  if (chance(20)) {
    order.specialInstructions = pickRandom(SPECIAL_INSTRUCTIONS, faker.number.int({ min: 1, max: 2 }));
  }

  if (chance(25)) {
    order.patientPrepInstructions = pickOne(PREP_INSTRUCTIONS);
  }

  return order;
}

/**
 * Generate all orders
 */
export function generateOrders(
  patients: Patient[],
  testCatalog: TestCatalogEntry[],
  targetCount: number = 200
): Order[] {
  console.log(`\n📋 Generating ${targetCount} orders...`);

  const orders: Order[] = [];

  // Track which patients have orders
  const patientOrderCounts = new Map<string, number>();

  // Generate orders distributed across state configs
  for (let i = 0; i < targetCount; i++) {
    // Select state config based on weights
    const stateConfig = weightedRandom(
      ORDER_STATE_CONFIGS.map(c => [c, c.weight] as [OrderStateConfig, number])
    );

    // Select patient - favor patients with fewer orders
    const availablePatients = patients.filter(p => {
      const count = patientOrderCounts.get(p.id) || 0;
      return count < 5; // Max 5 orders per patient
    });

    if (availablePatients.length === 0) {
      // All patients have max orders, pick any
      const patient = pickOne(patients);
      patientOrderCounts.set(patient.id, (patientOrderCounts.get(patient.id) || 0) + 1);

      const orderDate = getDateInRange(30, 0);
      const forceCritical = chance(5); // 5% of orders have critical values
      const order = generateOrder(patient, testCatalog, stateConfig, orderDate, forceCritical);
      orders.push(order);
    } else {
      // Prefer patients with fewer orders
      const patient = pickOne(availablePatients);
      patientOrderCounts.set(patient.id, (patientOrderCounts.get(patient.id) || 0) + 1);

      const orderDate = getDateInRange(30, 0);
      const forceCritical = chance(5);
      const order = generateOrder(patient, testCatalog, stateConfig, orderDate, forceCritical);
      orders.push(order);
    }
  }

  // Sort by order date
  orders.sort((a, b) =>
    new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
  );

  // Log statistics
  const stats = {
    total: orders.length,
    byStatus: {
      ordered: orders.filter(o => o.overallStatus === 'ordered').length,
      inProgress: orders.filter(o => o.overallStatus === 'in-progress').length,
      completed: orders.filter(o => o.overallStatus === 'completed').length,
      delivered: orders.filter(o => o.overallStatus === 'delivered').length,
    },
    byPayment: {
      pending: orders.filter(o => o.paymentStatus === 'pending').length,
      partial: orders.filter(o => o.paymentStatus === 'partial').length,
      paid: orders.filter(o => o.paymentStatus === 'paid').length,
    },
    byPriority: {
      routine: orders.filter(o => o.priority === 'routine').length,
      urgent: orders.filter(o => o.priority === 'urgent').length,
      stat: orders.filter(o => o.priority === 'stat').length,
    },
    withCriticalValues: orders.filter(o =>
      o.tests.some(t => t.hasCriticalValues)
    ).length,
    patientsWithOrders: patientOrderCounts.size,
    patientsWithoutOrders: patients.length - patientOrderCounts.size,
  };

  console.log('📊 Order Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   By Status: Ordered=${stats.byStatus.ordered}, In-Progress=${stats.byStatus.inProgress}, Completed=${stats.byStatus.completed}, Delivered=${stats.byStatus.delivered}`);
  console.log(`   By Payment: Pending=${stats.byPayment.pending}, Partial=${stats.byPayment.partial}, Paid=${stats.byPayment.paid}`);
  console.log(`   By Priority: Routine=${stats.byPriority.routine}, Urgent=${stats.byPriority.urgent}, STAT=${stats.byPriority.stat}`);
  console.log(`   With Critical Values: ${stats.withCriticalValues}`);
  console.log(`   Patients with orders: ${stats.patientsWithOrders}/${patients.length}`);

  return orders;
}
