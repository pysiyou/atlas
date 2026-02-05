/**
 * Helper utility functions for sample operations
 */

import type { SampleType, ContainerType, ContainerTopColor, OrderTest, Test } from '@/types';
import { CONTAINER_COLOR_CONFIG } from '@/types';
import { getSampleDefinition } from './sampleDefinitions';

/**
 * Sample requirement data calculated from tests
 */
export interface SampleRequirement {
  sampleType: SampleType;
  testCodes: string[];
  testNames?: string[]; // Optional - can be computed from testCodes when needed
  totalVolume: number;
  containerTypes: ContainerType[];
  containerTopColors: ContainerTopColor[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderId: number;
}

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
    label: def.collectionInstruction || `Collect ${def.label}`,
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

  tests.forEach(test => {
    const testDef = testCatalog.find(t => t.code === test.testCode);
    const sampleType = testDef?.sampleType || 'unknown';

    const key =
      (typeof sampleType === 'string' ? sampleType.toLowerCase().trim() : 'unknown') || 'unknown';
    const existing = grouped.get(key) || [];
    grouped.set(key, [...existing, test]);
  });

  return grouped;
}

/**
 * Calculate total volume needed for a sample type
 */
export function calculateTotalVolume(tests: OrderTest[], testCatalog: Test[]): number {
  let totalVolume = 0;

  tests.forEach(orderTest => {
    const testDef = testCatalog.find(t => t.code === orderTest.testCode);
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
  orderPriority: 'low' | 'medium' | 'high' | 'urgent',
  orderId: number
): SampleRequirement[] {
  const grouped = groupTestsBySample(tests, testCatalog);
  const requiredSamples: SampleRequirement[] = [];

  grouped.forEach((sampleTests, sampleType) => {
    // Dedupe by testCode so retests/rejections don't list the same test multiple times
    const seen = new Set<string>();
    const uniqueTests = sampleTests.filter(t => {
      if (seen.has(t.testCode)) return false;
      seen.add(t.testCode);
      return true;
    });

    const containerTypesSet = new Set<ContainerType>();
    const containerTopColorsSet = new Set<ContainerTopColor>();

    uniqueTests.forEach(orderTest => {
      const testDef = testCatalog.find(t => t.code === orderTest.testCode);
      if (testDef) {
        testDef.containerTypes?.forEach(ct => containerTypesSet.add(ct));
        testDef.containerTopColors?.forEach(color => containerTopColorsSet.add(color));
      }
    });

    const totalVolume = calculateTotalVolume(uniqueTests, testCatalog);
    const testCodes = uniqueTests.map(t => t.testCode);
    const testNames = testCodes.map(code => {
      const testDef = testCatalog.find(t => t.code === code);
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
 * Generate aliquot display ID
 * Note: Actual aliquot IDs are auto-generated integers by the backend
 * This is only for display purposes when showing aliquot relationships
 */
export function formatAliquotDisplay(sampleId: number, aliquotNumber: number): string {
  return `SAM${sampleId}-ALQ${aliquotNumber}`;
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
 * Get container icon color for SVG icons (uses text color instead of background)
 * SVG icons use currentColor which inherits from the text color
 * Uses centralized CONTAINER_COLOR_CONFIG
 */
export function getContainerIconColor(containerTopColor: ContainerTopColor): string {
  return CONTAINER_COLOR_CONFIG[containerTopColor]?.textClass || 'text-fg-disabled';
}
