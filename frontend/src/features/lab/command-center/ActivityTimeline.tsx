/**
 * ActivityTimeline - Detailed timeline for lab command center.
 * Step indicator style with highlighted status, actions, and IDs.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components';
import { formatRelativeDateLabel, formatRelativeDateTime, displayId } from '@/utils';
import { Skeleton } from '@/components/loaders/Skeleton';
import type { TimelineEvent } from '../api/monitoring.api';

export interface ActivityTimelineProps {
  events: TimelineEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col h-full bg-surface" aria-busy="true">
      <div className="flex-1 overflow-auto px-4 py-2 space-y-4">
        {Array.from({ length: 2 }).map((_, g) => (
          <div key={g} className="space-y-3">
            <Skeleton height={10} width={48} className="mx-auto" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton circle width={8} height={8} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Skeleton height={14} width="85%" />
                  <Skeleton height={10} width="50%" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col h-full bg-surface items-center justify-center gap-2 px-4">
      <p className="text-sm text-text-secondary">Couldn't load timeline</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="text-sm text-brand hover:underline">
          Retry
        </button>
      )}
    </div>
  );
}

function TimelineEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-surface">
      <p className="text-sm text-text-secondary">No recent activity</p>
    </div>
  );
}

interface GroupedEvents {
  label: string;
  items: TimelineEvent[];
}

interface FormattedEvent {
  action: string;
  details: Array<
    | { type: 'text'; value: string }
    | { type: 'link'; value: string; to: string }
    | { type: 'id'; value: string }
    | { type: 'testCode'; value: string }
    | { type: 'status'; value: string }
    | { type: 'sampleType'; value: string }
  >;
  note?: string;
}

function formatTestCodes(meta: Record<string, unknown>): string {
  const codes = meta.testCodes;
  if (Array.isArray(codes) && codes.length > 0) {
    return codes.map(code => String(code)).join('/');
  }
  if (meta.testCode) return String(meta.testCode);
  return 'Test';
}

function getStatusValue(event: TimelineEvent): string | null {
  const status = event.afterState?.status;
  return typeof status === 'string' ? status : null;
}

function orderLink(orderId: unknown): FormattedEvent['details'][number] | null {
  const id = Number(orderId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: 'link', value: displayId.order(id), to: `/orders/${id}` };
}

function sampleRef(sampleId: unknown): FormattedEvent['details'][number] | null {
  const id = Number(sampleId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: 'id', value: displayId.sample(id) };
}

function entityDetails(event: TimelineEvent): FormattedEvent['details'] {
  const { entityType, entityId, metadata } = event;

  switch (entityType) {
    case 'order': {
      const link = orderLink(entityId);
      return link ? [link] : [{ type: 'id', value: displayId.order(entityId) }];
    }
    case 'sample':
      return [
        {
          type: 'link',
          value: displayId.sample(entityId),
          to: '/laboratory/collection',
        },
      ];
    case 'order_test':
    case 'test': {
      const details: FormattedEvent['details'] = [
        { type: 'testCode', value: formatTestCodes(metadata) },
      ];
      const link = orderLink(metadata.orderId);
      if (link) {
        details.push({ type: 'text', value: 'for order' }, link);
      }
      return details;
    }
    default:
      return [{ type: 'id', value: String(entityId) }];
  }
}

function escalationTriggeredDetails(meta: Record<string, unknown>): FormattedEvent['details'] {
  const details: FormattedEvent['details'] = [
    { type: 'testCode', value: formatTestCodes(meta) },
  ];
  const link = orderLink(meta.orderId);
  if (link) {
    details.push({ type: 'text', value: 'for order' }, link);
  }
  return details;
}

function isOrderCompleted(meta: Record<string, unknown>): boolean {
  return meta.orderCompleted === true;
}

function testCompletedDetails(meta: Record<string, unknown>): FormattedEvent['details'] {
  const details: FormattedEvent['details'] = [
    { type: 'testCode', value: formatTestCodes(meta) },
    { type: 'text', value: 'for order' },
  ];
  const link = orderLink(meta.orderId);
  if (link) details.push(link);
  if (isOrderCompleted(meta)) {
    details.push({ type: 'text', value: '→' }, { type: 'status', value: 'completed' });
  }
  return details;
}

function metaString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.trim();
}

function testRef(testId: unknown): FormattedEvent['details'][number] | null {
  const id = Number(testId);
  if (!Number.isFinite(id) || id <= 0) return null;
  return { type: 'id', value: displayId.orderTest(id) };
}

function orderAndTestDetails(meta: Record<string, unknown>): FormattedEvent['details'] {
  const details: FormattedEvent['details'] = [];
  if (meta.testCode || meta.testCodes) {
    details.push({ type: 'testCode', value: formatTestCodes(meta) });
  }
  const link = orderLink(meta.orderId);
  if (link) {
    if (details.length > 0) details.push({ type: 'text', value: 'for order' });
    details.push(link);
  }
  const sample = sampleRef(meta.sampleId);
  if (sample) {
    details.push({ type: 'text', value: 'on' }, sample);
  }
  return details;
}

function appendNote(event: TimelineEvent, formatted: FormattedEvent): FormattedEvent {
  const note = metaString(event.comment);
  if (!note) return formatted;

  const detailText = formatted.details
    .filter(detail => detail.type === 'text')
    .map(detail => detail.value)
    .join(' ');
  if (detailText.includes(note)) return formatted;

  return { ...formatted, note };
}

function formatEscalationTriggerAction(type: string): string {
  const labels: Record<string, string> = {
    escalation_trigger_crit_val: 'Critical value escalation',
    escalation_trigger_limit_hit: 'Limit hit escalation',
    escalation_trigger_rej_samp: 'Rejected sample escalation',
    escalation_trigger_amend_res: 'Amendment escalation',
  };
  return labels[type] ?? 'Escalation triggered';
}

function formatCriticalValuesSummary(values: unknown): string | null {
  if (!Array.isArray(values) || values.length === 0) return null;

  const parts = values
    .map(item => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const name = row.item_name ?? row.itemName ?? row.item_code ?? row.itemCode;
      const value = row.value;
      const unit = row.unit;
      if (!name || value == null) return null;
      return unit ? `${name}: ${value} ${unit}` : `${name}: ${value}`;
    })
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(', ') : null;
}

function escalationTriggerDetails(meta: Record<string, unknown>): FormattedEvent['details'] {
  const details = escalationTriggeredDetails(meta);
  const reason = metaString(meta.reasonCode);
  if (reason) {
    details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
  }
  return details;
}
function getSampleTypeValue(meta: Record<string, unknown>): string | null {
  const sampleType = meta.sampleType;
  return typeof sampleType === 'string' ? sampleType : null;
}

function formatEventDetails(event: TimelineEvent): FormattedEvent {
  const meta = event.metadata;
  
  const entityLink = 
    event.entityType === 'order' ? `/orders/${event.entityId}` :
    event.entityType === 'sample' ? `/laboratory/collection` :
    `/orders/${meta.orderId || ''}`;

  switch (event.type) {
    case 'sample_collect': {
      const details: FormattedEvent['details'] = [
        { type: 'link', value: displayId.sample(event.entityId), to: entityLink },
        { type: 'text', value: 'for' },
        { type: 'testCode', value: formatTestCodes(meta) },
      ];
      const sampleType = getSampleTypeValue(meta);
      if (sampleType) {
        details.push({ type: 'sampleType', value: sampleType });
      }
      return { action: 'Sample collected', details };
    }

    case 'sample_reject':
      return {
        action: 'Sample rejected',
        details: [
          { type: 'link', value: displayId.sample(event.entityId), to: entityLink },
          { type: 'text', value: '—' },
          { type: 'text', value: (meta.rejectionReason as string) || 'Quality issue' },
        ],
      };

    case 'sample_recollection_request': {
      const details: FormattedEvent['details'] = [
        { type: 'link', value: displayId.sample(event.entityId), to: entityLink },
        { type: 'text', value: 'replacing' },
        { type: 'id', value: displayId.sample(meta.originalSampleId as number) },
      ];
      const reason = metaString(meta.recollectionReason as string);
      if (reason) {
        details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      }
      const attempt = meta.recollectionAttempt;
      if (typeof attempt === 'number' && attempt > 0) {
        details.push({ type: 'text', value: `(attempt ${attempt})` });
      }
      return { action: 'Recollection requested', details };
    }

    case 'result_entry':
      return {
        action: 'Result entered',
        details: [
          { type: 'testCode', value: formatTestCodes(meta) },
          { type: 'text', value: 'for order' },
          { type: 'link', value: displayId.order(meta.orderId as number), to: `/orders/${meta.orderId || ''}` },
        ],
      };

    case 'result_validation_approve':
      return {
        action: 'Test completed',
        details: testCompletedDetails(meta),
      };

    case 'quality_issue_reported': {
      const details = orderAndTestDetails(meta);
      const domain = metaString(meta.domain as string) ?? metaString(event.afterState?.domain as string);
      const reason = metaString(meta.reason as string);
      const remedy = metaString(event.afterState?.remedy as string);

      if (domain) {
        if (details.length > 0) details.push({ type: 'text', value: '—' });
        details.push({ type: 'text', value: domain });
      }
      if (reason) {
        details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      }
      if (remedy) {
        details.push(
          { type: 'text', value: '→' },
          { type: 'text', value: remedy.replace(/_/g, ' ') }
        );
      }
      if (details.length === 0) {
        details.push({ type: 'text', value: 'Reported' });
      }
      return { action: 'Quality issue reported', details };
    }

    case 'escalation_resolution_authorize_retest': {
      const details: FormattedEvent['details'] = [
        { type: 'testCode', value: formatTestCodes(meta) },
        { type: 'text', value: '→' },
      ];
      const newTest = testRef(meta.newTestId);
      if (newTest) {
        details.push(newTest);
      } else {
        details.push({ type: 'text', value: 'New test' });
      }
      const link = orderLink(meta.orderId);
      if (link) details.push({ type: 'text', value: 'on order' }, link);
      const reason = metaString(meta.reason as string);
      if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      return { action: 'Retest authorized', details };
    }

    case 'escalation_resolution_authorize_recollect': {
      const details: FormattedEvent['details'] = [
        { type: 'testCode', value: formatTestCodes(meta) },
        { type: 'text', value: '→' },
      ];
      const newSample = sampleRef(meta.newSampleId);
      if (newSample) details.push(newSample);
      const link = orderLink(meta.orderId);
      if (link) details.push({ type: 'text', value: 'on order' }, link);
      const reason = metaString(meta.reason as string);
      if (reason) details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      return { action: 'Recollection authorized', details };
    }

    case 'escalation_resolution_force_validate':
      return {
        action: 'Test completed',
        details: [
          { type: 'text', value: 'Force validate' },
          { type: 'text', value: '—' },
          ...testCompletedDetails(meta),
        ],
      };

    case 'escalation_resolution_apply_amendment':
      return {
        action: 'Test completed',
        details: [
          { type: 'text', value: 'Amendment applied' },
          { type: 'text', value: '—' },
          ...testCompletedDetails(meta),
        ],
      };

    case 'escalation_resolution_cancel_test': {
      const details: FormattedEvent['details'] = [
        { type: 'testCode', value: formatTestCodes(meta) },
      ];
      const link = orderLink(meta.orderId);
      if (link) details.push({ type: 'text', value: 'on order' }, link);
      const reason = metaString(meta.reason as string) ?? 'Cancelled';
      details.push({ type: 'text', value: '—' }, { type: 'text', value: reason });
      return { action: 'Test cancelled', details };
    }

    case 'critical_value_detected': {
      const details: FormattedEvent['details'] = [
        { type: 'testCode', value: formatTestCodes(meta) },
        { type: 'text', value: 'in order' },
      ];
      const link = orderLink(meta.orderId);
      if (link) details.push(link);
      const summary = formatCriticalValuesSummary(meta.criticalValues);
      if (summary) details.push({ type: 'text', value: '—' }, { type: 'text', value: summary });
      return { action: 'Critical value detected', details };
    }

    case 'critical_value_notified': {
      const details: FormattedEvent['details'] = [
        { type: 'testCode', value: formatTestCodes(meta) },
        { type: 'text', value: '→' },
        { type: 'text', value: (meta.notifiedTo as string) || 'Provider' },
      ];
      const method = metaString(meta.notificationMethod as string);
      if (method) details.push({ type: 'text', value: `via ${method}` });
      const link = orderLink(meta.orderId);
      if (link) details.push({ type: 'text', value: 'on order' }, link);
      return { action: 'Critical value notified', details };
    }

    case 'critical_value_acknowledged': {
      const details: FormattedEvent['details'] = [
        { type: 'testCode', value: formatTestCodes(meta) },
        { type: 'text', value: 'by' },
        { type: 'text', value: (meta.acknowledgedBy as string) || 'Provider' },
      ];
      const link = orderLink(meta.orderId);
      if (link) details.push({ type: 'text', value: 'on order' }, link);
      return { action: 'Critical value acknowledged', details };
    }

    case 'recollection_request_created': {
      const details: FormattedEvent['details'] = [];
      const link = orderLink(event.entityId);
      if (link) details.push(link);
      const rejected = sampleRef(meta.rejectedSampleId);
      if (rejected) {
        details.push({ type: 'text', value: 'for' }, rejected);
      }
      const stage = metaString(meta.stage as string);
      if (stage) {
        details.push({ type: 'text', value: 'at' }, { type: 'text', value: stage });
      }
      return { action: 'Recollection request created', details };
    }

    case 'recollection_request_approved': {
      const details: FormattedEvent['details'] = [];
      const link = orderLink(event.entityId);
      if (link) details.push(link);
      const created = sampleRef(meta.createdSampleId);
      if (created) {
        details.push({ type: 'text', value: '→' }, created);
      }
      return { action: 'Recollection request approved', details };
    }

    case 'recollection_request_denied': {
      const details: FormattedEvent['details'] = [];
      const link = orderLink(event.entityId);
      if (link) details.push(link);
      const notes = metaString(meta.reviewNotes as string);
      if (notes) {
        details.push({ type: 'text', value: '—' }, { type: 'text', value: notes });
      }
      return { action: 'Recollection request denied', details };
    }

    case 'escalation_trigger_crit_val':
    case 'escalation_trigger_rej_samp':
    case 'escalation_trigger_limit_hit':
    case 'escalation_trigger_amend_res':
      return {
        action: formatEscalationTriggerAction(event.type),
        details: escalationTriggerDetails(meta),
      };

    case 'test_added':
      return {
        action: 'Test added',
        details: [
          { type: 'testCode', value: formatTestCodes(meta) },
          { type: 'text', value: 'to order' },
          ...(orderLink(meta.orderId) ? [orderLink(meta.orderId)!] : []),
        ],
      };

    case 'test_removed':
      return {
        action: 'Test removed',
        details: [
          { type: 'testCode', value: formatTestCodes(meta) },
          { type: 'text', value: 'from order' },
          ...(orderLink(meta.orderId) ? [orderLink(meta.orderId)!] : []),
        ],
      };

    case 'order_status_change': {
      const status = getStatusValue(event);
      if (status === 'completed') {
        const details: FormattedEvent['details'] = [];
        const link = orderLink(event.entityId);
        if (link) details.push(link);
        details.push({ type: 'status', value: 'completed' });
        return { action: 'Order completed', details };
      }

      const details: FormattedEvent['details'] = [
        { type: 'link', value: displayId.order(event.entityId), to: `/orders/${event.entityId}` },
        { type: 'text', value: '→' },
      ];
      const beforeStatus = metaString(event.beforeState?.status as string);
      if (beforeStatus && beforeStatus !== status) {
        details.push({ type: 'status', value: beforeStatus });
        details.push({ type: 'text', value: '→' });
      }
      if (status) {
        details.push({ type: 'status', value: status });
      }
      return { action: 'Order status changed', details };
    }

    default:
      return {
        action: event.type.replace(/_/g, ' '),
        details: entityDetails(event),
      };
  }
}

function formatEvent(event: TimelineEvent): FormattedEvent {
  return appendNote(event, formatEventDetails(event));
}

type EventTone = 'problem' | 'resolution' | 'neutral';

const PROBLEM_EVENT_TYPES = new Set([
  'sample_reject',
  'quality_issue_reported',
  'critical_value_detected',
  'critical_value_notified',
  'escalation_trigger_crit_val',
  'escalation_trigger_rej_samp',
  'escalation_trigger_limit_hit',
  'escalation_trigger_amend_res',
  'recollection_request_denied',
  'test_removed',
  'escalation_resolution_cancel_test',
  'sample_recollection_request',
  'recollection_request_created',
]);

const RESOLUTION_EVENT_TYPES = new Set([
  'result_validation_approve',
  'critical_value_acknowledged',
  'recollection_request_approved',
  'escalation_resolution_force_validate',
  'escalation_resolution_apply_amendment',
  'escalation_resolution_authorize_retest',
  'escalation_resolution_authorize_recollect',
]);

const EVENT_TONE_DOT: Record<EventTone, string> = {
  problem: 'bg-danger-fg-emphasis',
  resolution: 'bg-success-fg-emphasis',
  neutral: 'bg-brand',
};

function getEventTone(event: TimelineEvent): EventTone {
  if (
    event.type === 'order_status_change' &&
    event.afterState?.status === 'completed'
  ) {
    return 'resolution';
  }

  if (PROBLEM_EVENT_TYPES.has(event.type) || event.type.includes('reject')) {
    return 'problem';
  }

  if (RESOLUTION_EVENT_TYPES.has(event.type)) {
    return 'resolution';
  }

  if (event.type.startsWith('escalation_resolution_')) {
    return 'resolution';
  }

  if (event.type.startsWith('escalation_trigger_')) {
    return 'problem';
  }

  return 'neutral';
}

function TimelineGroup({ label, items }: GroupedEvents) {
  return (
    <section className="px-4 pb-4 first:pt-1">
      <div className="flex items-center gap-2 py-2 sticky top-0 z-1 bg-surface/95">
        <div className="flex-1 h-px bg-stroke/80" />
        <span className="text-xxs font-light text-text-tertiary uppercase tracking-widest">
          {label}
        </span>
        <div className="flex-1 h-px bg-stroke/80" />
      </div>
      <ul className="space-y-0 list-none relative">
        {/* Vertical line positioned to align with dot centers */}
        <div
          className="absolute top-2 bottom-2 w-px bg-stroke/60 pointer-events-none left-[3px]"
          aria-hidden="true"
        />
        {items.map(event => {
          const tone = getEventTone(event);
          const formatted = formatEvent(event);

          return (
            <li key={event.id} className="flex items-start gap-2.5 relative">
              <div
                className={`w-2 h-2 rounded-full border-2 border-surface shrink-0 mt-1.5 z-10 ${EVENT_TONE_DOT[tone]}`}
              />
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                  <span className="text-sm font-normal text-text-secondary">
                    {formatted.action}
                  </span>
                  {formatted.details.map((detail, idx) => {
                    if (detail.type === 'status' || detail.type === 'sampleType') {
                      return <Badge key={idx} variant={detail.value} size="xs" />;
                    }
                    if (detail.type === 'testCode' || detail.type === 'id') {
                      return (
                        <span key={idx} className="entity-id">
                          {detail.value}
                        </span>
                      );
                    }
                    if (detail.type === 'link' && detail.to) {
                      return (
                        <Link
                          key={idx}
                          to={detail.to}
                          className="entity-id entity-id--clickable"
                        >
                          {detail.value}
                        </Link>
                      );
                    }
                    return (
                      <span key={idx} className="text-sm text-text-secondary">
                        {detail.value}
                      </span>
                    );
                  })}
                </div>
                {formatted.note && (
                  <p className="text-xs text-text-tertiary mt-0.5">{formatted.note}</p>
                )}
                <p className="text-xs text-text-tertiary mt-1">
                  {event.performedByName || `User ${event.performedBy}`}
                  {' · '}
                  <time dateTime={event.timestamp}>
                    {formatRelativeDateTime(new Date(event.timestamp))}
                  </time>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  events,
  isLoading = false,
  isError = false,
  onRetry,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) => {
  const grouped = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const event of events) {
      const timestamp = new Date(event.timestamp);
      const label = formatRelativeDateLabel(timestamp);
      const list = groups.get(label) ?? [];
      list.push(event);
      groups.set(label, list);
    }
    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items: items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    }));
  }, [events]);

  if (isError) return <TimelineError onRetry={onRetry} />;
  if (isLoading) return <TimelineSkeleton />;
  if (grouped.length === 0) return <TimelineEmpty />;

  return (
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-auto min-h-0">
        {grouped.map(group => (
          <TimelineGroup key={group.label} label={group.label} items={group.items} />
        ))}
        {hasMore && onLoadMore && (
          <div className="px-4 py-2 flex justify-center border-t border-stroke/80">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="text-sm text-brand hover:underline disabled:opacity-60"
            >
              {isLoadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
