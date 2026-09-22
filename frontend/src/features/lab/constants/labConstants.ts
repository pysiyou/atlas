/** Lab copy, config, tab routing, and workflow visual tokens. */
import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';
import { ROUTES } from '@/config';
import type { TestStatus } from '@/types/enums';
import type { BadgeVariant } from '@/components';

export type LabWorkflowStage = 'collection' | 'entry' | 'validation';

export type LabStageLabelVariant = 'short' | 'nav' | 'full';

export type LabTimelineLane =
  | 'sample'
  | 'results'
  | 'validation'
  | 'escalation'
  | 'quality'
  | 'order'
  | 'composition';

export const LAB_COPY = {
  entity: {
    sample: 'Sample',
    sampleType: 'Sample type',
    samples: 'samples',
  },
  workflow: {
    collection: 'Collection',
    collectionNav: 'Sample Collection',
    entry: 'Result Entry',
    entryShort: 'Entry',
    validation: 'Validation',
    commandCenterNav: 'Dashboard',
    escalation: 'Escalation',
  },
  quality: {
    sampleRejected: 'Sample rejected',
    sampleIssue: 'Sample issue',
    reportSampleIssue: 'Report Sample Issue',
  },
  attention: {
    criticalValue: 'Critical values',
    recollection: 'Recollection',
    panelTitle: 'Attention queue',
    panelMetaEmpty: 'Escalations, holds, priority, and turnaround exceptions',
  },
  timeline: {
    sample: 'Sample',
    results: 'Results',
    validation: 'Validation',
    escalation: 'Escalation',
    quality: 'Quality',
    order: 'Order',
    composition: 'Composition',
    activityTitle: 'Activity log',
    activityMeta: 'Last 24 hours · chronological record of accession and laboratory events',
  },
  dashboard: {
    todayPanelMetaEmpty: 'No tests on today\u2019s accessions to measure step times yet',
  },
} as const;

export function labStageLabel(
  stage: LabWorkflowStage,
  variant: LabStageLabelVariant = 'full',
): string {
  switch (stage) {
    case 'collection':
      return variant === 'nav' ? LAB_COPY.workflow.collectionNav : LAB_COPY.workflow.collection;
    case 'entry':
      return variant === 'short' ? LAB_COPY.workflow.entryShort : LAB_COPY.workflow.entry;
    case 'validation':
      return LAB_COPY.workflow.validation;
  }
}

export function timelineLaneLabel(lane: LabTimelineLane): string {
  return LAB_COPY.timeline[lane];
}

/** Compact pipeline rows (command center KPIs, donuts, wait bars). */
export const LAB_STAGE_SHORT_ROWS = [
  { key: 'collection' as const, label: labStageLabel('collection', 'short') },
  { key: 'entry' as const, label: labStageLabel('entry', 'short') },
  { key: 'validation' as const, label: labStageLabel('validation', 'short') },
] as const;

export const LAB_CONFIG = {
  MAX_RETEST_ATTEMPTS: GENERATED_LAB_CONSTANTS.MAX_RETEST_ATTEMPTS,
  MAX_RECOLLECTION_ATTEMPTS: GENERATED_LAB_CONSTANTS.MAX_RECOLLECTION_ATTEMPTS,
  SEARCH_DEBOUNCE_MS: 300,
  /** Min characters before collection search queries historical samples (sample ID or patient name). */
  SAMPLE_LOOKUP_MIN_CHARS: 3,
  DEFAULT_TEXTAREA_ROWS: 2,
  REJECTION_TEXTAREA_ROWS: 3,
  PARAMETER_PREVIEW_LIMIT: 5,
  /** Tab badge / worklist poll interval */
  TAB_COUNT_REFRESH_MS: 30_000,
  /** Command center timeline poll interval */
  COMMAND_CENTER_REFETCH_MS: 60_000,
  /** Command center query stale window (half of refetch interval) */
  COMMAND_CENTER_STALE_MS: 30_000,
  COMPACT_RESULT_GRID_LIMIT: 8,
  POPOVER_OFFSET: 8,
  MODAL_SIZE_DEFAULT: '3xl' as const,
  MODAL_SIZE_LARGE: '4xl' as const,
  VALIDATION_ERROR_DISPLAY_MS: 3000,
  QUEUE_AGE_WARNING_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_WARNING_HOURS,
  QUEUE_AGE_CRITICAL_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_CRITICAL_HOURS,
} as const;

export const LAB_TAB_IDS = [
  'collection',
  'entry',
  'validation',
  'command-center',
] as const;

export type LabTabId = (typeof LAB_TAB_IDS)[number];

export const LAB_TAB_LABELS: Record<LabTabId, string> = {
  collection: labStageLabel('collection', 'nav'),
  entry: labStageLabel('entry', 'nav'),
  validation: labStageLabel('validation', 'nav'),
  'command-center': LAB_COPY.workflow.commandCenterNav,
};

export const DEFAULT_LAB_TAB: LabTabId = 'command-center';

export function isLabTabId(value: string | undefined): value is LabTabId {
  return LAB_TAB_IDS.includes(value as LabTabId);
}

/** Build a deep-linkable lab tab path, e.g. /laboratory/validation */
export function getLabTabPath(tab: LabTabId): string {
  return `${ROUTES.LABORATORY}/${tab}`;
}

/** Build a lab queue URL with optional search pre-fill for cross-links. */
export function getLabQueueUrl(
  tab: LabTabId,
  options?: { search?: string }
): string {
  const path = getLabTabPath(tab);
  if (!options?.search) return path;
  const params = new URLSearchParams({ search: options.search });
  return `${path}?${params.toString()}`;
}

/** Map a test status to the appropriate lab workflow tab, if actionable. */
export function getLabTabForTestStatus(status: TestStatus): LabTabId | null {
  switch (status) {
    case 'pending':
      return 'collection';
    case 'sample-collected':
      return 'entry';
    case 'resulted':
      return 'validation';
    case 'escalated':
      return 'validation';
    default:
      return null;
  }
}

export interface LabLaneVisual {
  fill: string;
  bar: string;
  text: string;
  badgeVariant: BadgeVariant;
}

const LANE_VISUAL: Record<LabTimelineLane, LabLaneVisual> = {
  sample: {
    fill: 'fill-workflow-collection-fg',
    bar: 'bg-workflow-collection-fg',
    text: 'text-workflow-collection-fg',
    badgeVariant: 'collected',
  },
  results: {
    fill: 'fill-workflow-entry-fg',
    bar: 'bg-workflow-entry-fg',
    text: 'text-workflow-entry-fg',
    badgeVariant: 'warning',
  },
  validation: {
    fill: 'fill-workflow-validation-fg',
    bar: 'bg-workflow-validation-fg',
    text: 'text-workflow-validation-fg',
    badgeVariant: 'validated',
  },
  escalation: {
    fill: 'fill-workflow-escalation-fg',
    bar: 'bg-workflow-escalation-fg',
    text: 'text-workflow-escalation-fg',
    badgeVariant: 'escalated',
  },
  quality: {
    fill: 'fill-workflow-quality-fg',
    bar: 'bg-workflow-quality-fg',
    text: 'text-workflow-quality-fg',
    badgeVariant: 'warning',
  },
  order: {
    fill: 'fill-workflow-order-fg',
    bar: 'bg-workflow-order-fg',
    text: 'text-workflow-order-fg',
    badgeVariant: 'neutral',
  },
  composition: {
    fill: 'fill-workflow-composition-fg',
    bar: 'bg-workflow-composition-fg',
    text: 'text-workflow-composition-fg',
    badgeVariant: 'pending',
  },
};

const LAB_STAGE_LANE: Record<LabWorkflowStage, LabTimelineLane> = {
  collection: 'sample',
  entry: 'results',
  validation: 'validation',
};

export function getLaneVisual(lane: LabTimelineLane): LabLaneVisual {
  return LANE_VISUAL[lane];
}

export function getStageVisual(stage: LabWorkflowStage): LabLaneVisual {
  return getLaneVisual(LAB_STAGE_LANE[stage]);
}

export interface LabLaneDisplay {
  id: LabTimelineLane;
  label: string;
  badgeVariant: BadgeVariant;
  iconClass: string;
}

export function getLaneDisplay(lane: LabTimelineLane): LabLaneDisplay {
  const visual = getLaneVisual(lane);
  return {
    id: lane,
    label: timelineLaneLabel(lane),
    badgeVariant: visual.badgeVariant,
    iconClass: visual.text,
  };
}

/** Backend timeline category for a UI lane (API still uses `specimen`). */
export function timelineLaneToApiCategory(lane: LabTimelineLane): string {
  return lane === 'sample' ? 'specimen' : lane;
}

/** Map API phase/category strings onto UI lanes. */
export function apiCategoryToTimelineLane(value: string | null | undefined): LabTimelineLane | null {
  if (!value) return null;
  if (value === 'specimen' || value === 'sample') return 'sample';
  if (
    value === 'results' ||
    value === 'validation' ||
    value === 'escalation' ||
    value === 'quality' ||
    value === 'order' ||
    value === 'composition'
  ) {
    return value;
  }
  return null;
}

