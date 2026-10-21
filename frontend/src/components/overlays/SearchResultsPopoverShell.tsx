import React from 'react';
import { EmptyState, PANEL_EMPTY_STATE } from '@/components/display';
import { FG, FORM_FIELD_LABEL, text } from '@/theme/recipes';
import { OVERLAY, RADIUS } from '@/theme/recipes';
import { DEFAULT_EMPTY_DESCRIPTION_SEARCH } from '@/utils/constants';

const POPOVER_SHELL_CLASS = [
  `absolute left-0 right-0 top-full z-50 mt-space-1 ${FG.popoverAnchor}`,
  'border border-border-default/80',
  RADIUS.menu,
  'overflow-hidden',
  'bg-surface',
  OVERLAY.anchoredRaised,
].join(' ');

export interface SearchResultsPopoverShellProps {
  title: string;
  resultCount: number;
  emptyMessage: string;
  emptyDescription?: string;
  isEmpty: boolean;
  children: React.ReactNode;
}

/** Anchored results panel for combobox-style search fields. */
export const SearchResultsPopoverShell: React.FC<SearchResultsPopoverShellProps> = ({
  title,
  resultCount,
  emptyMessage,
  emptyDescription = DEFAULT_EMPTY_DESCRIPTION_SEARCH,
  isEmpty,
  children,
}) => (
  <div className={POPOVER_SHELL_CLASS}>
    <div className="px-space-4 py-space-2-5 bg-surface-page/70 border-b border-border-default/70 flex items-center justify-between">
      <div className={FORM_FIELD_LABEL}>{title}</div>
      <div className={text({ role: 'body', intent: 'muted' })}>{resultCount} result(s)</div>
    </div>

    {isEmpty ? (
      <EmptyState
        {...PANEL_EMPTY_STATE}
        fill={false}
        title={emptyMessage}
        description={emptyDescription}
      />
    ) : (
      <div className="max-h-[280px] overflow-y-auto divide-y divide-border-default/70">
        {children}
      </div>
    )}
  </div>
);
