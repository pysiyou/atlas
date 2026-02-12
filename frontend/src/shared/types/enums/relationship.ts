export const RELATIONSHIP_VALUES = [
  'self',
  'spouse',
  'child',
  'parent',
  'sibling',
  'grandparent',
  'grandchild',
  'other-relative',
  'guardian',
  'friend',
  'other',
] as const;

export type Relationship = (typeof RELATIONSHIP_VALUES)[number];

export const RELATIONSHIP_CONFIG: Record<Relationship, { label: string }> = {
  self: { label: 'Self' },
  spouse: { label: 'Spouse' },
  child: { label: 'Child' },
  parent: { label: 'Parent' },
  sibling: { label: 'Sibling' },
  grandparent: { label: 'Grandparent' },
  grandchild: { label: 'Grandchild' },
  'other-relative': { label: 'Other Relative' },
  guardian: { label: 'Guardian' },
  friend: { label: 'Friend' },
  other: { label: 'Other' },
};

export const RELATIONSHIP_OPTIONS = RELATIONSHIP_VALUES.map(value => ({
  value,
  label: RELATIONSHIP_CONFIG[value].label,
}));

export const RELATIONSHIP_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Relationships' },
  ...RELATIONSHIP_OPTIONS,
];
