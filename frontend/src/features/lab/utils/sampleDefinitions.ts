/**
 * Sample Definitions
 * Configuration for sample types, containers, and collection requirements.
 */

import type { SampleType, ContainerType, ContainerTopColor } from '@/types';

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
