/**
 * Audit event log read API + row normalization.
 */
import { apiClient } from '@/lib/api/client';
import type { EventLogActorSnapshot, EventLogChanges, EventLogRecord } from './types';

export interface AuditEventQueryParams {
  orderId?: number;
  patientId?: number;
  targetType?: string;
  targetId?: number;
  testId?: number;
  hours?: number;
  createdFrom?: string;
  createdTo?: string;
  /** Comma-separated category keys */
  categories?: string;
  limit?: number;
}

function readObject(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function normalizeActorSnapshot(raw: unknown): EventLogActorSnapshot {
  const snap = readObject(raw) ?? {};
  const userIdRaw = snap.userId ?? snap.user_id;
  const userId =
    userIdRaw === 'system' || userIdRaw === null || userIdRaw === undefined
      ? 'system'
      : Number(userIdRaw);

  return {
    userId: Number.isFinite(userId as number) ? (userId as number) : 'system',
    name: String(snap.name ?? 'Unknown'),
    role: String(snap.role ?? 'unknown'),
    ipAddress:
      typeof snap.ipAddress === 'string'
        ? snap.ipAddress
        : typeof snap.ip_address === 'string'
          ? snap.ip_address
          : undefined,
  };
}

function normalizeChanges(raw: unknown): EventLogChanges | null {
  const obj = readObject(raw);
  if (!obj) return null;

  const oldRaw = readObject(obj.oldValues) ?? readObject(obj.old_values) ?? {};
  const newRaw = readObject(obj.newValues) ?? readObject(obj.new_values) ?? {};

  if (Object.keys(oldRaw).length === 0 && Object.keys(newRaw).length === 0) {
    return null;
  }

  return { oldValues: oldRaw, newValues: newRaw };
}

export function normalizeAuditEvent(raw: Record<string, unknown>): EventLogRecord {
  const metadata =
    readObject(raw.metadata) ?? readObject(raw.eventMetadata) ?? readObject(raw.event_metadata);

  return {
    eventId: String(raw.eventId ?? raw.event_id ?? ''),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
    eventType: String(raw.eventType ?? raw.event_type ?? ''),
    actorId: (raw.actorId ?? raw.actor_id) as number | null | undefined,
    actorSnapshot: normalizeActorSnapshot(raw.actorSnapshot ?? raw.actor_snapshot),
    targetType: String(raw.targetType ?? raw.target_type ?? ''),
    targetId: Number(raw.targetId ?? raw.target_id ?? 0),
    patientId: (raw.patientId ?? raw.patient_id) as number | null | undefined,
    orderId: (raw.orderId ?? raw.order_id) as number | null | undefined,
    testId: (raw.testId ?? raw.test_id) as number | null | undefined,
    changes: normalizeChanges(raw.changes),
    metadata,
  };
}

function toQueryRecord(params: AuditEventQueryParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (params.orderId != null) out.orderId = String(params.orderId);
  if (params.patientId != null) out.patientId = String(params.patientId);
  if (params.targetType) out.targetType = params.targetType;
  if (params.targetId != null) out.targetId = String(params.targetId);
  if (params.testId != null) out.testId = String(params.testId);
  if (params.hours != null) out.hours = String(params.hours);
  if (params.createdFrom) out.createdFrom = params.createdFrom;
  if (params.createdTo) out.createdTo = params.createdTo;
  if (params.categories) out.categories = params.categories;
  if (params.limit != null) out.limit = String(params.limit);
  return out;
}

export async function fetchAuditEvents(params: AuditEventQueryParams): Promise<EventLogRecord[]> {
  const rows = await apiClient.get<Record<string, unknown>[]>(
    '/audit/events',
    toQueryRecord(params)
  );
  return rows.map(normalizeAuditEvent);
}
