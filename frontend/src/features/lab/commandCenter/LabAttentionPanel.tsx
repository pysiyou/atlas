/**
 * Needs-attention panel — grouped feed of prioritized lab exceptions.
 */

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, EMPTY_COPY, DASHBOARD_EMPTY_STATE_TEXT, Badge, EntityId, Panel } from '@/components';
import { LabPriorityBadge } from '../components/LabDomainBadges';
import { resolveStatusBadgeColor } from '@/utils/statusBadge';
import { cn, displayId } from '@/utils';
import { getLabQueueUrl } from '@/features/lab';
import { CONTROL, RADIUS, TABLE_TYPE } from '@/components/theme/recipes';
import { LAB_COPY } from '../constants/labConstants';
import {
  ATTENTION_TYPE_ORDER,
  getAttentionTone,
  getAttentionTypeConfig,
  type AttentionType,
  type LabAttentionQueueItem,
} from './commandCenterModel';
import { formatLabAttentionQueueItem, type AttentionDetail } from './commandCenterAttentionFormat';
import { COMMAND_CENTER_ATTENTION_ACCENT, COMMAND_CENTER_FEED_STYLES } from './commandCenterStyles';

const PRIMARY_DETAIL_CLASS = `${TABLE_TYPE.cell} truncate font-normal`;
const META_DETAIL_CLASS = `${TABLE_TYPE.meta} truncate font-normal`;

const IDENTITY_DETAIL_TYPES = new Set<AttentionDetail['type']>(['patient', 'link', 'testId']);

function isIdentityDetail(detail: AttentionDetail): boolean {
  return IDENTITY_DETAIL_TYPES.has(detail.type);
}

function FeedDetail({ detail }: { detail: AttentionDetail }) {
  switch (detail.type) {
    case 'patient':
      return <span className={PRIMARY_DETAIL_CLASS}>{detail.value}</span>;
    case 'link':
    case 'testId':
      return (
        <EntityId variant="inline" className={PRIMARY_DETAIL_CLASS}>
          {detail.value}
        </EntityId>
      );
    case 'queueStage':
      return <span className={META_DETAIL_CLASS}>{detail.stageLabel}</span>;
    case 'queueCount':
      return (
        <span className={`${META_DETAIL_CLASS} tabular-nums`}>
          {detail.count} {detail.unit}
        </span>
      );
    case 'priority':
      return <LabPriorityBadge priority={detail.value} size="xs" />;
    case 'wait':
      return <span className={`${META_DETAIL_CLASS} tabular-nums`}>{detail.value}</span>;
    default:
      return <span className={META_DETAIL_CLASS}>{detail.value}</span>;
  }
}

function AttentionDetailRow({ details }: { details: AttentionDetail[] }) {
  if (details.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-space-2 gap-y-space-1">
      {details.map((detail, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 ? (
            <span className="h-3.5 w-px shrink-0 self-center bg-border-default" aria-hidden />
          ) : null}
          <div className="min-w-0 max-w-full shrink">
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
          className={cn(`w-0.5 shrink-0 self-stretch ${RADIUS.pill}`, COMMAND_CENTER_ATTENTION_ACCENT[tone])}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-space-1.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-space-2 gap-y-space-1">
            <Badge
              variant={resolveStatusBadgeColor(typeConfig.badgeVariant)}
              label={typeConfig.pillLabel}
              size="xs"
            />
            <span className={COMMAND_CENTER_FEED_STYLES.eventHeadline}>{formatted.action}</span>
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
      <div className={COMMAND_CENTER_FEED_STYLES.groupHeader}>
        <div className={COMMAND_CENTER_FEED_STYLES.groupDivider} />
        <span className={COMMAND_CENTER_FEED_STYLES.groupLabel}>
          {config.groupLabel}
          <span className="ml-space-1.5 tabular-nums text-text-tertiary">({items.length})</span>
        </span>
        <div className={COMMAND_CENTER_FEED_STYLES.groupDivider} />
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
      title={LAB_COPY.attention.panelTitle}
      meta={
        items.length > 0
          ? capped
            ? `Prioritized view · ${shownTests} of ${attentionTotal} tests`
            : `${items.length} accessions · ${attentionTotal} tests`
          : LAB_COPY.attention.panelMetaEmpty
      }
      padding="none"
    >
      <AttentionFeed items={items} />
    </Panel>
  );
};
