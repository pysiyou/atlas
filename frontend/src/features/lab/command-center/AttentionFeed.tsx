/**
 * Attention feed — items grouped by attention type (payment, recollect, escalation, SLA, …).
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components';
import { cn, displayId } from '@/utils';
import { ENTITY_ID } from '@/utils/constants';
import { getLabQueueUrl } from '../constants/labTabs';
import {
  ATTENTION_TYPE_ORDER,
  getAttentionTone,
  getAttentionType,
  getAttentionTypeConfig,
} from './attentionCategories';
import { formatAttentionItem, type AttentionDetail } from './formatAttentionItem';
import { COMMAND_CENTER_BADGE_TEXT, COMMAND_CENTER_TIMELINE } from './components/styles';
import type { CommandCenterTimelineTone } from './components/styles';
import type { AttentionItem } from './hooks/useLabTechBoard';
import type { AttentionType } from './attentionCategories';

export interface AttentionFeedProps {
  items: AttentionItem[];
}

const ACCENT_TONE: Record<CommandCenterTimelineTone, string> = {
  problem: 'bg-danger-fg-emphasis',
  resolution: 'bg-success-fg-emphasis',
  neutral: 'bg-warning-fg-emphasis',
};

function itemSortScore(item: AttentionItem): number {
  const priorityWeight =
    item.priority === 'urgent' ? 4 : item.priority === 'high' ? 3 : item.priority === 'medium' ? 2 : 1;
  return item.waitingHours * 10 + priorityWeight * 100;
}

function FeedDetail({ detail }: { detail: AttentionDetail }) {
  switch (detail.type) {
    case 'link':
    case 'testId':
      return <span className={ENTITY_ID}>{detail.value}</span>;
    case 'priority':
      return <Badge variant={detail.value as 'urgent' | 'high'} size="xs" />;
    case 'wait':
      return <span className="text-xs tabular-nums text-text-tertiary">{detail.value}</span>;
    default:
      return <span className="text-xs text-text-secondary">{detail.value}</span>;
  }
}

function AttentionFeedRow({ item }: { item: AttentionItem }) {
  const type = getAttentionType(item);
  const typeConfig = getAttentionTypeConfig(type);
  const tone = getAttentionTone(item);
  const formatted = formatAttentionItem(item, type);
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
          className={cn('w-0.5 shrink-0 self-stretch rounded-full', ACCENT_TONE[tone])}
          aria-hidden
        />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <Badge
              variant={typeConfig.badgeVariant}
              size="xs"
              className={COMMAND_CENTER_BADGE_TEXT[typeConfig.badgeTextTone]}
            >
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

function AttentionFeedGroup({
  type,
  items,
}: {
  type: AttentionType;
  items: AttentionItem[];
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
          <AttentionFeedRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export const AttentionFeed: React.FC<AttentionFeedProps> = ({ items }) => {
  const groups = useMemo(() => {
    const map = new Map<AttentionType, AttentionItem[]>();

    for (const item of items) {
      const type = getAttentionType(item);
      const bucket = map.get(type) ?? [];
      bucket.push(item);
      map.set(type, bucket);
    }

    return ATTENTION_TYPE_ORDER.filter(type => map.has(type)).map(type => ({
      type,
      items: (map.get(type) ?? []).sort((a, b) => itemSortScore(b) - itemSortScore(a)),
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
          <AttentionFeedGroup key={group.type} type={group.type} items={group.items} />
        ))}
      </div>
    </div>
  );
};
