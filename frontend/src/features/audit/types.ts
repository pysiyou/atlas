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
  | 'quality';

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

export type EventLogTargetType =
  | 'patient'
  | 'order'
  | 'order_test'
  | 'sample'
  | 'payment'
  | 'invoice'
  | 'insurance_claim';

export interface EventLogScope {
  targetType: EventLogTargetType;
  targetId: number;
}

export type EventLogDomainCategory = EventLogDomain;

export type EventLogLaboratoryCategory =
  | 'laboratory:sample'
  | 'laboratory:result'
  | 'laboratory:validation'
  | 'laboratory:escalation'
  | 'laboratory:quality'
  | 'laboratory:analyzer';

export type EventLogCategoryKey = EventLogDomainCategory | EventLogLaboratoryCategory;

/** Server query for audit events — fixed constraints and/or merged user filters. */
export interface EventLogQuery {
  orderId?: number;
  patientId?: number;
  targetType?: string;
  targetId?: number;
  testId?: number;
  hours?: number;
  createdFrom?: string;
  createdTo?: string;
  categories?: EventLogCategoryKey[];
  limit?: number;
}

export type EventLogFilterField = 'category' | 'dateRange' | 'orderId' | 'testId';

export interface EventLogFilterUiConfig {
  fields?: EventLogFilterField[];
}

export interface EventLogUserFilters {
  categories: EventLogCategoryKey[];
  dateRange: [Date, Date] | null;
  orderId: number | null;
  testId: number | null;
}

export const DEFAULT_EVENT_LOG_USER_FILTERS: EventLogUserFilters = {
  categories: [],
  dateRange: null,
  orderId: null,
  testId: null,
};

/** User-facing copy for event log surfaces. */
export const EVENT_LOG_COPY = {
  panelTitle: 'Event log',
  panelMetaOrder: 'Most recent actions on this order first',
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
