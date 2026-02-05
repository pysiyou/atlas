/**
 * Container Types and Colors - Single Source of Truth
 */

// ============================================
// CONTAINER TYPE
// ============================================

// 1. VALUES - The single source of truth
export const CONTAINER_TYPE_VALUES = ['tube', 'cup'] as const;

// 2. TYPE - Derived from values
export type ContainerType = (typeof CONTAINER_TYPE_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const CONTAINER_TYPE_CONFIG: Record<ContainerType, { label: string }> = {
  tube: { label: 'Tube' },
  cup: { label: 'Cup' },
};

// 4. OPTIONS - For dropdowns/selects (uses `name` for backwards compatibility)
export const CONTAINER_TYPE_OPTIONS = CONTAINER_TYPE_VALUES.map(value => ({
  value,
  name: CONTAINER_TYPE_CONFIG[value].label,
}));

// ============================================
// CONTAINER TOP COLOR
// ============================================

// 1. VALUES - The single source of truth
export const CONTAINER_COLOR_VALUES = [
  'red',
  'yellow',
  'purple',
  'blue',
  'green',
  'gray',
  'black',
] as const;

// 2. TYPE - Derived from values
export type ContainerTopColor = (typeof CONTAINER_COLOR_VALUES)[number];

// 3. CONFIG - Metadata for each value (includes meaning and CSS classes)
export const CONTAINER_COLOR_CONFIG: Record<
  ContainerTopColor,
  { label: string; meaning: string; bgClass: string; textClass: string }
> = {
  red: {
    label: 'Red',
    meaning: 'No additive (serum)',
    bgClass: 'bg-red-500',
    textClass: 'text-red-500',
  },
  yellow: {
    label: 'Yellow',
    meaning: 'ACD (blood bank)',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-500',
  },
  purple: {
    label: 'Purple',
    meaning: 'EDTA (whole blood)',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-500',
  },
  blue: {
    label: 'Blue',
    meaning: 'Citrate (coagulation)',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-500',
  },
  green: {
    label: 'Green',
    meaning: 'Heparin (plasma)',
    bgClass: 'bg-green-500',
    textClass: 'text-green-500',
  },
  gray: {
    label: 'Gray',
    meaning: 'Fluoride (glucose)',
    bgClass: 'bg-gray-500',
    textClass: 'text-text-3',
  },
  black: {
    label: 'Black',
    meaning: 'Citrate (ESR)',
    bgClass: 'bg-black',
    textClass: 'text-black',
  },
};

// 4. OPTIONS - For dropdowns/selects (uses `name` for backwards compatibility)
export const CONTAINER_COLOR_OPTIONS = CONTAINER_COLOR_VALUES.map(value => ({
  value,
  name: CONTAINER_COLOR_CONFIG[value].label,
  colorClass: CONTAINER_COLOR_CONFIG[value].bgClass,
}));
