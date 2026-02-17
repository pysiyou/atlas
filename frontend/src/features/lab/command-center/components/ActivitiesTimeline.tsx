/**
 * ActivitiesTimeline - Lab operations activity timeline matching the design.
 * Shows recent lab operations grouped by date with Badge components for entities.
 */
import React, { useMemo } from 'react';
import { Badge } from '@/shared/ui/Badge';
import { ClaudeLoader } from '@/shared/ui';
import { displayId } from '@/utils/ids/idDisplay';
import { formatRelativeDateLabel, formatRelativeDateTime } from '@/utils';
import type { LabOperationRecord, LabOperationType } from '@/types/lab-operations';

export interface ActivitiesTimelineProps {
  logs: LabOperationRecord[];
  isLoading?: boolean;
  className?: string;
}

interface ActivitySegment {
  type: 'text' | 'badge' | 'name';
  value: string;
  variant?: string;
  /** Whether this segment displays an ID (uses font-mono) */
  isId?: boolean;
}

/** Each activity can have multiple lines of segments */
interface ActivityItem {
  id: number;
  lines: ActivitySegment[][];
  timestamp: Date;
}

interface GroupedActivities {
  label: string;
  items: ActivityItem[];
}

/**
 * Format name to show first and last name only
 * "John Michael Smith" -> "John Smith"
 * "Jane Doe" -> "Jane Doe"
 * "Admin" -> "Admin"
 */
function formatPerformerName(name: string): string {
  if (!name) return 'System';
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/**
 * Transform a lab operation record into display lines
 * Order-related: Line 1: {user} changed the status of {order}, Line 2: from {status1} to {status2}
 */
function transformLogToActivity(log: LabOperationRecord): ActivityItem {
  const lines: ActivitySegment[][] = [];
  const opType = log.operationType;
  const performer = formatPerformerName(log.performedByName || log.performedBy || 'System');

  switch (opType) {
    case 'order_status_change': {
      const beforeStatus = log.beforeState?.status as string | undefined;
      const afterStatus = log.afterState?.status as string | undefined;
      // Line 1: {user} changed the status of {order}
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'changed the status of' },
        { type: 'badge', value: displayId.order(log.entityId), variant: 'primary', isId: true },
      ]);
      // Line 2: from {status1} to {status2}
      const line2: ActivitySegment[] = [{ type: 'text', value: 'from' }];
      if (beforeStatus) {
        line2.push({ type: 'badge', value: beforeStatus.toUpperCase(), variant: beforeStatus });
      }
      line2.push({ type: 'text', value: 'to' });
      if (afterStatus) {
        line2.push({ type: 'badge', value: afterStatus.toUpperCase(), variant: afterStatus });
      }
      lines.push(line2);
      break;
    }
    case 'sample_collect': {
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'collected sample' },
        { type: 'badge', value: displayId.sample(log.entityId), variant: 'collected', isId: true },
      ]);
      break;
    }
    case 'sample_reject': {
      const line1: ActivitySegment[] = [
        { type: 'name', value: performer },
        { type: 'text', value: 'rejected sample' },
        { type: 'badge', value: displayId.sample(log.entityId), variant: 'rejected', isId: true },
      ];
      lines.push(line1);
      if (log.comment) {
        lines.push([{ type: 'badge', value: log.comment, variant: 'muted' }]);
      }
      break;
    }
    case 'sample_recollection_request': {
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'requested recollection for' },
        { type: 'badge', value: displayId.sample(log.entityId), variant: 'pending', isId: true },
      ]);
      break;
    }
    case 'result_entry': {
      const testCode = log.operationData?.testCode as string | undefined;
      const orderId = log.operationData?.orderId as number | undefined;
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'entered results for' },
        { type: 'badge', value: testCode || displayId.orderTest(log.entityId), variant: 'in-progress', isId: true },
      ]);
      if (orderId) {
        lines.push([
          { type: 'text', value: 'in' },
          { type: 'badge', value: displayId.order(orderId), variant: 'primary', isId: true },
        ]);
      }
      break;
    }
    case 'result_validation_approve': {
      const testCode = log.operationData?.testCode as string | undefined;
      const orderId = log.operationData?.orderId as number | undefined;
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'validated' },
        { type: 'badge', value: testCode || displayId.orderTest(log.entityId), variant: 'validated', isId: true },
      ]);
      if (orderId) {
        lines.push([
          { type: 'text', value: 'in' },
          { type: 'badge', value: displayId.order(orderId), variant: 'primary', isId: true },
        ]);
      }
      break;
    }
    case 'result_validation_reject_retest': {
      const testCode = log.operationData?.testCode as string | undefined;
      const orderId = log.operationData?.orderId as number | undefined;
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'rejected' },
        { type: 'badge', value: testCode || displayId.orderTest(log.entityId), variant: 'rejected', isId: true },
        ...(orderId ? [
          { type: 'text' as const, value: 'in' },
          { type: 'badge' as const, value: displayId.order(orderId), variant: 'primary', isId: true },
        ] : []),
      ]);
      lines.push([
        { type: 'text', value: 'ordered' },
        { type: 'badge', value: 'retest', variant: 're-test' },
      ]);
      break;
    }
    case 'result_validation_reject_recollect': {
      const testCode = log.operationData?.testCode as string | undefined;
      const orderId = log.operationData?.orderId as number | undefined;
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'rejected' },
        { type: 'badge', value: testCode || displayId.orderTest(log.entityId), variant: 'rejected', isId: true },
        ...(orderId ? [
          { type: 'text' as const, value: 'in' },
          { type: 'badge' as const, value: displayId.order(orderId), variant: 'primary', isId: true },
        ] : []),
      ]);
      lines.push([
        { type: 'text', value: 'requested' },
        { type: 'badge', value: 'recollection', variant: 're-collect' },
      ]);
      break;
    }
    case 'result_validation_escalate': {
      const testCode = log.operationData?.testCode as string | undefined;
      const orderId = log.operationData?.orderId as number | undefined;
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'escalated' },
        { type: 'badge', value: testCode || displayId.orderTest(log.entityId), variant: 'escalated', isId: true },
        ...(orderId ? [
          { type: 'text' as const, value: 'in' },
          { type: 'badge' as const, value: displayId.order(orderId), variant: 'primary', isId: true },
        ] : []),
      ]);
      break;
    }
    case 'escalation_resolution_authorize_retest': {
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'resolved escalation' },
      ]);
      lines.push([{ type: 'badge', value: 'authorized retest', variant: 'authorize_retest' }]);
      break;
    }
    case 'escalation_resolution_final_reject': {
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'resolved escalation' },
      ]);
      lines.push([{ type: 'badge', value: 'final rejection', variant: 'rejected' }]);
      break;
    }
    case 'test_added': {
      const testCode = log.operationData?.testCode as string | undefined;
      const orderId = (log.operationData?.orderId as number) || log.entityId;
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'added' },
        { type: 'badge', value: testCode || 'test', variant: 'success', isId: !!testCode },
        { type: 'text', value: 'to' },
        { type: 'badge', value: displayId.order(orderId), variant: 'primary', isId: true },
      ]);
      break;
    }
    case 'test_removed': {
      const testCode = log.operationData?.testCode as string | undefined;
      const orderId = (log.operationData?.orderId as number) || log.entityId;
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'removed' },
        { type: 'badge', value: testCode || 'test', variant: 'muted', isId: !!testCode },
        { type: 'text', value: 'from' },
        { type: 'badge', value: displayId.order(orderId), variant: 'primary', isId: true },
      ]);
      break;
    }
    case 'critical_value_detected': {
      const testCode = log.operationData?.testCode as string | undefined;
      lines.push([
        { type: 'badge', value: 'Critical value', variant: 'critical' },
        { type: 'text', value: 'detected in' },
        { type: 'badge', value: testCode || displayId.orderTest(log.entityId), variant: 'info', isId: true },
      ]);
      break;
    }
    case 'critical_value_notified': {
      const notifiedTo = log.operationData?.notifiedTo as string | undefined;
      const line1: ActivitySegment[] = [
        { type: 'name', value: performer },
        { type: 'text', value: 'sent' },
        { type: 'badge', value: 'critical value', variant: 'critical' },
        { type: 'text', value: 'notification' },
      ];
      if (notifiedTo) {
        line1.push({ type: 'text', value: `to ${notifiedTo}` });
      }
      lines.push(line1);
      break;
    }
    case 'critical_value_acknowledged': {
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: 'acknowledged' },
        { type: 'badge', value: 'critical value', variant: 'critical' },
      ]);
      break;
    }
    default: {
      // Generic fallback - use appropriate ID formatter based on entity type
      const entityDisplayId = log.entityType === 'order'
        ? displayId.order(log.entityId)
        : log.entityType === 'sample'
        ? displayId.sample(log.entityId)
        : displayId.orderTest(log.entityId);
      lines.push([
        { type: 'name', value: performer },
        { type: 'text', value: formatOperationType(opType).toLowerCase() },
        { type: 'badge', value: entityDisplayId, variant: 'neutral', isId: true },
      ]);
    }
  }

  return {
    id: log.id,
    lines,
    timestamp: new Date(log.performedAt),
  };
}

function formatOperationType(type: LabOperationType): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function groupByDate(items: ActivityItem[]): GroupedActivities[] {
  const groups = new Map<string, ActivityItem[]>();

  for (const item of items) {
    const label = formatRelativeDateLabel(item.timestamp);
    const existing = groups.get(label) || [];
    existing.push(item);
    groups.set(label, existing);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    label,
    items: items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
  }));
}

export const ActivitiesTimeline: React.FC<ActivitiesTimelineProps> = ({
  logs,
  isLoading = false,
  className = '',
}) => {
  const groupedActivities = useMemo(() => {
    const activities = logs.map(transformLogToActivity);
    return groupByDate(activities);
  }, [logs]);

  if (isLoading) {
    return (
      <div className={`flex flex-col h-full bg-surface ${className}`}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-10">
          <div className="rounded-full bg-surface-hover p-3 shadow-sm">
            <ClaudeLoader size="sm" color="var(--success-fg)" />
          </div>
          <p className="text-sm text-text-tertiary font-medium">Loading activities...</p>
        </div>
      </div>
    );
  }

  if (groupedActivities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-surface ${className}`}>
        <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center mb-3">
          <span className="text-text-disabled text-lg" aria-hidden>◇</span>
        </div>
        <p className="text-sm text-text-secondary font-medium">No recent activity</p>
        <p className="text-xxs text-text-tertiary mt-0.5">Activity will appear here</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-surface ${className}`}>
      <div className="flex-1 overflow-auto scroll-smooth">
        {groupedActivities.map((group) => (
          <section key={group.label} className="px-4 pb-6 first:pt-1">
            <div className="flex items-center gap-3 py-3 sticky top-0 z-1 bg-surface/95 backdrop-blur-[2px]">
              <div className="flex-1 h-px bg-stroke/80 min-w-0" />
              <span className="text-xxs font-medium text-text-tertiary uppercase tracking-widest shrink-0">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-stroke/80 min-w-0" />
            </div>
            <div className="relative">
              {/* Vertical line centered under the dot column (10px wide, center at 5px) */}
              <div
                className="absolute top-4 bottom-4 w-px bg-gradient-to-b from-stroke via-stroke/60 to-stroke pointer-events-none"
                aria-hidden
                style={{ left: '5px', transform: 'translateX(-50%)' }}
              />
              <ul className="space-y-0 list-none">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 relative">
                    <div className="w-[10px] flex justify-center shrink-0 z-10 pt-[7px]">
                      <div
                        className="w-2 h-2 rounded-full border-2 border-surface bg-brand shrink-0 ring-2 ring-surface"
                        aria-hidden
                      />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 pb-4">
                      <p className="text-sm text-text-primary leading-[1.45] flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
                        {item.lines.flatMap((line, lineIdx) =>
                          lineIdx === 0
                            ? line.map((segment, idx) => ({ segment, key: `${lineIdx}-${idx}` }))
                            : [{ segment: { type: 'text' as const, value: ' ' }, key: `space-${lineIdx}` }, ...line.map((segment, idx) => ({ segment, key: `${lineIdx}-${idx}` }))]
                        ).map(({ segment, key }) =>
                          segment.type === 'name' ? (
                            <span key={key} className="font-medium text-brand">
                              {segment.value}
                            </span>
                          ) : segment.type === 'badge' ? (
                            <Badge
                              key={key}
                              variant={segment.variant}
                              size="xs"
                              className={segment.isId ? 'font-mono' : undefined}
                            >
                              {segment.value}
                            </Badge>
                          ) : (
                            <span key={key} className="text-text-secondary">
                              {segment.value}
                            </span>
                          )
                        )}
                      </p>
                      <p className="text-xxs font-normal text-text-tertiary mt-1.5 tabular-nums">
                        {formatRelativeDateTime(item.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
