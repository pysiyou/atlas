/** Sample definitions, collection helpers, container inference, and label printing. */
import type { SampleType, ContainerType, ContainerTopColor, OrderTest, Test } from '@/types';
import { CONTAINER_COLOR_CONFIG } from '@/types';
import type { FeedbackId } from '@/config/feedbackCatalog';
import { notify } from '@/utils/feedback';
import { feedbackTitle } from '@/utils/feedback/copy';
import { printCollectionLabel } from '@/features/lab/collection/SampleCollectionLabelActions';
import type { SampleCollectionQueueItem } from '../types';

export interface SampleDefinition {
  sampleType: SampleType;
  code: string;
  label: string;
  defaultContainer: ContainerType;
  defaultTopColor: ContainerTopColor;
  defaultVolume: number;
  collectionNotes?: string;
  collectionSource?: string;
  collectionInstruction?: string;
  isDerived?: boolean;
}

const SAMPLE_DEFINITIONS: Record<SampleType, SampleDefinition> = {
  blood: {
    sampleType: 'blood', code: 'BLD', label: 'Whole Blood',
    defaultContainer: 'lavender-top', defaultTopColor: 'lavender-top', defaultVolume: 5,
    collectionNotes: 'Venipuncture required', collectionSource: 'venipuncture',
    collectionInstruction: 'Draw from antecubital vein', isDerived: false,
  },
  serum: {
    sampleType: 'serum', code: 'SER', label: 'Serum',
    defaultContainer: 'red-top', defaultTopColor: 'red-top', defaultVolume: 3,
    collectionNotes: 'Allow to clot before centrifugation', collectionSource: 'venipuncture',
    collectionInstruction: 'Allow to clot 30 min, centrifuge', isDerived: true,
  },
  plasma: {
    sampleType: 'plasma', code: 'PLS', label: 'Plasma',
    defaultContainer: 'green-top', defaultTopColor: 'green-top', defaultVolume: 3,
    collectionNotes: 'Mix gently after collection', collectionSource: 'venipuncture',
    collectionInstruction: 'Centrifuge immediately after collection', isDerived: true,
  },
  urine: {
    sampleType: 'urine', code: 'URN', label: 'Urine',
    defaultContainer: 'urine-cup', defaultTopColor: 'urine-cup', defaultVolume: 30,
    collectionNotes: 'Clean catch midstream preferred', collectionSource: 'patient',
    collectionInstruction: 'Clean catch midstream collection', isDerived: false,
  },
  stool: {
    sampleType: 'stool', code: 'STL', label: 'Stool',
    defaultContainer: 'stool-container', defaultTopColor: 'stool-container', defaultVolume: 10,
    collectionNotes: 'Collect in provided container', collectionSource: 'patient',
    collectionInstruction: 'Collect in sterile container', isDerived: false,
  },
  saliva: {
    sampleType: 'saliva', code: 'SLV', label: 'Saliva',
    defaultContainer: 'swab-tube', defaultTopColor: 'swab-tube', defaultVolume: 2,
    collectionNotes: 'Avoid food or drink 30 minutes before collection', collectionSource: 'patient',
    collectionInstruction: 'Collect saliva in provided tube', isDerived: false,
  },
  swab: {
    sampleType: 'swab', code: 'SWB', label: 'Swab',
    defaultContainer: 'swab-tube', defaultTopColor: 'swab-tube', defaultVolume: 1,
    collectionNotes: 'Use sterile technique', collectionSource: 'site-specific',
    collectionInstruction: 'Use sterile swab technique', isDerived: false,
  },
  csf: {
    sampleType: 'csf', code: 'CSF', label: 'Cerebrospinal Fluid',
    defaultContainer: 'gray-top', defaultTopColor: 'gray-top', defaultVolume: 2,
    collectionNotes: 'Lumbar puncture required - physician only', collectionSource: 'lumbar puncture',
    collectionInstruction: 'Physician collection only', isDerived: false,
  },
  pleural_fluid: {
    sampleType: 'pleural_fluid', code: 'PLF', label: 'Pleural Fluid',
    defaultContainer: 'gray-top', defaultTopColor: 'gray-top', defaultVolume: 10,
    collectionNotes: 'Thoracentesis required - physician only', collectionSource: 'thoracentesis',
    collectionInstruction: 'Physician collection only', isDerived: false,
  },
  tissue: {
    sampleType: 'tissue', code: 'TIS', label: 'Tissue',
    defaultContainer: 'other', defaultTopColor: 'other', defaultVolume: 1,
    collectionNotes: 'Place in formalin immediately', collectionSource: 'biopsy',
    collectionInstruction: 'Place in formalin immediately', isDerived: false,
  },
  sputum: {
    sampleType: 'sputum', code: 'SPT', label: 'Sputum',
    defaultContainer: 'other', defaultTopColor: 'other', defaultVolume: 5,
    collectionNotes: 'Early morning sample preferred', collectionSource: 'patient',
    collectionInstruction: 'Deep cough into sterile container', isDerived: false,
  },
  other: {
    sampleType: 'other', code: 'OTH', label: 'Other',
    defaultContainer: 'other', defaultTopColor: 'other', defaultVolume: 5,
    collectionNotes: 'See specific test requirements', collectionSource: 'varies',
    collectionInstruction: 'See test-specific instructions', isDerived: false,
  },
};

export function getSampleDefinition(sampleType: SampleType): SampleDefinition {
  return SAMPLE_DEFINITIONS[sampleType] || SAMPLE_DEFINITIONS.other;
}

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

export function formatVolume(volumeInMl: number): string {
  if (volumeInMl < 1) return `${(volumeInMl * 1000).toFixed(0)}µL`;
  return `${volumeInMl.toFixed(1)}mL`;
}

export function getContainerIconColor(containerTopColor: ContainerTopColor): string {
  return CONTAINER_COLOR_CONFIG[containerTopColor]?.textClass || 'text-text-disabled';
}

export const getEffectiveContainerType = (
  actualContainerType: string | undefined,
  sampleType: string
): 'cup' | 'tube' => {
  if (actualContainerType === 'cup' || actualContainerType === 'tube') {
    return actualContainerType;
  }
  return sampleType === 'urine' || sampleType === 'stool' ? 'cup' : 'tube';
};

const PRINT_LABEL_ERRORS: Record<string, FeedbackId> = {
  [feedbackTitle('lab.collection.printLabel.uncollected')]: 'lab.collection.printLabel.uncollected',
  [feedbackTitle('lab.collection.printLabel.popupBlocked')]: 'lab.collection.printLabel.popupBlocked',
  [feedbackTitle('lab.collection.printLabel.genericError')]: 'lab.collection.printLabel.genericError',
};

export const printSampleCollectionLabel = (
  display: SampleCollectionQueueItem,
  patientName: string
): void => {
  try {
    printCollectionLabel(display, patientName);
  } catch (error) {
    if (error instanceof Error) {
      const catalogId = PRINT_LABEL_ERRORS[error.message];
      if (catalogId) {
        notify.toast(catalogId);
        return;
      }
      notify.toast('lab.collection.printLabel.error', { title: error.message });
    } else {
      notify.toast('lab.collection.printLabel.genericError');
    }
  }
};

