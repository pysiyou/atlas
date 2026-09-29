/**
 * Event log view models — aligned with backend AuditEventResponse (camelCase).
 */

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

export type EventLogHeadlineHighlight = 'inline' | 'test';

export interface EventLogHeadlinePart {
  text: string;
  emphasis?: boolean;
  highlight?: EventLogHeadlineHighlight;
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

export type EventLogFilter =
  | { mode: 'order'; orderId: number; limit?: number }
  | { mode: 'scope'; scope: EventLogScope; limit?: number }
  | { mode: 'recent'; hours?: number; limit?: number };
