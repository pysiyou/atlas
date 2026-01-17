/**
 * Sample Data Generator
 * Generates samples for orders where tests have been collected
 */

import { faker } from '@faker-js/faker';
import { generateSampleId } from '../utils/id-generator';
import { pickOne, chance } from '../utils/probability';
import { addMinutes, toISOString, getWorkingHoursTime } from '../utils/date-utils';

// Types (matching src/types/sample.ts)
type SampleType = 'blood' | 'urine' | 'stool' | 'swab' | 'tissue' | 'csf' | 'sputum' | 'plasma' | 'serum' | 'other';
type ContainerType = 'cup' | 'tube';
type ContainerTopColor = 'red' | 'yellow' | 'purple' | 'blue' | 'green' | 'gray' | 'black';
type PriorityLevel = 'routine' | 'urgent' | 'stat';

interface BaseSample {
  sampleId: string;
  orderId: string;
  sampleType: SampleType;
  testCodes: string[];
  requiredVolume: number;
  priority: PriorityLevel;
  requiredContainerTypes: ContainerType[];
  requiredContainerColors: ContainerTopColor[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

interface PendingSample extends BaseSample {
  status: 'pending';
}

interface CollectedSample extends BaseSample {
  status: 'collected';
  collectedAt: string;
  collectedBy: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
  remainingVolume?: number;
}

type Sample = PendingSample | CollectedSample;

// Test catalog entry (simplified)
interface TestCatalogEntry {
  test_code: string;
  mapped_sample_type: string;
  container_types: ContainerType[];
  container_top_colors: ContainerTopColor[];
  sample: {
    minimum_volume_ml: number;
  };
}

// Order type (simplified)
interface Order {
  orderId: string;
  orderDate: string;
  priority: PriorityLevel;
  tests: Array<{
    testCode: string;
    status: string;
    sampleId?: string;
  }>;
}

// Staff IDs
const STAFF_IDS = ['USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005'];
const PHLEBOTOMIST_IDS = ['USR-003', 'USR-004', 'USR-005'];

// Collection notes
const COLLECTION_NOTES = [
  'Routine collection, no issues',
  'Difficult venipuncture, butterfly needle used',
  'Patient anxious, extra care taken',
  'Multiple attempts required',
  'Good flow, clean draw',
  'Small vein, slow draw',
  'Patient reported dizziness after collection',
];

/**
 * Group tests by sample requirements
 */
function groupTestsBySampleType(
  order: Order,
  testCatalog: Map<string, TestCatalogEntry>
): Map<string, {
  testCodes: string[];
  sampleType: SampleType;
  containerTypes: ContainerType[];
  containerColors: ContainerTopColor[];
  totalVolume: number;
}> {
  const groups = new Map<string, {
    testCodes: string[];
    sampleType: SampleType;
    containerTypes: ContainerType[];
    containerColors: ContainerTopColor[];
    totalVolume: number;
  }>();

  for (const test of order.tests) {
    const catalogEntry = testCatalog.get(test.testCode);
    if (!catalogEntry) continue;

    const sampleType = catalogEntry.mapped_sample_type.toLowerCase() as SampleType;
    const key = `${sampleType}-${catalogEntry.container_top_colors.sort().join(',')}`;

    if (!groups.has(key)) {
      groups.set(key, {
        testCodes: [],
        sampleType: sampleType || 'blood',
        containerTypes: catalogEntry.container_types || ['tube'],
        containerColors: catalogEntry.container_top_colors || ['red'],
        totalVolume: 0,
      });
    }

    const group = groups.get(key)!;
    group.testCodes.push(test.testCode);
    group.totalVolume += catalogEntry.sample.minimum_volume_ml || 3;
  }

  return groups;
}

/**
 * Check if order has any collected tests
 */
function hasCollectedTests(order: Order): boolean {
  const collectedStatuses = ['collected', 'in-progress', 'completed', 'validated', 'reported'];
  return order.tests.some(t => collectedStatuses.includes(t.status));
}

/**
 * Check if order only has ordered tests (pending collection)
 */
function hasOnlyOrderedTests(order: Order): boolean {
  return order.tests.every(t => t.status === 'ordered');
}

/**
 * Generate samples for an order
 */
function generateSamplesForOrder(
  order: Order,
  testCatalog: Map<string, TestCatalogEntry>
): Sample[] {
  const samples: Sample[] = [];
  const orderDate = new Date(order.orderDate);
  const staffId = pickOne(STAFF_IDS);

  // Group tests by sample requirements
  const sampleGroups = groupTestsBySampleType(order, testCatalog);

  // Determine if samples are collected or pending
  const isCollected = hasCollectedTests(order);
  const isPending = hasOnlyOrderedTests(order);

  for (const [, group] of sampleGroups) {
    const sampleId = generateSampleId(orderDate);
    const createdAt = getWorkingHoursTime(orderDate);

    const baseSample: BaseSample = {
      sampleId,
      orderId: order.orderId,
      sampleType: group.sampleType,
      testCodes: group.testCodes,
      requiredVolume: group.totalVolume,
      priority: order.priority,
      requiredContainerTypes: group.containerTypes,
      requiredContainerColors: group.containerColors,
      createdAt: toISOString(createdAt),
      createdBy: staffId,
      updatedAt: toISOString(createdAt),
      updatedBy: staffId,
    };

    if (isCollected) {
      // Create collected sample
      const collectedAt = addMinutes(createdAt, faker.number.int({ min: 30, max: 180 }));
      const collectedVolume = group.totalVolume + faker.number.float({ min: 0.5, max: 2, fractionDigits: 1 });

      const collectedSample: CollectedSample = {
        ...baseSample,
        status: 'collected',
        collectedAt: toISOString(collectedAt),
        collectedBy: pickOne(PHLEBOTOMIST_IDS),
        collectedVolume,
        actualContainerType: group.containerTypes[0] || 'tube',
        actualContainerColor: group.containerColors[0] || 'red',
      };

      // Add optional fields
      if (chance(20)) {
        collectedSample.collectionNotes = pickOne(COLLECTION_NOTES);
      }

      if (chance(30) && collectedVolume > 2) {
        const maxRemaining = Math.max(0.6, collectedVolume * 0.3);
        collectedSample.remainingVolume = faker.number.float({
          min: 0.5,
          max: maxRemaining,
          fractionDigits: 1
        });
      }

      samples.push(collectedSample);
    } else if (isPending) {
      // Create pending sample
      const pendingSample: PendingSample = {
        ...baseSample,
        status: 'pending',
      };

      samples.push(pendingSample);
    }
  }

  return samples;
}

/**
 * Generate all samples and update order test references
 */
export function generateSamples(
  orders: Order[],
  testCatalogArray: TestCatalogEntry[]
): { samples: Sample[]; updatedOrders: Order[] } {
  console.log(`\n🧪 Generating samples for ${orders.length} orders...`);

  // Create test catalog map for quick lookup
  const testCatalog = new Map<string, TestCatalogEntry>();
  for (const test of testCatalogArray) {
    testCatalog.set(test.test_code, test);
  }

  const allSamples: Sample[] = [];
  const updatedOrders: Order[] = [];

  for (const order of orders) {
    // Generate samples for this order
    const samples = generateSamplesForOrder(order, testCatalog);
    allSamples.push(...samples);

    // Update order tests with sample IDs
    const updatedOrder = { ...order, tests: [...order.tests] };

    for (const sample of samples) {
      for (let i = 0; i < updatedOrder.tests.length; i++) {
        if (sample.testCodes.includes(updatedOrder.tests[i].testCode)) {
          updatedOrder.tests[i] = {
            ...updatedOrder.tests[i],
            sampleId: sample.sampleId,
          };
        }
      }
    }

    updatedOrders.push(updatedOrder);
  }

  // Log statistics
  const stats = {
    total: allSamples.length,
    collected: allSamples.filter(s => s.status === 'collected').length,
    pending: allSamples.filter(s => s.status === 'pending').length,
    bySampleType: {} as Record<string, number>,
    byContainerColor: {} as Record<string, number>,
  };

  for (const sample of allSamples) {
    stats.bySampleType[sample.sampleType] = (stats.bySampleType[sample.sampleType] || 0) + 1;

    if (sample.status === 'collected') {
      const color = (sample as CollectedSample).actualContainerColor;
      stats.byContainerColor[color] = (stats.byContainerColor[color] || 0) + 1;
    }
  }

  console.log('📊 Sample Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Collected: ${stats.collected}, Pending: ${stats.pending}`);
  console.log(`   By Type: ${Object.entries(stats.bySampleType).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`   By Container Color: ${Object.entries(stats.byContainerColor).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  return { samples: allSamples, updatedOrders };
}
