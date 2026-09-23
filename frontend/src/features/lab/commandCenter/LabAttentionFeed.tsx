/**
 * Attention feed — items grouped by attention type (payment, recollect, escalation, SLA, …).
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EMPTY_COPY, DASHBOARD_EMPTY_STATE_TEXT, Badge, EntityId } from '@/components';
import { LabPriorityBadge } from '../components/LabDomainBadges';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import { cn, displayId } from '@/utils';
import { getLabQueueUrl } from '@/features/lab';
import { COMMAND_CENTER_ATTENTION_ACCENT } from './commandCenterStyles';
import type { LabAttentionQueueItem, AttentionType } from './commandCenterModel';
import {
  ATTENTION_TYPE_ORDER,
  getAttentionTone,
  getAttentionTypeConfig,
} from './commandCenterModel';
import { formatLabAttentionQueueItem, type AttentionDetail } from './commandCenterAttentionFormat';
import { TIMELINE_STYLES } from '@/features/timeline';
import { CONTROL, RADIUS, TYPE } from '@/components/theme/recipes';


export interface LabAttentionFeedProps {
  items: LabAttentionQueueItem[];
}

function FeedDetail({ detail }: { detail: AttentionDetail }) {
  switch (detail.type) {
    case 'link':
    case 'testId':
      return <EntityId variant="inline">{detail.value}</EntityId>;
    case 'priority':
      return <LabPriorityBadge priority={detail.value} size="xs" />;
    case 'wait':
      return <span className={`${TYPE.meta} tabular-nums`}>{detail.value}</span>;
    default:
      return <span className={TYPE.label}>{detail.value}</span>;
  }
}

function LabAttentionFeedRow({ item }: { item: LabAttentionQueueItem }) {
  const type = item.attentionType;
  const typeConfig = getAttentionTypeConfig(type);
  const tone = getAttentionTone(type);
  const formatted = formatLabAttentionQueueItem(item, type);
  const href = getLabQueueUrl(item.queueTab, {
    search: displayId.order(item.orderId),
  });

  return (
    <li>
      <Link
        to={href}
        className={cn(
          `group flex min-w-0 gap-space-2 ${RADIUS.field} border border-border-subtle px-space-2 py-space-1-5`,
          'transition-colors hover:border-border-hover hover:bg-surface-hover/50',
          CONTROL.focusVisibleFlat,
        )}
      >
        <span
          className={cn(`w-0.5 shrink-0 self-stretch ${RADIUS.pill}`, COMMAND_CENTER_ATTENTION_ACCENT[tone])}
          aria-hidden
        />

        <div className="min-w-0 flex-1 space-y-space-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-space-2 gap-y-space-1">
            <Badge
              variant={resolveStatusBadgeColor(typeConfig.badgeVariant)}
              label={typeConfig.pillLabel}
              size="xs"
            />
            <span className="min-w-0 text-xs font-light text-text-primary group-hover:text-brand-fg">
              {formatted.action}
            </span>
          </div>

          {formatted.details.length > 0 && (
            <div className={TIMELINE_STYLES.eventDetails}>
              {formatted.details.map((detail, idx) => (
                <FeedDetail key={idx} detail={detail} />
              ))}
            </div>
          )}
        </div>
      </Link>
    </li>
  );
}

function LabAttentionFeedGroup({
  type,
  items,
}: {
  type: AttentionType;
  items: LabAttentionQueueItem[];
}) {
  const config = getAttentionTypeConfig(type);

  return (
    <section className="pb-space-3 last:pb-0">
      <div className={TIMELINE_STYLES.groupHeader}>
        <div className={TIMELINE_STYLES.groupDivider} />
        <span className={TIMELINE_STYLES.groupLabel}>
          {config.groupLabel}
          <span className="ml-space-1.5 tabular-nums text-text-tertiary">({items.length})</span>
        </span>
        <div className={TIMELINE_STYLES.groupDivider} />
      </div>
      <ul className="space-y-space-1">
        {items.map(item => (
          <LabAttentionFeedRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export const LabAttentionFeed: React.FC<LabAttentionFeedProps> = ({ items }) => {
  const groups = useMemo(() => {
    const map = new Map<AttentionType, LabAttentionQueueItem[]>();

    for (const item of items) {
      const type = item.attentionType;
      const bucket = map.get(type) ?? [];
      bucket.push(item);
      map.set(type, bucket);
    }

    return ATTENTION_TYPE_ORDER.filter(type => map.has(type)).map(type => ({
      type,
      items: map.get(type) ?? [],
    }));
  }, [items]);

  if (groups.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-surface">
        <EmptyState
          {...DASHBOARD_EMPTY_STATE_TEXT}
          title={EMPTY_COPY.pendingAttention.title}
          description={EMPTY_COPY.pendingAttention.description}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-y-auto px-space-3 py-space-2">
        {groups.map(group => (
          <LabAttentionFeedGroup key={group.type} type={group.type} items={group.items} />
        ))}
      </div>
    </div>
  );
};
