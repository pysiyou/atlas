/**
 * Status presentation — GENERATED from contracts/status-presentation.json. DO NOT EDIT.
 */
export const CANONICAL_PRIMARY_VALUES = [
  "pending",
  "blocked",
  "in_progress",
  "completed",
  "cancelled",
  "superseded",
  "removed",
  "escalated",
  "rejected",
] as const;

export type CanonicalPresentationPrimary = "pending" | "blocked" | "in_progress" | "completed" | "cancelled" | "superseded" | "removed" | "escalated" | "rejected";

export const PRESENTATION_BADGE_VARIANTS: Record<CanonicalPresentationPrimary, string> = {
  "pending": "neutral",
  "blocked": "warning",
  "in_progress": "info",
  "completed": "success",
  "cancelled": "danger",
  "superseded": "neutral",
  "removed": "neutral",
  "escalated": "danger",
  "rejected": "danger"
} as Record<CanonicalPresentationPrimary, string>;

export const PRESENTATION_DISPLAY_LABELS: Record<CanonicalPresentationPrimary, string> = {
  "pending": "PENDING",
  "blocked": "BLOCKED",
  "in_progress": "IN PROGRESS",
  "completed": "COMPLETED",
  "cancelled": "CANCELLED",
  "superseded": "SUPERSEDED",
  "removed": "REMOVED",
  "escalated": "ESCALATED",
  "rejected": "REJECTED"
} as Record<CanonicalPresentationPrimary, string>;

export const TERMINAL_TEST_STATUSES = ["validated","cancelled","superseded","removed"] as const;
