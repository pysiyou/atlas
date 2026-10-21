/**
 * Needs-attention panel — grouped feed of prioritized lab exceptions.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EMPTY_COPY, DENSE_EMPTY_STATE_TEXT } from '@/components/display';
import { RecordId } from '@/features/shared/components';
import { Badge } from '@/components/primitives';
import { Panel } from '@/components/surfaces';
import { LabPriorityBadge } from '../components/LabDomainBadges';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import { cn, displayId } from '@/utils';
import { getLabQueueUrl } from '@/features/lab';
import {CONTROL, FEED_ACCENT, FEED_GROUPED, RADIUS, FG } from '@/theme/recipes';
import { Text } from '@/components/layout';
import { LAB_COPY } from '../constants/labConstants';
import {
  ATTENTION_TYPE_ORDER,
  getAttentionTone,
  getAttentionTypeConfig,
  type AttentionType,
  type LabAttentionQueueItem,
} from './monitorModel';
import { formatLabAttentionQueueItem, type AttentionDetail } from './monitorAttentionFormat';

const IDENTITY_DETAIL_TYPES = new Set<AttentionDetail['type']>(['patient', 'link', 'testId']);

function isIdentityDetail(detail: AttentionDetail): boolean {
  return IDENTITY_DETAIL_TYPES.has(detail.type);
}

function FeedDetail({ detail }: { detail: AttentionDetail }) {
  switch (detail.type) {
    case 'patient':
      return (
        <Text role="body" density="table" truncate className="font-normal capitalize">
          {detail.value}
        </Text>
      );
    case 'link':
    case 'testId':
      return <RecordId emphasis="inline">{detail.value}</RecordId>;
    case 'queueStage':
      return (
        <Text role="body" intent="muted" density="table" truncate className="font-normal">
          {detail.stageLabel}
        </Text>
      );
    case 'queueCount':
      return (
        <Text role="body" intent="muted" density="table" truncate className="font-normal tabular-nums">
          {detail.count} {detail.unit}
        </Text>
      );
    case 'priority':
      return <LabPriorityBadge priority={detail.value} size="xs" />;
    case 'wait':
      return (
        <Text role="body" intent="muted" density="table" truncate className="font-normal tabular-nums">
          {detail.value}
        </Text>
      );
    default:
      return (
        <Text role="body" intent="muted" density="table" truncate className="font-normal">
          {detail.value}
        </Text>
      );
  }
}

function AttentionDetailRow({ details }: { details: AttentionDetail[] }) {
  if (details.length === 0) {
    return null;
  }

  return (
    <div className={FEED_GROUPED.detailRow}>
      {details.map((detail, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 ? (
            <span className={FEED_GROUPED.detailDivider} aria-hidden />
          ) : null}
          <div className="min-w-0 max-w-full shrink-0">
            <FeedDetail detail={detail} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function AttentionFeedRow({ item }: { item: LabAttentionQueueItem }) {
  const type = item.attentionType;
  const typeConfig = getAttentionTypeConfig(type);
  const tone = getAttentionTone(type);
  const formatted = formatLabAttentionQueueItem(item, type);
  const href = getLabQueueUrl(item.queueTab, {
    search: displayId.order(item.orderId),
  });

  const identityDetails = formatted.details.filter(isIdentityDetail);
  const contextDetails = formatted.details.filter(detail => !isIdentityDetail(detail));

  return (
    <li>
      <Link
        to={href}
        className={cn(
          `flex min-w-0 gap-space-2 ${RADIUS.field} border border-border-subtle px-space-2 py-space-1-5`,
          'transition-colors hover:bg-surface-hover',
          CONTROL.focusVisibleFlat,
        )}
      >
        <span
          className={cn(`w-0.5 shrink-0 self-stretch ${RADIUS.pill}`, FEED_ACCENT[tone])}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-space-1.5">
          <div className="flex min-w-0 items-start justify-between gap-x-space-2 gap-y-space-1">
            <span className={cn(FEED_GROUPED.eventHeadline, 'min-w-0')}>{formatted.action}</span>
            <Badge
              variant={resolveStatusBadgeColor(typeConfig.badgeVariant)}
              label={typeConfig.pillLabel}
              size="xs"
              className="shrink-0"
            />
          </div>
          <AttentionDetailRow details={identityDetails} />
          <AttentionDetailRow details={contextDetails} />
        </div>
      </Link>
    </li>
  );
}

function AttentionFeedGroup({ type, items }: { type: AttentionType; items: LabAttentionQueueItem[] }) {
  const config = getAttentionTypeConfig(type);

  return (
    <section className="pb-space-3 last:pb-0">
      <div className={FEED_GROUPED.groupHeader}>
        <div className={FEED_GROUPED.groupDivider} />
        <span className={FEED_GROUPED.groupLabel}>
          {config.groupLabel}
          <span className={`ml-space-1.5 tabular-nums ${FG.captionMuted}`}>({items.length})</span>
        </span>
        <div className={FEED_GROUPED.groupDivider} />
      </div>
      <ul className="space-y-space-1">
        {items.map(item => (
          <AttentionFeedRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

function AttentionFeed({ items }: { items: LabAttentionQueueItem[] }) {
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
          {...DENSE_EMPTY_STATE_TEXT}
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
          <AttentionFeedGroup key={group.type} type={group.type} items={group.items} />
        ))}
      </div>
    </div>
  );
}

export interface LabAttentionPanelProps {
  items: LabAttentionQueueItem[];
  attentionTotal: number;
}

export const LabAttentionPanel: React.FC<LabAttentionPanelProps> = ({ items, attentionTotal }) => {
  const shownTests = items.reduce((sum, item) => sum + item.workItemCount, 0);
  const capped = attentionTotal > shownTests;

  return (
    <Panel
      preset="panel.pageEmbed.standard" title="Attention queue"
      meta={
        items.length > 0
          ? capped
            ? `Prioritized view · ${shownTests} of ${attentionTotal} tests`
            : `${items.length} accessions · ${attentionTotal} tests`
          : LAB_COPY.attention.panelMetaEmpty
      }
    >
      <AttentionFeed items={items} />
    </Panel>
  );
};
