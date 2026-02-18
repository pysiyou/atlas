/**
 * Sample Helper Utilities
 * Calculations and formatting for lab sample operations.
 */

import type { SampleType, ContainerType, ContainerTopColor, OrderTest, Test } from '@/types';
import { CONTAINER_COLOR_CONFIG } from '@/types';
import { getSampleDefinition } from './sample-definitions';

export interface SampleRequirement {
  sampleType: SampleType;
  testCodes: string[];
  testNames?: string[];
  totalVolume: number;
  containerTypes: ContainerType[];
  containerTopColors: ContainerTopColor[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  orderId: number;
}

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
    grouped.set(key, [...(grouped.get(key) || []), test]);
  });
  return grouped;
}

export function calculateTotalVolume(tests: OrderTest[], testCatalog: Test[]): number {
  return tests.reduce((total, orderTest) => {
    const testDef = testCatalog.find(t => t.code === orderTest.testCode);
    return total + (testDef?.minimumVolume ?? 0);
  }, 0);
}

export function calculateRequiredSamples(
  tests: OrderTest[],
  testCatalog: Test[],
  orderPriority: 'low' | 'medium' | 'high' | 'urgent',
  orderId: number
): SampleRequirement[] {
  const grouped = groupTestsBySample(tests, testCatalog);
  const requiredSamples: SampleRequirement[] = [];

  grouped.forEach((sampleTests, sampleType) => {
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

    const testCodes = uniqueTests.map(t => t.testCode);
    const testNames = testCodes.map(code => testCatalog.find(t => t.code === code)?.name || code);

    requiredSamples.push({
      sampleType: sampleType as SampleType,
      testCodes,
      testNames,
      totalVolume: calculateTotalVolume(uniqueTests, testCatalog),
      containerTypes: Array.from(containerTypesSet),
      containerTopColors: Array.from(containerTopColorsSet),
      priority: orderPriority,
      orderId,
    });
  });

  return requiredSamples;
}

export function formatAliquotDisplay(sampleId: number, aliquotNumber: number): string {
  return `SAM${sampleId}-ALQ${aliquotNumber}`;
}

export function formatVolume(volumeInMl: number): string {
  if (volumeInMl < 1) return `${(volumeInMl * 1000).toFixed(0)}µL`;
  return `${volumeInMl.toFixed(1)}mL`;
}

export function getContainerIconColor(containerTopColor: ContainerTopColor): string {
  return CONTAINER_COLOR_CONFIG[containerTopColor]?.textClass || 'text-text-disabled';
}
