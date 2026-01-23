/**
 * Relationship - Single Source of Truth for Emergency Contact Relationships
 */

// 1. VALUES - The single source of truth
export const RELATIONSHIP_VALUES = [
  'spouse',
  'parent',
  'sibling',
  'child',
  'friend',
  'other',
] as const;

// 2. TYPE - Derived from values
export type Relationship = (typeof RELATIONSHIP_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const RELATIONSHIP_CONFIG: Record<Relationship, { label: string }> = {
  spouse: { label: 'Spouse' },
  parent: { label: 'Parent' },
  sibling: { label: 'Sibling' },
  child: { label: 'Child' },
  friend: { label: 'Friend' },
  other: { label: 'Other' },
};

// 4. OPTIONS - For dropdowns/selects
export const RELATIONSHIP_OPTIONS = RELATIONSHIP_VALUES.map((value) => ({
  value,
  label: RELATIONSHIP_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const RELATIONSHIP_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Relationships' },
  ...RELATIONSHIP_OPTIONS,
];
