/**
 * Global event log unified search with anchored preview popover (order-upsert style).
 */
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon, SpinnerLoader } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { inputClearButton, inputInner, inputText, inputWrapper } from '@/components/inputs/inputStyles';
import { EVENT_LOG_COPY } from './types';
import { EVENT_LOG_FILTER_PLACEHOLDERS } from './EventLogFiltersInlineControls';
import { classifyEventLogSearchIntent } from './eventLogSearchIntent';
import { getEventLogSearchCriteria } from './eventLogSearchCriteria';
import { EventLogSearchPreviewPanel } from './EventLogSearchPreviewPanel';
import { useEventLogSearchPreview } from './useEventLogSearchPreview';

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
  const instantIntent = useMemo(() => classifyEventLogSearchIntent(draft), [draft]);
  const criteriaCount = useMemo(() => getEventLogSearchCriteria(instantIntent).length, [instantIntent]);
  const { preview, isFetching } = useEventLogSearchPreview(draft);

  const isDebouncing = draft !== value;
  const showPopover = isPopoverOpen && hasDraft;

  const suggestionCount =
    (preview?.patients.length ?? 0) + (preview?.users.length ?? 0);

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

  const handleSelectPatient = useCallback(
    (displayId: string) => {
      setDraft(displayId);
      onChange(displayId);
      setIsPopoverOpen(false);
    },
    [onChange, setDraft]
  );

  const handleSelectUser = useCallback(
    (username: string) => {
      setDraft(username);
      onChange(username);
      setIsPopoverOpen(false);
    },
    [onChange, setDraft]
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={cn(inputWrapper, 'group')}>
        <Icon
          name={ICONS.actions.search}
          className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-brand transition-colors"
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
              <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-text-tertiary" />
            </button>
          )}
        </div>
      </div>

      {showPopover ? (
        <div id={listId} role="listbox" aria-label={EVENT_LOG_COPY.searchPreviewTitle}>
          <EventLogSearchPreviewPanel
            instantIntent={instantIntent}
            preview={preview}
            isFetching={isFetching}
            isEmpty={criteriaCount === 0 && suggestionCount === 0 && !isFetching}
            onSelectPatient={handleSelectPatient}
            onSelectUser={handleSelectUser}
          />
        </div>
      ) : null}
    </div>
  );
};
