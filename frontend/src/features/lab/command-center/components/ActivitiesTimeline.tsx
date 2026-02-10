/**
 * ActivitiesTimeline - Lab operations activity timeline matching the design.
 * Shows recent lab operations grouped by date with Badge components for entities.
 */
import React, { useMemo } from 'react';
import { Badge } from '@/shared/ui/display/Badge';
import { displayId } from '@/utils/ids/idDisplay';
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

function formatDateTime(date: Date): string {
  const time = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${getDateLabel(date)}, ${time}`;
}

function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  }
  if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function groupByDate(items: ActivityItem[]): GroupedActivities[] {
  const groups = new Map<string, ActivityItem[]>();

  for (const item of items) {
    const label = getDateLabel(item.timestamp);
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
      <div className={`flex flex-col h-full bg-panel ${className}`}>
        <div className="px-4 py-3">
          <div className="h-5 w-16 bg-panel-hover animate-pulse rounded" />
        </div>
        <div className="flex-1 overflow-auto px-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-panel-hover animate-pulse mt-1.5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-panel-hover animate-pulse rounded w-3/4" />
                <div className="h-3 bg-panel-hover animate-pulse rounded w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groupedActivities.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-fg-muted bg-panel ${className}`}>
        <p className="text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className} bg-panel`}>
      <div className="flex-1 overflow-auto">
        {groupedActivities.map((group) => (
          <div key={group.label} className="px-4 pb-4">
            <div className="flex items-center gap-3 py-3">
              <div className="flex-1 h-px bg-stroke" />
              <span className="text-xs font-normal text-fg-muted tracking-wider">
                {group.label}
              </span>
              <div className="flex-1 h-px bg-stroke" />
            </div>
            <div className="relative">
              {/* Vertical line centered in the dot column (w-2 = 8px, center at 4px) */}
              <div className="absolute left-0 top-3 bottom-3 w-2 flex justify-center pointer-events-none" aria-hidden>
                <div className="w-px h-full bg-stroke" />
              </div>

              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 relative">
                    <div className="w-2 flex justify-center shrink-0 z-10 pt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-neutral-500" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      {item.lines.map((line, lineIdx) => (
                        <p
                          key={lineIdx}
                          className="text-sm text-fg leading-relaxed flex flex-wrap items-center gap-x-1.5 gap-y-1"
                        >
                          {line.map((segment, idx) => {
                            if (segment.type === 'name') {
                              return (
                                <span key={idx} className="font-normal text-brand">
                                  {segment.value}
                                </span>
                              );
                            }
                            if (segment.type === 'badge') {
                              return (
                                <Badge
                                  key={idx}
                                  variant={segment.variant}
                                  size="xs"
                                  className={segment.isId ? 'font-mono' : undefined}
                                >
                                  {segment.value}
                                </Badge>
                              );
                            }
                            return <span key={idx}>{segment.value}</span>;
                          })}
                        </p>
                      ))}
                      <p className="text-xxs font-normal text-fg-muted">
                        {formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
