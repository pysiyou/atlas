/**
 * Helper utility functions for sample operations
 */

import type {
  SampleType,
  ContainerType,
  ContainerTopColor,
} from '@/types';
import { CONTAINER_COLOR_CONFIG, PRIORITY_LEVEL_CONFIG } from '@/types';
import type { OrderTest } from '@/types';
import type { Test } from '@/types';
import { getSampleDefinition } from './sample-definitions';

/**
 * Sample requirement data calculated from tests
 */
export interface SampleRequirement {
  sampleType: SampleType;
  testCodes: string[];
  testNames?: string[];  // Optional - can be computed from testCodes when needed
  totalVolume: number;
  containerTypes: ContainerType[];
  containerTopColors: ContainerTopColor[];
  priority: 'routine' | 'urgent' | 'stat';
  orderId: string;
}

/**
/**
 * Get collection requirements for a sample type
 * Maps derived types (plasma, serum) to their collection type (blood)
 */
export function getCollectionRequirements(sampleType: SampleType): { 
  collectionType: SampleType; 
  isDerived: boolean;
  label: string; 
} {
  const def = getSampleDefinition(sampleType);
  
  return {
    collectionType: sampleType,
    isDerived: def.isDerived ?? false,
    label: def.collectionInstruction || `Collect ${def.label}`
  };
}

/**
 * Group tests by sample type
 */
export function groupTestsBySample(
  tests: OrderTest[],
  testCatalog: Test[]
): Map<string, OrderTest[]> {
  const grouped = new Map<string, OrderTest[]>();

  tests.forEach((test) => {
    const testDef = testCatalog.find((t) => t.code === test.testCode);
    const sampleType = testDef?.sampleType || 'unknown';

    const key = (typeof sampleType === 'string' ? sampleType.toLowerCase().trim() : 'unknown') || 'unknown';
    const existing = grouped.get(key) || [];
    grouped.set(key, [...existing, test]);
  });

  return grouped;
}

/**
 * Calculate total volume needed for a sample type
 */
export function calculateTotalVolume(
  tests: OrderTest[],
  testCatalog: Test[]
): number {
  let totalVolume = 0;

  tests.forEach((orderTest) => {
    const testDef = testCatalog.find((t) => t.code === orderTest.testCode);
    if (testDef && testDef.minimumVolume) {
      totalVolume += testDef.minimumVolume;
    }
  });

  return totalVolume;
}

/**
 * Calculate required samples for an order
 */
export function calculateRequiredSamples(
  tests: OrderTest[],
  testCatalog: Test[],
  orderPriority: 'routine' | 'urgent' | 'stat',
  orderId: string
): SampleRequirement[] {
  const grouped = groupTestsBySample(tests, testCatalog);
  const requiredSamples: SampleRequirement[] = [];

  grouped.forEach((sampleTests, sampleType) => {
    const containerTypesSet = new Set<ContainerType>();
    const containerTopColorsSet = new Set<ContainerTopColor>();

    sampleTests.forEach((orderTest) => {
      const testDef = testCatalog.find((t) => t.code === orderTest.testCode);
      if (testDef) {
        testDef.containerTypes?.forEach((ct) => containerTypesSet.add(ct));
        testDef.containerTopColors?.forEach((color) => containerTopColorsSet.add(color));
      }
    });

    const totalVolume = calculateTotalVolume(sampleTests, testCatalog);
    const testCodes = sampleTests.map((t) => t.testCode);
    const testNames = testCodes.map(code => {
      const testDef = testCatalog.find((t) => t.code === code);
      return testDef?.name || code;
    });

    requiredSamples.push({
      sampleType: sampleType as SampleType,
      testCodes,
      testNames,
      totalVolume,
      containerTypes: Array.from(containerTypesSet),
      containerTopColors: Array.from(containerTopColorsSet),
      priority: orderPriority,
      orderId,
    });
  });

  return requiredSamples;
}

/**
 * Generate sample ID
 */
export function generateSampleId(orderId: string, sampleType: string): string {
  const orderSuffix = orderId.split('-').pop() || '000';
  const safeType = (sampleType || 'unknown').toString();
  const typeCode = safeType.substring(0, 3).toUpperCase();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `SAM-${orderSuffix}-${typeCode}-${random}`;
}

/**
 * Generate aliquot ID
 */
export function generateAliquotId(sampleId: string, aliquotNumber: number): string {
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `ALQ-${sampleId.split('-').slice(1).join('-')}-${aliquotNumber}-${random}`;
}

/**
 * Generate movement ID
 */
export function generateMovementId(): string {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  return `MOV-${timestamp}-${random}`;
}

/**
 * Validate collected volume is sufficient
 */
export function validateVolume(
  collectedVolume: number,
  requiredVolume: number
): {
  isValid: boolean;
  status: 'sufficient' | 'marginal' | 'insufficient';
  message: string;
} {
  if (collectedVolume >= requiredVolume) {
    return {
      isValid: true,
      status: 'sufficient',
      message: 'Volume is sufficient for all tests',
    };
  }

  const percentage = (collectedVolume / requiredVolume) * 100;

  if (percentage >= 80) {
    return {
      isValid: true,
      status: 'marginal',
      message: 'Volume is marginal. Some tests may need prioritization.',
    };
  }

  return {
    isValid: false,
    status: 'insufficient',
    message: 'Insufficient volume. Recollection recommended.',
  };
}

/**
 * Get container top color for UI display (background color)
 * Uses centralized CONTAINER_COLOR_CONFIG
 */
export function getContainerColor(containerTopColor: ContainerTopColor): string {
  return CONTAINER_COLOR_CONFIG[containerTopColor]?.bgClass || 'bg-gray-400';
}



/**
 * Calculate retention expiry date
 */
export function calculateRetentionExpiry(
  testCompletionDate: string,
  retentionDays: number = 7
): string {
  const completion = new Date(testCompletionDate);
  const expiry = new Date(completion.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  return expiry.toISOString();
}

/**
 * Format volume display
 */
export function formatVolume(volumeInMl: number): string {
  if (volumeInMl < 1) {
    return `${(volumeInMl * 1000).toFixed(0)}µL`;
  }
  return `${volumeInMl.toFixed(1)}mL`;
}

/**
 * Priority sort helper
 * Uses centralized PRIORITY_LEVEL_CONFIG for sort order
 */
export function sortByPriority<T extends { priority: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aConfig = PRIORITY_LEVEL_CONFIG[a.priority as keyof typeof PRIORITY_LEVEL_CONFIG];
    const bConfig = PRIORITY_LEVEL_CONFIG[b.priority as keyof typeof PRIORITY_LEVEL_CONFIG];
    const aPriority = aConfig?.sortOrder ?? 99;
    const bPriority = bConfig?.sortOrder ?? 99;
    return aPriority - bPriority;
  });
}



/**
 * Get container icon color for SVG icons (uses text color instead of background)
 * SVG icons use currentColor which inherits from the text color
 * Uses centralized CONTAINER_COLOR_CONFIG
 */
export function getContainerIconColor(containerTopColor: ContainerTopColor): string {
  return CONTAINER_COLOR_CONFIG[containerTopColor]?.textClass || 'text-gray-400';
}
