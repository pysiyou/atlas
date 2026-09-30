/** Lab copy, config, tab routing, and workflow visual tokens. */
import type { IconName } from '@/components';
import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';
import { ROUTES } from '@/config';
import { ICONS } from '@/config/icons';
import type { TestStatus } from '@/types/enums';
import type { BadgeColor } from '@/components/primitives/badgeTypes';

export type LabWorkflowStage = 'collection' | 'entry' | 'validation';

/** Extra Today KPI row (non-tab workflow). */
export type LabWorkflowKpiStage = LabWorkflowStage | 'sentBack';

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
    monitorNav: 'Monitor',
    monitorPageTitle: 'Lab monitor',
    escalation: 'Escalation',
    sentBack: 'Sent back',
    sentBackShort: 'Rework',
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
  dashboardToday: {
    testsWorked: 'tests worked today',
    testsWorkedFooter: 'Tests worked today',
    total: 'Total',
    summaryAria: "Today's test activity summary",
    footnote:
      'Milestones overlap — one test may appear in multiple rows. Bars show pipeline depth on a shared track.',
    columnMilestone: 'Milestone',
    columnActivity: 'Activity',
    columnShare: 'Share',
    leadActivityPrefix: 'Most activity',
    reworkHint: 'Quality rework',
    highChurnHint: 'Multiple milestone events per test today',
    rowTitleOverlapNote: 'Milestones can overlap.',
    withCollection: 'Sample collection',
    withEntry: 'Result entry',
    withValidation: 'Results validated',
    withQualityRework: 'Quality rework',
  },
  timeline: {
    sample: 'Sample',
    results: 'Results',
    validation: 'Validation',
    escalation: 'Escalation',
    quality: 'Quality',
    order: 'Order',
    composition: 'Composition',
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
  COMPACT_RESULT_GRID_LIMIT: 8,
  POPOVER_OFFSET: 8,
  MODAL_SIZE_DEFAULT: '3xl' as const,
  MODAL_SIZE_LARGE: '4xl' as const,
  VALIDATION_ERROR_DISPLAY_MS: 3000,
  QUEUE_AGE_WARNING_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_WARNING_HOURS,
  QUEUE_AGE_CRITICAL_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_CRITICAL_HOURS,
} as const;

export const LAB_TAB_IDS = ['collection', 'entry', 'validation', 'monitor'] as const;

export type LabTabId = (typeof LAB_TAB_IDS)[number];

/** Legacy URL segment → canonical tab id */
export const LEGACY_LAB_TAB_ALIASES: Record<string, LabTabId> = {
  'command-center': 'monitor',
};

export const LAB_TAB_LABELS: Record<LabTabId, string> = {
  collection: labStageLabel('collection', 'nav'),
  entry: labStageLabel('entry', 'nav'),
  validation: labStageLabel('validation', 'nav'),
  monitor: LAB_COPY.workflow.monitorNav,
};

/** Icons for lab workflow KPI rows — tabs use collection / entry / validation only. */
export const LAB_WORKFLOW_KPI_ICONS: Record<LabWorkflowKpiStage, IconName> = {
  collection: ICONS.dataFields.flask,
  entry: ICONS.dataFields.notebook,
  validation: ICONS.ui.shieldCheck,
  sentBack: ICONS.actions.refresh,
};

/** Icons for collection / entry / validation lab tabs. */
export const LAB_WORKFLOW_TAB_ICONS: Record<LabWorkflowStage, IconName> = {
  collection: LAB_WORKFLOW_KPI_ICONS.collection,
  entry: LAB_WORKFLOW_KPI_ICONS.entry,
  validation: LAB_WORKFLOW_KPI_ICONS.validation,
};

export const DEFAULT_LAB_TAB: LabTabId = 'monitor';

export function normalizeLabTabParam(value: string | undefined): LabTabId | null {
  if (!value) return null;
  if (LEGACY_LAB_TAB_ALIASES[value]) return LEGACY_LAB_TAB_ALIASES[value];
  if (LAB_TAB_IDS.includes(value as LabTabId)) return value as LabTabId;
  return null;
}

export function isLabTabId(value: string | undefined): value is LabTabId {
  return normalizeLabTabParam(value) != null;
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
  badgeVariant: BadgeColor;
  /** Icon well / soft chip — pairs workflow bg + fg tokens for the lane. */
  iconWell: string;
}

const LANE_VISUAL: Record<LabTimelineLane, LabLaneVisual> = {
  sample: {
    fill: 'fill-workflow-collection-fg',
    bar: 'bg-workflow-collection-fg',
    text: 'text-workflow-collection-fg',
    iconWell: 'bg-workflow-collection-bg text-workflow-collection-fg',
    badgeVariant: 'info',
  },
  results: {
    fill: 'fill-workflow-entry-fg',
    bar: 'bg-workflow-entry-fg',
    text: 'text-workflow-entry-fg',
    iconWell: 'bg-workflow-entry-bg text-workflow-entry-fg',
    badgeVariant: 'warning',
  },
  validation: {
    fill: 'fill-workflow-validation-fg',
    bar: 'bg-workflow-validation-fg',
    text: 'text-workflow-validation-fg',
    iconWell: 'bg-workflow-validation-bg text-workflow-validation-fg',
    badgeVariant: 'success',
  },
  escalation: {
    fill: 'fill-workflow-escalation-fg',
    bar: 'bg-workflow-escalation-fg',
    text: 'text-workflow-escalation-fg',
    iconWell: 'bg-workflow-escalation-bg text-workflow-escalation-fg',
    badgeVariant: 'danger',
  },
  quality: {
    fill: 'fill-workflow-quality-fg',
    bar: 'bg-workflow-quality-fg',
    text: 'text-workflow-quality-fg',
    iconWell: 'bg-workflow-quality-bg text-workflow-quality-fg',
    badgeVariant: 'warning',
  },
  order: {
    fill: 'fill-workflow-order-fg',
    bar: 'bg-workflow-order-fg',
    text: 'text-workflow-order-fg',
    iconWell: 'bg-workflow-order-bg text-workflow-order-fg',
    badgeVariant: 'neutral',
  },
  composition: {
    fill: 'fill-workflow-composition-fg',
    bar: 'bg-workflow-composition-fg',
    text: 'text-workflow-composition-fg',
    iconWell: 'bg-workflow-composition-bg text-workflow-composition-fg',
    badgeVariant: 'neutral',
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

const KPI_STAGE_LANE: Record<LabWorkflowKpiStage, LabTimelineLane> = {
  collection: 'sample',
  entry: 'results',
  validation: 'validation',
  sentBack: 'quality',
};

/** Dashboard KPI rows and any UI keyed by workflow stage (includes sent-back / rework). */
export function getKpiStageVisual(stage: LabWorkflowKpiStage): LabLaneVisual {
  return getLaneVisual(KPI_STAGE_LANE[stage]);
}

export function isLabWorkflowStageTab(tab: LabTabId): tab is LabWorkflowStage {
  return tab === 'collection' || tab === 'entry' || tab === 'validation';
}

