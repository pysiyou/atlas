/**
 * Activity feed copy — category labels and performer display for social-style timeline rows.
 */
import type { TimelineFeedKind } from './timelineCategories';

export interface TimelineFeedKindMeta {
  id: TimelineFeedKind;
  /** Short tag on each post (e.g. “Specimen”, “Quality & safety”). */
  tag: string;
  /** One-line description for docs / future filters. */
  description: string;
}

export const TIMELINE_FEED_KIND_META: Record<TimelineFeedKind, TimelineFeedKindMeta> = {
  accession: {
    id: 'accession',
    tag: 'Accession',
    description: 'Order composition, status, and accession changes',
  },
  billing: {
    id: 'billing',
    tag: 'Billing',
    description: 'Payment and financial clearance',
  },
  specimen: {
    id: 'specimen',
    tag: 'Specimen',
    description: 'Collection, rejection, and recollection in pre-analytical phase',
  },
  analytical: {
    id: 'analytical',
    tag: 'Results',
    description: 'Result entry, validation, and release',
  },
  quality: {
    id: 'quality',
    tag: 'Quality & safety',
    description: 'Critical values and reported quality issues',
  },
  oversight: {
    id: 'oversight',
    tag: 'Clinical oversight',
    description: 'Escalations, pathologist actions, and recollection authorization',
  },
};

export function getFeedKindMeta(kind: TimelineFeedKind): TimelineFeedKindMeta {
  return TIMELINE_FEED_KIND_META[kind];
}

export function formatPerformerName(
  performedByName: string | null | undefined,
  performedBy: string | number,
): string {
  if (performedByName?.trim()) return performedByName.trim();
  if (performedBy === 'system' || performedBy === 0) return 'System';
  return `User ${performedBy}`;
}

/** Two-letter avatar initials for feed rows. */
export function performerInitials(displayName: string): string {
  if (displayName === 'System') return 'SY';
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
  }
  const word = parts[0] ?? displayName;
  return word.slice(0, 2).toUpperCase();
}
