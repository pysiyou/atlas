/**
 * Event log view models — aligned with backend AuditEventResponse (camelCase).
 */

import type { InlineHighlightProps } from '@/components/primitives/InlineHighlight';

export type EventLogDomain =
  | 'patient'
  | 'order'
  | 'laboratory'
  | 'billing'
  | 'reporting'
  | 'system';

export type EventLogLaboratorySubdomain =
  | 'sample'
  | 'result'
  | 'validation'
  | 'escalation'
  | 'analyzer';

export interface EventLogActorSnapshot {
  userId: number | 'system';
  name: string;
  role: string;
  ipAddress?: string;
}

export interface EventLogChanges {
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
}

export interface EventLogRecord {
  eventId: string;
  createdAt: string;
  eventType: string;
  actorId?: number | null;
  actorSnapshot: EventLogActorSnapshot;
  targetType: string;
  targetId: number;
  patientId?: number | null;
  orderId?: number | null;
  testId?: number | null;
  changes?: EventLogChanges | null;
  metadata?: Record<string, unknown> | null;
}

export interface EventLogHeadlinePart {
  text: string;
  /** Primary emphasis (entity phrases like `order #ord…`, or catalog test chips). */
  main?: boolean;
  variant?: InlineHighlightProps['variant'];
  decoration?: InlineHighlightProps['decoration'];
  icon?: InlineHighlightProps['icon'];
}

export interface ResolvedEventLogHeadline {
  actorName: string;
  verbPhrase: string;
  targetLabel: string;
}

export interface ResolvedEventLogItem {
  record: EventLogRecord;
  domain: EventLogDomain;
  laboratorySubdomain?: EventLogLaboratorySubdomain;
  domainLabel: string;
  headline: ResolvedEventLogHeadline;
  headlineParts: EventLogHeadlinePart[];
  metaTime: string;
  showEventTypeInMeta?: boolean;
  narrativeLabel?: string;
  narrativeText?: string;
  /** When present, shown in the detail box with ResultsParameterGrid (validation card layout). */
  results?: Record<string, unknown>;
  resultFlags?: string[];
  isSystemActor: boolean;
  omitActorInHeadline?: boolean;
}

export interface EventLogDayGroup {
  dayKey: string;
  label: string;
  items: ResolvedEventLogItem[];
}

/** Containment lens for fetching events. Not stored on the row. */
export type EventLogScopeName = 'order' | 'lab' | 'patient' | 'system' | 'stream';

/** Optional kind filter — the six eventType roots. */
export type EventLogKind = EventLogDomain;

/** Server query for audit events — fixed constraints and/or merged user filters. */
export interface EventLogQuery {
  scope: EventLogScopeName;
  orderId?: number;
  patientId?: number;
  testId?: number;
  sampleId?: number;
  hours?: number;
  createdFrom?: string;
  createdTo?: string;
  kinds?: EventLogKind[];
  /** When true, include read-only events such as patient.view. */
  includeAccess?: boolean;
  limit?: number;
}

export type EventLogFilterField = 'kind' | 'dateRange' | 'entityId' | 'includeAccess';

export interface EventLogFilterUiConfig {
  fields?: EventLogFilterField[];
}

export interface EventLogUserFilters {
  kinds: EventLogKind[];
  dateRange: [Date, Date] | null;
  includeAccess: boolean;
  orderId: number | null;
  testId: number | null;
  sampleId: number | null;
  patientId: number | null;
}

export const DEFAULT_EVENT_LOG_USER_FILTERS: EventLogUserFilters = {
  kinds: [],
  dateRange: null,
  includeAccess: false,
  orderId: null,
  testId: null,
  sampleId: null,
  patientId: null,
};

/** User-facing copy for event log surfaces. */
export const EVENT_LOG_COPY = {
  panelTitle: 'Event log',
  panelMetaOrder: 'Most recent actions on this order first',
  panelMetaLab: 'Most recent laboratory actions for this item first',
  panelMetaPatient: 'Most recent actions on this patient first',
  panelMetaEntity: 'Most recent actions for this item first',
  panelMetaCommandCenter: 'Last 24 hours · most recent activity first',
  panelMetaMonitor: 'Last 24 hours · most recent activity first',
  panelMetaAll: 'Up to 2,000 most recent events · newest first',
  emptyTitle: 'No events yet',
  emptyDescription: 'Actions and status changes will appear here as they occur.',
  narrativeDefaultLabel: 'Note',
  reasonInlinePrefix: 'Reason: ',
  outcomeInlinePrefix: 'Outcome: ',
  commentLabel: 'Comment',
  resultTitle: 'Result',
  showMore: 'Show more',
  showLess: 'Show less',
  systemActorName: 'Atlas',
  transitionArrow: '→',
} as const;
