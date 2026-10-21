/**
 * Global event log search — intent, preview, popover, field.
 */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, Icon } from '@/components/primitives';
import { SpinnerLoader } from '@/components/feedback';
import { SearchResultsPopoverShell } from '@/components/overlays/SearchResultsPopoverShell';
import { queryKeys } from '@/lib/query';
import { ICONS } from '@/config/icons';
import { cn } from '@/utils';
import { text, FORM_FIELD_LABEL, FG, CONTROL, inputClearButton, inputInner, inputText, inputWrapper } from '@/theme/recipes';
import { EVENT_LOG_FILTER_PLACEHOLDERS } from './eventLogFilterConfig';
import { fetchAuditSearchPreview, type AuditSearchPreviewResponse } from './api';
import { EVENT_LOG_COPY } from './types';
import {
  buildEventLogSearchMatchGroups,
  countEventLogSearchMatchItems,
  type EventLogSearchMatchGroup,
} from './eventLogSearchIntent';

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function useEventLogSearchPreview(draftQuery: string) {
  const trimmed = draftQuery.trim();
  const debouncedQ = useDebouncedValue(trimmed, 300);
  const query = useQuery({
    queryKey: queryKeys.auditEvents.searchPreview(debouncedQ),
    queryFn: () => fetchAuditSearchPreview(debouncedQ),
    enabled: debouncedQ.length > 0,
    staleTime: 30_000,
  });

  /** Only show server preview when it matches what the user sees (debounce caught up). */
  const previewInSync = debouncedQ === trimmed && debouncedQ.length > 0;

  const preview = useMemo(() => {
    if (!previewInSync) return undefined;
    return query.data;
  }, [previewInSync, query.data]);

  const isRefreshingPreview = previewInSync && query.isFetching;

  return {
    preview,
    isFetching: isRefreshingPreview,
    isError: query.isError,
    debouncedQ,
    previewInSync,
  };
}

/**
 * Categorized match list for global event log search (order-upsert popover chrome).
 */
export interface EventLogSearchPopoverProps {
  groups: EventLogSearchMatchGroup[];
  preview: AuditSearchPreviewResponse | undefined;
  previewInSync: boolean;
  isFetching: boolean;
  onSelectMatch: (applyValue: string) => void;
}

const ROW_CLASS = cn(
  'w-full text-left px-space-3 py-space-2',
  'transition-colors cursor-pointer flex items-center gap-space-2',
  'hover:bg-surface-page bg-surface',
  CONTROL.focusVisibleTight
);

const EventLogSearchPopover: React.FC<EventLogSearchPopoverProps> = ({
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
    <SearchResultsPopoverShell
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
            text({ role: 'caption' }),
            FG.muted
          )}
        >
          <span>
            <span className={`font-medium ${FG.body} tabular-nums`}>{preview.eventCount}</span>
            {' '}
            {EVENT_LOG_COPY.searchPreviewEventCount}
          </span>
          {isFetching ? <SpinnerLoader size="xs" /> : null}
        </div>
      ) : isFetching ? (
        <div className={`px-space-4 py-space-2 border-b border-border-default/70 ${text({ role: 'caption' })} ${FG.muted} flex items-center gap-space-2`}>
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
                    <Icon name={item.icon} className={`w-4 h-4 shrink-0 ${FG.muted}`} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        `${text({ role: 'body' })} font-normal truncate`,
                        item.avatarName && 'capitalize'
                      )}
                    >
                      {item.primary}
                    </p>
                    {item.secondary ? (
                      <p className={`${text({ role: 'caption' })} truncate ${FG.muted}`}>{item.secondary}</p>
                    ) : null}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </SearchResultsPopoverShell>
  );
};

/**
 * Global event log unified search with categorized match popover.
 */
export interface EventLogSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

function useDebouncedCallback(
  value: string,
  onChange: (value: string) => void,
  delayMs: number
): [string, (next: string) => void] {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => onChange(draft), delayMs);
    return () => window.clearTimeout(timer);
  }, [draft, value, onChange, delayMs]);

  return [draft, setDraft];
}

export const EventLogSearchField: React.FC<EventLogSearchFieldProps> = ({
  value,
  onChange,
  debounceMs = 300,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const listId = useId();
  const [draft, setDraft] = useDebouncedCallback(value, onChange, debounceMs);

  const hasDraft = draft.trim().length > 0;
  const { preview, isFetching, previewInSync } = useEventLogSearchPreview(draft);
  const groups = useMemo(
    () => buildEventLogSearchMatchGroups(draft, preview, previewInSync),
    [draft, preview, previewInSync]
  );

  const isDebouncing = draft !== value;
  const showPopover = isPopoverOpen && hasDraft;

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      const container = containerRef.current;
      if (!container || !target) return;
      if (!container.contains(target)) setIsPopoverOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPopoverOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleClear = useCallback(() => {
    setDraft('');
    onChange('');
    setIsPopoverOpen(false);
  }, [onChange, setDraft]);

  const handleSelectMatch = useCallback(
    (applyValue: string) => {
      const next = applyValue.trim();
      if (!next) return;
      setDraft(next);
      onChange(next);
      setIsPopoverOpen(false);
    },
    [onChange, setDraft]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={cn(inputWrapper, 'group')}>
        <Icon
          name={ICONS.actions.search}
          className={`w-3.5 h-3.5 shrink-0 ${FG.muted} group-hover:text-brand transition-colors`}
        />
        <input
          type="search"
          role="combobox"
          aria-expanded={showPopover}
          aria-controls={showPopover ? listId : undefined}
          placeholder={EVENT_LOG_FILTER_PLACEHOLDERS.search}
          value={draft}
          onChange={e => {
            const next = e.target.value;
            setDraft(next);
            setIsPopoverOpen(next.trim().length > 0);
          }}
          onFocus={() => {
            if (draft.trim().length > 0) setIsPopoverOpen(true);
          }}
          className={cn(inputInner, inputText)}
          autoComplete="off"
        />
        <div className="flex items-center gap-space-1 shrink-0">
          {isDebouncing && <SpinnerLoader size="xs" />}
          {draft && !isDebouncing && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(inputClearButton, 'hover:bg-surface-page')}
              aria-label="Clear search"
            >
              <Icon name={ICONS.actions.closeCircle} className={`w-4 h-4 ${FG.captionMuted}`} />
            </button>
          )}
        </div>
      </div>

      {showPopover ? (
        <div id={listId} role="listbox" aria-label={EVENT_LOG_COPY.searchPreviewTitle}>
          <EventLogSearchPopover
            groups={groups}
            preview={preview}
            previewInSync={previewInSync}
            isFetching={isFetching}
            onSelectMatch={handleSelectMatch}
          />
        </div>
      ) : null}
    </div>
  );
};
