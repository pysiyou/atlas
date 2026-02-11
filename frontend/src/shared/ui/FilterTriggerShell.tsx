/**
 * FilterTriggerShell - Shared trigger layout for filter dropdowns (Popover-based).
 * Single source of truth for: inputTrigger, left icon, content area, clear button + chevron.
 * Used by DateFilter, AgeFilter, PriceRangeControl, SingleSelectControl, MultiSelectFilter.
 */

import React from 'react';
import { Icon } from '@/shared/ui/Icon';
import { inputTrigger, inputTriggerOpen, filterTriggerText } from './inputStyles';
import { cn } from '@/utils';
import { ICONS } from '@/utils';

export interface FilterTriggerShellProps {
  /** Whether the popover is open (for border/chevron state) */
  isOpen: boolean;
  /** Left-side icon node (e.g. <Icon name={...} />). Optional; when absent a spacer preserves layout. */
  leftIcon?: React.ReactNode;
  /** Middle content (trigger label / value summary) */
  children: React.ReactNode;
  /** Whether to show the clear button (reserves space when false) */
  showClear: boolean;
  /** Clear button click handler; call e.stopPropagation() in consumer if needed */
  onClear: (e: React.MouseEvent) => void;
  /** Optional: called on clear button mousedown (e.g. e.stopPropagation() to prevent popover opening) */
  onClearMouseDown?: (e: React.MouseEvent) => void;
  /** Extra class names for the root trigger div */
  className?: string;
}

export const FilterTriggerShell: React.FC<FilterTriggerShellProps> = ({
  isOpen,
  leftIcon,
  children,
  showClear,
  onClear,
  onClearMouseDown,
  className,
}) => (
  <div
    className={cn(inputTrigger, 'justify-between w-full', isOpen && inputTriggerOpen, className)}
  >
    {leftIcon ?? <div className="w-4 h-4 shrink-0" aria-hidden />}
    <div className={cn('flex-1 min-w-0 truncate', filterTriggerText)}>{children}</div>
    <div className="flex items-center gap-1 shrink-0">
      {showClear ? (
        <button
          type="button"
          onClick={onClear}
          onMouseDown={onClearMouseDown}
          className="p-0.5 hover:bg-panel-hover rounded transition-colors"
          aria-label="Clear"
        >
          <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-fg-faint hover:text-fg-subtle" />
        </button>
      ) : (
        <div className="w-5 h-5" aria-hidden />
      )}
      <Icon
        name={ICONS.actions.chevronDown}
        className={cn('w-4 h-4 text-fg-faint transition-transform', isOpen && 'rotate-180')}
      />
    </div>
  </div>
);
