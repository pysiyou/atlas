/** GENERATED from contracts/enums.json. DO NOT EDIT. */
export const PRESENTATION_PRIMARY_VALUES = ["pending", "blocked", "in_progress", "completed", "cancelled", "superseded", "removed", "escalated", "rejected"] as const;

export type PresentationPrimary = (typeof PRESENTATION_PRIMARY_VALUES)[number];

export const PRESENTATION_PRIMARY_CONFIG: Record<PresentationPrimary, { label: string; badgeVariant: string }> = {
  "pending": { label: "PENDING", badgeVariant: "neutral" },
  "blocked": { label: "BLOCKED", badgeVariant: "warning" },
  "in_progress": { label: "RUNNING", badgeVariant: "info" },
  "completed": { label: "COMPLETED", badgeVariant: "success" },
  "cancelled": { label: "CANCELLED", badgeVariant: "danger" },
  "superseded": { label: "SUPERSEDED", badgeVariant: "neutral" },
  "removed": { label: "REMOVED", badgeVariant: "neutral" },
  "escalated": { label: "ESCALATED", badgeVariant: "danger" },
  "rejected": { label: "REJECTED", badgeVariant: "danger" },
};

export const PRESENTATION_PRIMARY_OPTIONS = PRESENTATION_PRIMARY_VALUES.map(value => ({
  value,
  label: PRESENTATION_PRIMARY_CONFIG[value].label,
}));

export const PRESENTATION_BADGE_VARIANTS = Object.fromEntries(
  PRESENTATION_PRIMARY_VALUES.map(value => [value, PRESENTATION_PRIMARY_CONFIG[value].badgeVariant])
) as Record<PresentationPrimary, string>;

export const PRESENTATION_DISPLAY_LABELS = Object.fromEntries(
  PRESENTATION_PRIMARY_VALUES.map(value => [value, PRESENTATION_PRIMARY_CONFIG[value].label])
) as Record<PresentationPrimary, string>;

export type CanonicalPresentationPrimary = PresentationPrimary;
export const CANONICAL_PRIMARY_VALUES = PRESENTATION_PRIMARY_VALUES;

