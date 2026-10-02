/**
 * Event log view models — aligned with backend AuditEventResponse (camelCase).
 */

import type { InlineHighlightProps } from '@/components/primitives/InlineHighlight';
import type { UserRole } from '@/types';

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
  | 'analyzer'
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
  eventScope?: string | null;
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
  /** Debug payload (verbosity=debug): raw metadata and changes. */
  debugPayload?: Record<string, unknown> | null;
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

/** Optional kind filter — six eventType roots plus laboratory subcategory keys. */
export type EventLogLaboratoryKindKey =
  | 'laboratory:sample'
  | 'laboratory:result'
  | 'laboratory:validation'
  | 'laboratory:escalation'
  | 'laboratory:quality'
  | 'laboratory:analyzer';

export type EventLogKind = EventLogDomain | EventLogLaboratoryKindKey;

/** Feed verbosity ladder (not a stored column). */
export type EventLogVerbosity = 'summary' | 'detailed' | 'debug';

/** Stored event_scope column values. Distinct from the query `scope` lens. */
export type StoredEventScope = 'order' | 'lab' | 'patient' | 'system';

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
  /** Filter by stored event_scope column. */
  eventScope?: StoredEventScope;
  /** Newest-first page cursor (createdAt of the last row). */
  cursorCreatedAt?: string;
  /** Newest-first page cursor (eventId of the last row). */
  cursorEventId?: string;
  /** When set, only events performed by this user id (fixed panel queries). */
  actorId?: number;
  /** Filter by actor_snapshot.role at event time. */
  actorRoles?: UserRole[];
  /** Partial match on actor display name or account username. */
  actorSearch?: string;
  /** Unified search: entity ids, patient name, actor name/username. */
  search?: string;
  /** Display ladder: summary / detailed / debug. */
  verbosity?: EventLogVerbosity;
  limit?: number;
}

export type EventLogFilterField =
  | 'kind'
  | 'dateRange'
  | 'search'
  | 'entityId'
  | 'actorRole'
  | 'actorSearch'
  | 'includeAccess'
  | 'verbosity';

export interface EventLogFilterUiConfig {
  fields?: EventLogFilterField[];
}

export interface EventLogUserFilters {
  kinds: EventLogKind[];
  dateRange: [Date, Date] | null;
  includeAccess: boolean;
  verbosity: EventLogVerbosity;
  actorRoles: UserRole[];
  actorSearch: string;
  search: string;
  orderId: number | null;
  testId: number | null;
  sampleId: number | null;
  patientId: number | null;
}

export const DEFAULT_EVENT_LOG_USER_FILTERS: EventLogUserFilters = {
  kinds: [],
  dateRange: null,
  includeAccess: false,
  verbosity: 'summary',
  actorRoles: [],
  actorSearch: '',
  search: '',
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
  panelMetaAll: 'Most recent events · newest first · load more for older rows',
  emptyTitle: 'No events yet',
  emptyDescription: 'Actions and status changes will appear here as they occur.',
  narrativeDefaultLabel: 'Note',
  reasonInlinePrefix: 'Reason: ',
  outcomeInlinePrefix: 'Outcome: ',
  commentLabel: 'Comment',
  resultTitle: 'Result',
  debugTitle: 'Debug',
  loadMore: 'Load older events',
  searchPreviewTitle: 'Search matches',
  searchPreviewEntityIds: 'Entity IDs',
  searchPreviewPatients: 'Patients',
  searchPreviewUsers: 'Users',
  searchPreviewEventCount: 'events match',
  searchPreviewEventCountLoading: 'Counting events…',
  searchPreviewNoSuggestions: 'No matches for this query',
  searchIntentOrder: 'Order',
  searchIntentTest: 'Test',
  searchIntentSample: 'Sample',
  searchIntentPatient: 'Patient',
  searchIntentNumericTarget: 'Target id',
  verbositySummary: 'Summary',
  verbosityDetailed: 'Detailed',
  verbosityDebug: 'Debug',
  showMore: 'Show more',
  showLess: 'Show less',
  systemActorName: 'Atlas',
  transitionArrow: '→',
} as const;
