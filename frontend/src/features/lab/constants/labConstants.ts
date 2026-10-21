/** Lab copy, config, routing, visuals, and API path constants. */
import type { IconName } from '@/components/primitives';
import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';
import { ROUTES } from '@/config';
import { ICONS } from '@/config/icons';
import type { TestStatus } from '@/types/enums';
import type { BadgeColor } from '@/components/primitives/badgeTypes';

export type LabWorkflowStage = 'collection' | 'entry' | 'validation';
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
  entity: { sample: 'Sample', sampleType: 'Sample type', samples: 'samples' },
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

export const LAB_STAGE_SHORT_ROWS = [
  { key: 'collection' as const, label: labStageLabel('collection', 'short') },
  { key: 'entry' as const, label: labStageLabel('entry', 'short') },
  { key: 'validation' as const, label: labStageLabel('validation', 'short') },
] as const;

export const LAB_CONFIG = {
  MAX_RETEST_ATTEMPTS: GENERATED_LAB_CONSTANTS.MAX_RETEST_ATTEMPTS,
  MAX_RECOLLECTION_ATTEMPTS: GENERATED_LAB_CONSTANTS.MAX_RECOLLECTION_ATTEMPTS,
  SEARCH_DEBOUNCE_MS: 300,
  SAMPLE_LOOKUP_MIN_CHARS: 3,
  DEFAULT_TEXTAREA_ROWS: 2,
  REJECTION_TEXTAREA_ROWS: 3,
  PARAMETER_PREVIEW_LIMIT: 5,
  TAB_COUNT_REFRESH_MS: 30_000,
  COMPACT_RESULT_GRID_LIMIT: 8,
  /** Result validation panel body — scroll when results + flags exceed this height. */
  RESULT_VALIDATION_PANEL_MAX_HEIGHT: 'max-h-[min(32rem,65vh)]',
  POPOVER_OFFSET: 8,
  MODAL_SIZE_DEFAULT: '3xl' as const,
  MODAL_SIZE_LARGE: '4xl' as const,
  VALIDATION_ERROR_DISPLAY_MS: 3000,
  QUEUE_AGE_WARNING_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_WARNING_HOURS,
  QUEUE_AGE_CRITICAL_HOURS: GENERATED_LAB_CONSTANTS.QUEUE_AGE_CRITICAL_HOURS,
} as const;

export const LAB_TAB_IDS = ['collection', 'entry', 'validation', 'monitor'] as const;
export type LabTabId = (typeof LAB_TAB_IDS)[number];

export const LAB_TAB_LABELS: Record<LabTabId, string> = {
  collection: labStageLabel('collection', 'nav'),
  entry: labStageLabel('entry', 'nav'),
  validation: labStageLabel('validation', 'nav'),
  monitor: LAB_COPY.workflow.monitorNav,
};

export const LAB_WORKFLOW_KPI_ICONS: Record<LabWorkflowKpiStage, IconName> = {
  collection: ICONS.dataFields.flask,
  entry: ICONS.dataFields.notebook,
  validation: ICONS.ui.shieldCheck,
  sentBack: ICONS.actions.refresh,
};

export const LAB_WORKFLOW_TAB_ICONS: Record<LabWorkflowStage, IconName> = {
  collection: LAB_WORKFLOW_KPI_ICONS.collection,
  entry: LAB_WORKFLOW_KPI_ICONS.entry,
  validation: LAB_WORKFLOW_KPI_ICONS.validation,
};

export const DEFAULT_LAB_TAB: LabTabId = 'monitor';

export function normalizeLabTabParam(value: string | undefined): LabTabId | null {
  if (!value) return null;
  if (LAB_TAB_IDS.includes(value as LabTabId)) return value as LabTabId;
  return null;
}

export function isLabTabId(value: string | undefined): value is LabTabId {
  return normalizeLabTabParam(value) != null;
}

export function getLabTabPath(tab: LabTabId): string {
  return `${ROUTES.LABORATORY}/${tab}`;
}

export function getLabQueueUrl(tab: LabTabId, options?: { search?: string }): string {
  const path = getLabTabPath(tab);
  if (!options?.search) return path;
  const params = new URLSearchParams({ search: options.search });
  return `${path}?${params.toString()}`;
}

/**
 * Map a server pipeline stage to a lab queue tab.
 * Escalation lives on the validation queue.
 */
export function getLabTabForPipelineStage(stage?: string | null): LabTabId | null {
  if (stage === 'collection') return 'collection';
  if (stage === 'entry') return 'entry';
  if (stage === 'validation' || stage === 'escalation') return 'validation';
  return null;
}

export function getLabTabForTestStatus(
  status: TestStatus,
  pipelineStage?: string | null
): LabTabId | null {
  const fromPipeline = getLabTabForPipelineStage(pipelineStage);
  if (fromPipeline) return fromPipeline;
  switch (status) {
    case 'pending':
      return 'collection';
    case 'sample-collected':
      return 'entry';
    case 'resulted':
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
  iconWell: string;
}

const LANE_VISUAL: Record<LabTimelineLane, LabLaneVisual> = {
  sample: {
    fill: 'fill-lane-1-fg',
    bar: 'bg-lane-1-fg',
    text: 'text-lane-1-fg',
    iconWell: 'bg-lane-1-bg text-lane-1-fg',
    badgeVariant: 'info',
  },
  results: {
    fill: 'fill-lane-2-fg',
    bar: 'bg-lane-2-fg',
    text: 'text-lane-2-fg',
    iconWell: 'bg-lane-2-bg text-lane-2-fg',
    badgeVariant: 'warning',
  },
  validation: {
    fill: 'fill-lane-3-fg',
    bar: 'bg-lane-3-fg',
    text: 'text-lane-3-fg',
    iconWell: 'bg-lane-3-bg text-lane-3-fg',
    badgeVariant: 'success',
  },
  escalation: {
    fill: 'fill-lane-4-fg',
    bar: 'bg-lane-4-fg',
    text: 'text-lane-4-fg',
    iconWell: 'bg-lane-4-bg text-lane-4-fg',
    badgeVariant: 'danger',
  },
  quality: {
    fill: 'fill-lane-5-fg',
    bar: 'bg-lane-5-fg',
    text: 'text-lane-5-fg',
    iconWell: 'bg-lane-5-bg text-lane-5-fg',
    badgeVariant: 'warning',
  },
  order: {
    fill: 'fill-lane-6-fg',
    bar: 'bg-lane-6-fg',
    text: 'text-lane-6-fg',
    iconWell: 'bg-lane-6-bg text-lane-6-fg',
    badgeVariant: 'neutral',
  },
  composition: {
    fill: 'fill-lane-7-fg',
    bar: 'bg-lane-7-fg',
    text: 'text-lane-7-fg',
    iconWell: 'bg-lane-7-bg text-lane-7-fg',
    badgeVariant: 'neutral',
  },
};

const LAB_STAGE_LANE: Record<LabWorkflowStage, LabTimelineLane> = {
  collection: 'sample',
  entry: 'results',
  validation: 'validation',
};

const KPI_STAGE_LANE: Record<LabWorkflowKpiStage, LabTimelineLane> = {
  collection: 'sample',
  entry: 'results',
  validation: 'validation',
  sentBack: 'quality',
};

export function getLaneVisual(lane: LabTimelineLane): LabLaneVisual {
  return LANE_VISUAL[lane];
}

export function getStageVisual(stage: LabWorkflowStage): LabLaneVisual {
  return getLaneVisual(LAB_STAGE_LANE[stage]);
}

export function getKpiStageVisual(stage: LabWorkflowKpiStage): LabLaneVisual {
  return getLaneVisual(KPI_STAGE_LANE[stage]);
}

export function isLabWorkflowStageTab(tab: LabTabId): tab is LabWorkflowStage {
  return tab === 'collection' || tab === 'entry' || tab === 'validation';
}

/** Canonical lab API paths (relative to API v1 prefix). */
export const LAB_PATHS = {
  samples: {
    list: '/lab/samples',
    pending: '/lab/samples/pending',
    byId: (sampleId: string | number) => `/lab/samples/${sampleId}`,
    workContext: (sampleId: string | number) => `/lab/samples/${sampleId}/work-context`,
    collect: (sampleId: string | number) => `/lab/samples/${sampleId}/collect`,
  },
  results: {
    pendingEscalation: '/lab/results/pending-escalation',
    orderTest: (orderTestId: number) => `/lab/results/order-tests/${orderTestId}`,
    enterResults: (orderTestId: number) => `/lab/results/order-tests/${orderTestId}`,
    validate: (orderTestId: number) => `/lab/results/order-tests/${orderTestId}/validate`,
    resolveEscalation: (orderTestId: number) =>
      `/lab/results/order-tests/${orderTestId}/escalation/resolve`,
  },
  worklists: {
    collection: '/lab/worklists/collection',
    entry: '/lab/worklists/entry',
    validation: '/lab/worklists/validation',
    dashboardToday: '/lab/worklists/dashboard-today',
    dashboardBlocked: '/lab/worklists/dashboard-blocked',
  },
  board: { full: '/lab/board', summary: '/lab/board/summary' },
  criticalValues: {
    pending: '/lab/critical-values/pending',
    all: '/lab/critical-values/all',
    notify: (testId: number) => `/lab/critical-values/${testId}/notify`,
    acknowledge: (testId: number) => `/lab/critical-values/${testId}/acknowledge`,
    forOrder: (orderId: number) => `/lab/orders/${orderId}/critical-values`,
  },
  qualityIssues: { list: '/lab/quality-issues', options: '/lab/quality-issues/options' },
  recollectionRequests: {
    pending: '/lab/recollection-requests/pending',
    approve: (requestId: number) => `/lab/recollection-requests/${requestId}/approve`,
    deny: (requestId: number) => `/lab/recollection-requests/${requestId}/deny`,
  },
  analyzer: {
    hl7: '/lab/analyzer/hl7',
    json: '/lab/analyzer/json',
    pending: (analyzerId: string) => `/lab/analyzer/pending/${analyzerId}`,
  },
} as const;
