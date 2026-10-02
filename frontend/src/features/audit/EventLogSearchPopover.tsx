/**
 * Categorized match list for global event log search (order-upsert popover chrome).
 */
import React from 'react';
import { Avatar, Icon, SpinnerLoader } from '@/components';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';
import { OrderSelectPopoverShell } from '@/features/orders/components/OrderSelectPopoverShell';
import { CONTROL, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';
import type { AuditSearchPreviewResponse } from './api';
import {
  countEventLogSearchMatchItems,
  type EventLogSearchMatchGroup,
} from './eventLogSearchMatchGroups';
import { EVENT_LOG_COPY } from './types';

export interface EventLogSearchPopoverProps {
  groups: EventLogSearchMatchGroup[];
  preview: AuditSearchPreviewResponse | undefined;
  previewInSync: boolean;
  isFetching: boolean;
  onSelectMatch: (applyValue: string) => void;
}

const ROW_CLASS = cn(
  'w-full text-left px-space-3 py-space-2',
  'transition-colors flex items-center gap-space-2',
  'hover:bg-surface-page bg-surface',
  CONTROL.focusVisibleTight
);

export const EventLogSearchPopover: React.FC<EventLogSearchPopoverProps> = ({
  groups,
  preview,
  previewInSync,
  isFetching,
  onSelectMatch,
}) => {
  const itemCount = countEventLogSearchMatchItems(groups);
  const isEmpty = itemCount === 0 && !isFetching;
  const headerCount =
    previewInSync && preview?.eventCount != null ? preview.eventCount : itemCount;

  const emptyDescription =
    isFetching
      ? EVENT_LOG_COPY.searchPreviewEventCountLoading
      : EVENT_LOG_COPY.searchPreviewNoSuggestions;

  return (
    <OrderSelectPopoverShell
      title={EVENT_LOG_COPY.searchPreviewTitle}
      resultCount={headerCount}
      emptyMessage={EVENT_LOG_COPY.searchPreviewNoSuggestions}
      emptyDescription={emptyDescription}
      isEmpty={isEmpty}
    >
      {previewInSync && preview?.eventCount != null ? (
        <div
          className={cn(
            'px-space-4 py-space-2 border-b border-border-default/70 flex items-center justify-between gap-space-2',
            TYPE.caption,
            'text-text-muted'
          )}
        >
          <span>
            <span className="font-medium text-text-primary tabular-nums">{preview.eventCount}</span>
            {' '}
            {EVENT_LOG_COPY.searchPreviewEventCount}
          </span>
          {isFetching ? <SpinnerLoader size="xs" /> : null}
        </div>
      ) : isFetching ? (
        <div className={`px-space-4 py-space-2 border-b border-border-default/70 ${TYPE.caption} text-text-muted flex items-center gap-space-2`}>
          <SpinnerLoader size="xs" />
          {EVENT_LOG_COPY.searchPreviewEventCountLoading}
        </div>
      ) : null}

      {groups.map(group => (
        <div key={group.id} className="border-b border-border-default/70 last:border-b-0">
          <div className={`px-space-4 pt-space-2-5 pb-space-1 ${FORM_FIELD_LABEL}`}>{group.label}</div>
          <ul>
            {group.items.map(item => (
              <li key={item.key}>
                <button
                  type="button"
                  role="option"
                  className={ROW_CLASS}
                  onClick={() => onSelectMatch(item.applyValue)}
                >
                  {item.avatarName ? (
                    <Avatar primaryText={item.avatarName} size="xs" avatarOnly className="shrink-0" />
                  ) : item.icon ? (
                    <Icon name={item.icon} className="w-4 h-4 shrink-0 text-text-muted" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        `${TYPE.value} font-normal truncate`,
                        item.avatarName && 'capitalize'
                      )}
                    >
                      {item.primary}
                    </p>
                    {item.secondary ? (
                      <p className={`${TYPE.caption} truncate text-text-muted`}>{item.secondary}</p>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </OrderSelectPopoverShell>
  );
};
