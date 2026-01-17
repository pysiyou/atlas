/**
 * Aliquot Data Generator
 * Generates aliquots from collected samples
 */

import { faker } from '@faker-js/faker';
import { generateAliquotId } from '../utils/id-generator';
import { pickOne, chance, weightedRandom } from '../utils/probability';
import { addMinutes, toISOString } from '../utils/date-utils';

// Types (matching src/types/aliquot.ts)
type AliquotStatus = 'available' | 'in-use' | 'consumed' | 'stored' | 'disposed';
type ContainerType = 'cup' | 'tube';

interface Aliquot {
  aliquotId: string;
  parentSampleId: string;
  orderId: string;
  patientId: string;
  aliquotNumber: number;
  volume: number;
  remainingVolume: number;
  linkedTestCodes: string[];
  purpose?: string;
  containerType: ContainerType;
  barcode: string;
  status: AliquotStatus;
  currentLocation: string;
  createdAt: string;
  createdBy: string;
  usedForTests: string[];
  consumedAt: string | null;
  consumedBy: string | null;
  storageLocation?: string;
  storageConditions?: string;
  disposedAt: string | null;
  disposedBy: string | null;
}

// Sample type (simplified)
interface CollectedSample {
  sampleId: string;
  orderId: string;
  status: 'collected';
  testCodes: string[];
  collectedAt: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
}

// Order type (simplified)
interface Order {
  orderId: string;
  patientId: string;
  tests: Array<{
    testCode: string;
    status: string;
  }>;
}

// Staff IDs
const TECHNICIAN_IDS = ['USR-002', 'USR-003', 'USR-004'];

// Locations
const WORKSTATION_LOCATIONS = [
  'Hematology Station',
  'Chemistry Analyzer',
  'Immunoassay Station',
  'Microbiology Lab',
  'Coagulation Station',
  'Urinalysis Station',
];

const STORAGE_LOCATIONS = [
  'Refrigerator A',
  'Refrigerator B',
  'Freezer -20°C',
  'Freezer -80°C',
  'Room Temperature Storage',
];

const STORAGE_CONDITIONS = [
  '2-8°C',
  '-20°C',
  '-80°C',
  'Room temperature',
  'Protected from light',
];

const ALIQUOT_PURPOSES = [
  'Primary testing',
  'Backup/retest',
  'Sendout laboratory',
  'Quality control',
  'Archive',
];

/**
 * Generate barcode for aliquot
 */
function generateBarcode(sampleId: string, aliquotNumber: number): string {
  const baseCode = sampleId.replace(/-/g, '');
  return `${baseCode}A${aliquotNumber.toString().padStart(2, '0')}`;
}

/**
 * Generate aliquots for a collected sample
 */
function generateAliquotsForSample(
  sample: CollectedSample,
  order: Order
): Aliquot[] {
  const aliquots: Aliquot[] = [];
  const collectedAt = new Date(sample.collectedAt);
  const staffId = pickOne(TECHNICIAN_IDS);

  // Determine number of aliquots based on number of tests and volume
  const numTests = sample.testCodes.length;
  const numAliquots = Math.min(numTests, Math.ceil(sample.collectedVolume / 2));

  if (numAliquots === 0) return aliquots;

  // Distribute volume among aliquots
  const volumePerAliquot = sample.collectedVolume / numAliquots;
  const testsPerAliquot = Math.ceil(numTests / numAliquots);

  for (let i = 0; i < numAliquots; i++) {
    const aliquotNumber = i + 1;
    const aliquotDate = addMinutes(collectedAt, faker.number.int({ min: 15, max: 60 }));

    // Assign tests to this aliquot
    const startIdx = i * testsPerAliquot;
    const endIdx = Math.min(startIdx + testsPerAliquot, numTests);
    const linkedTests = sample.testCodes.slice(startIdx, endIdx);

    // Determine status based on order test statuses
    const orderTests = order.tests.filter(t => linkedTests.includes(t.testCode));
    const allCompleted = orderTests.every(t =>
      ['completed', 'validated', 'reported'].includes(t.status)
    );
    const anyInProgress = orderTests.some(t => t.status === 'in-progress');

    let status: AliquotStatus;
    let usedForTests: string[] = [];
    let consumedAt: string | null = null;
    let consumedBy: string | null = null;

    if (allCompleted) {
      status = weightedRandom<AliquotStatus>([
        ['consumed', 50],
        ['stored', 30],
        ['disposed', 20],
      ]);
      usedForTests = linkedTests;

      if (status === 'consumed' || status === 'disposed') {
        consumedAt = toISOString(addMinutes(aliquotDate, faker.number.int({ min: 60, max: 240 })));
        consumedBy = pickOne(TECHNICIAN_IDS);
      }
    } else if (anyInProgress) {
      status = 'in-use';
      usedForTests = linkedTests.slice(0, Math.ceil(linkedTests.length / 2));
    } else {
      status = 'available';
    }

    const volume = parseFloat(volumePerAliquot.toFixed(1));
    const remainingVolume = status === 'consumed'
      ? 0
      : status === 'in-use'
        ? parseFloat((volume * 0.5).toFixed(1))
        : volume;

    const aliquot: Aliquot = {
      aliquotId: generateAliquotId(aliquotDate),
      parentSampleId: sample.sampleId,
      orderId: sample.orderId,
      patientId: order.patientId,
      aliquotNumber,
      volume,
      remainingVolume,
      linkedTestCodes: linkedTests,
      containerType: sample.actualContainerType,
      barcode: generateBarcode(sample.sampleId, aliquotNumber),
      status,
      currentLocation: status === 'stored'
        ? pickOne(STORAGE_LOCATIONS)
        : pickOne(WORKSTATION_LOCATIONS),
      createdAt: toISOString(aliquotDate),
      createdBy: staffId,
      usedForTests,
      consumedAt,
      consumedBy,
      disposedAt: status === 'disposed' ? consumedAt : null,
      disposedBy: status === 'disposed' ? consumedBy : null,
    };

    // Add optional fields
    if (chance(30)) {
      aliquot.purpose = pickOne(ALIQUOT_PURPOSES);
    }

    if (status === 'stored') {
      aliquot.storageLocation = aliquot.currentLocation;
      aliquot.storageConditions = pickOne(STORAGE_CONDITIONS);
    }

    aliquots.push(aliquot);
  }

  return aliquots;
}

/**
 * Generate all aliquots from collected samples
 */
export function generateAliquots(
  samples: Array<{ sampleId: string; orderId: string; status: string; testCodes: string[]; collectedAt?: string; collectedVolume?: number; actualContainerType?: ContainerType }>,
  orders: Order[]
): Aliquot[] {
  console.log(`\n🧫 Generating aliquots from ${samples.length} samples...`);

  // Create order map for quick lookup
  const orderMap = new Map<string, Order>();
  for (const order of orders) {
    orderMap.set(order.orderId, order);
  }

  const allAliquots: Aliquot[] = [];

  // Only create aliquots for collected samples
  const collectedSamples = samples.filter(s => s.status === 'collected') as CollectedSample[];

  for (const sample of collectedSamples) {
    const order = orderMap.get(sample.orderId);
    if (!order) continue;

    // Only create aliquots for ~60% of collected samples
    if (!chance(60)) continue;

    const aliquots = generateAliquotsForSample(sample, order);
    allAliquots.push(...aliquots);
  }

  // Log statistics
  const stats = {
    total: allAliquots.length,
    byStatus: {
      available: allAliquots.filter(a => a.status === 'available').length,
      inUse: allAliquots.filter(a => a.status === 'in-use').length,
      consumed: allAliquots.filter(a => a.status === 'consumed').length,
      stored: allAliquots.filter(a => a.status === 'stored').length,
      disposed: allAliquots.filter(a => a.status === 'disposed').length,
    },
    avgAliquotsPerSample: collectedSamples.length > 0
      ? (allAliquots.length / collectedSamples.filter(() => chance(60)).length).toFixed(1)
      : 0,
  };

  console.log('📊 Aliquot Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   By Status: Available=${stats.byStatus.available}, In-Use=${stats.byStatus.inUse}, Consumed=${stats.byStatus.consumed}, Stored=${stats.byStatus.stored}, Disposed=${stats.byStatus.disposed}`);

  return allAliquots;
}
