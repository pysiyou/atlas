/**
 * Priority Level - Single Source of Truth
 *
 * Note: Badge colors for priority levels are defined in the Badge component.
 * Use the priority value directly as the Badge variant (e.g., variant="urgent").
 */

// 1. VALUES - The single source of truth
export const PRIORITY_LEVEL_VALUES = ['routine', 'urgent', 'stat'] as const;

// 2. TYPE - Derived from values
export type PriorityLevel = (typeof PRIORITY_LEVEL_VALUES)[number];

// 3. CONFIG - Metadata for each value (label only, colors handled by Badge; sortOrder for priority sorting)
export const PRIORITY_LEVEL_CONFIG: Record<PriorityLevel, { label: string; sortOrder: number }> = {
  routine: { label: 'Routine', sortOrder: 2 },
  urgent: { label: 'Urgent', sortOrder: 1 },
  stat: { label: 'STAT', sortOrder: 0 },
};

// 4. OPTIONS - For dropdowns/selects
export const PRIORITY_LEVEL_OPTIONS = PRIORITY_LEVEL_VALUES.map(value => ({
  value,
  label: PRIORITY_LEVEL_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const PRIORITY_LEVEL_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Priority' },
  ...PRIORITY_LEVEL_OPTIONS,
];
