export const CONTAINER_VALUES = [
  'red-top',
  'lavender-top',
  'green-top',
  'blue-top',
  'yellow-top',
  'gray-top',
  'light-blue-top',
  'pink-top',
  'black-top',
  'orange-top',
  'royal-blue-top',
  'white-top',
  'tan-top',
  'urine-cup',
  'stool-container',
  'swab-tube',
  'gold-top',
  'tiger-top',
  'clear-top',
  'cup',
  'tube',
  'other',
] as const;

export type Container = (typeof CONTAINER_VALUES)[number];

export const CONTAINER_CONFIG: Record<
  Container,
  {
    label: string;
    additive?: string;
    commonUses: string;
    textClass?: string;
  }
> = {
  'red-top': {
    label: 'Red Top',
    additive: 'None',
    commonUses: 'Serum chemistry, serology, immunology',
    textClass: 'text-red-600',
  },
  'lavender-top': {
    label: 'Lavender Top',
    additive: 'EDTA',
    commonUses: 'CBC, blood typing',
    textClass: 'text-purple-600',
  },
  'green-top': { label: 'Green Top', additive: 'Heparin', commonUses: 'Plasma chemistry', textClass: 'text-green-600' },
  'blue-top': {
    label: 'Blue Top',
    additive: 'Sodium citrate',
    commonUses: 'Coagulation tests',
    textClass: 'text-blue-600',
  },
  'yellow-top': { label: 'Yellow Top', additive: 'ACD', commonUses: 'Blood bank, HLA typing', textClass: 'text-yellow-600' },
  'gray-top': {
    label: 'Gray Top',
    additive: 'Sodium fluoride',
    commonUses: 'Glucose, lactate',
    textClass: 'text-gray-600',
  },
  'light-blue-top': {
    label: 'Light Blue Top',
    additive: 'Sodium citrate',
    commonUses: 'Coagulation',
    textClass: 'text-sky-400',
  },
  'pink-top': { label: 'Pink Top', additive: 'EDTA', commonUses: 'Blood bank', textClass: 'text-pink-400' },
  'black-top': {
    label: 'Black Top',
    additive: 'Sodium citrate',
    commonUses: 'ESR',
    textClass: 'text-gray-900',
  },
  'orange-top': { label: 'Orange Top', additive: 'Thrombin', commonUses: 'STAT serum chemistry', textClass: 'text-orange-500' },
  'royal-blue-top': {
    label: 'Royal Blue Top',
    additive: 'None / EDTA / Heparin',
    commonUses: 'Trace elements, toxicology',
    textClass: 'text-blue-800',
  },
  'white-top': { label: 'White Top', additive: 'EDTA with gel', commonUses: 'Molecular diagnostics', textClass: 'text-gray-400' },
  'tan-top': { label: 'Tan Top', additive: 'EDTA', commonUses: 'Lead testing', textClass: 'text-amber-600' },
  'urine-cup': { label: 'Urine Cup', commonUses: 'Urinalysis', textClass: 'text-yellow-500' },
  'stool-container': { label: 'Stool Container', commonUses: 'Stool analysis', textClass: 'text-amber-800' },
  'swab-tube': { label: 'Swab Tube', commonUses: 'Microbiology cultures', textClass: 'text-teal-600' },
  'gold-top': { label: 'Gold Top', additive: 'Clot activator', commonUses: 'Serum separator', textClass: 'text-yellow-500' },
  'tiger-top': {
    label: 'Tiger Top',
    additive: 'Clot activator',
    commonUses: 'Serum separator',
    textClass: 'text-orange-800',
  },
  'clear-top': { label: 'Clear Top', additive: 'None', commonUses: 'Discard tube', textClass: 'text-gray-300' },
  cup: { label: 'Cup', additive: 'None', commonUses: 'Urine, stool', textClass: 'text-amber-700' },
  tube: { label: 'Tube', additive: 'Various', commonUses: 'General collection', textClass: 'text-gray-500' },
  other: { label: 'Other', additive: 'Various', commonUses: 'Miscellaneous', textClass: 'text-gray-500' },
};

export const CONTAINER_OPTIONS = CONTAINER_VALUES.map(value => ({
  value,
  label: CONTAINER_CONFIG[value].label,
}));

/** Top colors shown in sample collection popover (subset of CONTAINER_VALUES). */
export const COLLECTION_TOP_COLOR_VALUES: (keyof typeof CONTAINER_CONFIG)[] = [
  'red-top',
  'yellow-top',
  'green-top',
  'black-top',
  'blue-top',
];

export const CONTAINER_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Containers' },
  ...CONTAINER_OPTIONS,
];

export type ContainerType = Container;
export type ContainerTopColor = Container;

export const CONTAINER_TYPE_VALUES = CONTAINER_VALUES;
export const CONTAINER_COLOR_VALUES = CONTAINER_VALUES;
export const CONTAINER_COLOR_CONFIG = CONTAINER_CONFIG;
export const CONTAINER_TYPE_OPTIONS = CONTAINER_OPTIONS;
export const CONTAINER_COLOR_OPTIONS = CONTAINER_OPTIONS;
