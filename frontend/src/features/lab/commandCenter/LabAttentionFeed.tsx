/**
 * Attention feed — items grouped by attention type (payment, recollect, escalation, SLA, …).
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, EntityId } from '@/components';
import { cn, displayId } from '@/utils';
import { getLabQueueUrl } from '@/features/lab/constants/labConstants';
import { COMMAND_CENTER_ATTENTION_ACCENT } from './commandCenterStyles';
import type { LabAttentionQueueItem, AttentionType } from './commandCenterModel';
import {
  ATTENTION_TYPE_ORDER,
  getAttentionTone,
  getAttentionTypeConfig,
} from './commandCenterModel';
import { formatLabAttentionQueueItem, type AttentionDetail } from './commandCenterAttentionFormat';
import { COMMAND_CENTER_TIMELINE } from '@/features/lab/timeline/labTimelineShared';

export interface LabAttentionFeedProps {
  items: LabAttentionQueueItem[];
}

function FeedDetail({ detail }: { detail: AttentionDetail }) {
  switch (detail.type) {
    case 'link':
    case 'testId':
      return <EntityId variant="inline">{detail.value}</EntityId>;
    case 'priority':
      return <Badge variant={detail.value as 'urgent' | 'high'} size="xs" />;
    case 'wait':
      return <span className="text-xs tabular-nums text-text-tertiary">{detail.value}</span>;
    default:
      return <span className="text-xs text-text-secondary">{detail.value}</span>;
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
          'group flex min-w-0 gap-2 rounded-sm border border-border-subtle px-2 py-1.5',
          'transition-colors hover:border-border-hover hover:bg-surface-hover/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
        )}
      >
        <span
          className={cn('w-0.5 shrink-0 self-stretch rounded-full', COMMAND_CENTER_ATTENTION_ACCENT[tone])}
          aria-hidden
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Badge variant={typeConfig.badgeVariant} size="xs">
              {typeConfig.pillLabel}
            </Badge>
            <span className="min-w-0 text-sm font-light text-text-primary group-hover:text-brand-fg">
              {formatted.action}
            </span>
          </div>

          {formatted.details.length > 0 && (
            <div className={COMMAND_CENTER_TIMELINE.eventDetails}>
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
    <section className="pb-3 last:pb-0">
      <div className={COMMAND_CENTER_TIMELINE.groupHeader}>
        <div className={COMMAND_CENTER_TIMELINE.groupDivider} />
        <span className={COMMAND_CENTER_TIMELINE.groupLabel}>
          {config.groupLabel}
          <span className="ml-1.5 tabular-nums text-text-tertiary">({items.length})</span>
        </span>
        <div className={COMMAND_CENTER_TIMELINE.groupDivider} />
      </div>
      <ul className="space-y-1">
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
      <div className="flex h-full flex-col items-center justify-center bg-surface px-4">
        <p className="text-sm text-text-secondary">No holds, escalations, or STAT work pending.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {groups.map(group => (
          <LabAttentionFeedGroup key={group.type} type={group.type} items={group.items} />
        ))}
      </div>
    </div>
  );
};
