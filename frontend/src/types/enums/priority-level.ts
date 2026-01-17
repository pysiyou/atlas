/**
 * Priority Level - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const PRIORITY_LEVEL_VALUES = ['routine', 'urgent', 'stat'] as const;

// 2. TYPE - Derived from values
export type PriorityLevel = (typeof PRIORITY_LEVEL_VALUES)[number];

// 3. CONFIG - Metadata for each value (includes sortOrder for priority sorting)
export const PRIORITY_LEVEL_CONFIG: Record<
  PriorityLevel,
  { label: string; color: string; sortOrder: number }
> = {
  routine: { label: 'Routine', color: 'gray', sortOrder: 2 },
  urgent: { label: 'Urgent', color: 'warning', sortOrder: 1 },
  stat: { label: 'STAT', color: 'error', sortOrder: 0 },
};

// 4. OPTIONS - For dropdowns/selects
export const PRIORITY_LEVEL_OPTIONS = PRIORITY_LEVEL_VALUES.map((value) => ({
  value,
  label: PRIORITY_LEVEL_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const PRIORITY_LEVEL_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Priority' },
  ...PRIORITY_LEVEL_OPTIONS,
];
