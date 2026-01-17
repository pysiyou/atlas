import type { SampleType } from '@/types';

export interface SampleDefinition {
  code: SampleType;
  label: string;
  isDerived: boolean;
  collectionSource?: SampleType;
  iconName: string; // Icon name for the Icon component
  colors: {
    bg: string;
    text: string;
  };
  collectionInstruction?: string;
}

export const SAMPLE_DEFINITIONS: Record<SampleType, SampleDefinition> = {
  blood: { 
    code: 'blood', 
    label: 'Blood', 
    isDerived: false, 
    iconName: 'droplet', 
    colors: { bg: 'bg-red-100', text: 'text-red-800' }
  },
  plasma: { 
    code: 'plasma', 
    label: 'Plasma', 
    isDerived: true, 
    collectionSource: 'blood', // Physically collected as blood
    iconName: 'droplet', // Uses same icon family
    colors: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    collectionInstruction: 'Collect Whole Blood'
  },
  serum: { 
    code: 'serum', 
    label: 'Serum', 
    isDerived: true, 
    collectionSource: 'blood', // Physically collected as blood
    iconName: 'droplet', 
    colors: { bg: 'bg-amber-100', text: 'text-amber-800' },
    collectionInstruction: 'Collect Whole Blood'
  },
  urine: {
    code: 'urine',
    label: 'Urine',
    isDerived: false,
    iconName: 'flask-conical', // approximated lab-flask
    colors: { bg: 'bg-yellow-100', text: 'text-yellow-800' }
  },
  stool: {
    code: 'stool',
    label: 'Stool',
    isDerived: false,
    iconName: 'circle', // generic
    colors: { bg: 'bg-orange-100', text: 'text-orange-800' }
  },
  swab: {
    code: 'swab',
    label: 'Swab',
    isDerived: false,
    iconName: 'dna', // approximated
    colors: { bg: 'bg-green-100', text: 'text-green-800' }
  },
  tissue: {
    code: 'tissue',
    label: 'Tissue',
    isDerived: false,
    iconName: 'microscope',
    colors: { bg: 'bg-purple-100', text: 'text-purple-800' }
  },
  csf: {
    code: 'csf',
    label: 'CSF',
    isDerived: false,
    iconName: 'droplet', // clear fluid
    colors: { bg: 'bg-blue-100', text: 'text-blue-800' }
  },
  sputum: {
    code: 'sputum',
    label: 'Sputum',
    isDerived: false,
    iconName: 'wind', // approximated
    colors: { bg: 'bg-gray-100', text: 'text-gray-800' }
  },
  other: {
    code: 'other',
    label: 'Other',
    isDerived: false,
    iconName: 'flask-round',
    colors: { bg: 'bg-gray-100', text: 'text-gray-800' }
  }
};

/**
 * Helper to get definition with fallback
 */
export function getSampleDefinition(type: SampleType | string): SampleDefinition {
  const normalizedType = (typeof type === 'string' ? type.toLowerCase() : type) as SampleType;
  return SAMPLE_DEFINITIONS[normalizedType] || SAMPLE_DEFINITIONS.other;
}
