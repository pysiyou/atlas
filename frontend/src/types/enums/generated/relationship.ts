/** GENERATED — source: contracts/enums.json. DO NOT EDIT BY HAND. */
export const RELATIONSHIP_VALUES = ["spouse", "parent", "sibling", "child", "friend", "other"] as const;

export type Relationship = (typeof RELATIONSHIP_VALUES)[number];

export const RELATIONSHIP_CONFIG: Record<Relationship, { label: string }> = {
  "spouse": { label: "Spouse" },
  "parent": { label: "Parent" },
  "sibling": { label: "Sibling" },
  "child": { label: "Child" },
  "friend": { label: "Friend" },
  "other": { label: "Other" },
};

export const RELATIONSHIP_OPTIONS = RELATIONSHIP_VALUES.map(value => ({
  value,
  label: RELATIONSHIP_CONFIG[value].label,
}));

export const RELATIONSHIP_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Relationships' },
  ...RELATIONSHIP_OPTIONS,
];
