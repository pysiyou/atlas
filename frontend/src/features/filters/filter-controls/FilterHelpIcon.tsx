/**
 * FilterHelpIcon Component
 * Info icon that opens a popover with help text for filter controls.
 * Rendered as a sibling of the filter (not inside trigger) to avoid closing the filter popover.
 */

import React from 'react';
import { Popover } from '@/shared/ui/Popover';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { cn } from '@/utils';

export interface FilterHelpIconProps {
  /** Help text shown in the popover */
  helpText: string;
  /** Optional className for the trigger button */
  className?: string;
}

export const FilterHelpIcon: React.FC<FilterHelpIconProps> = ({ helpText, className }) => (
  <Popover
    placement="bottom-end"
    offsetValue={4}
    showBackdrop={false}
    trigger={({ isOpen }) => (
      <button
        type="button"
        className={cn(
          'flex items-center justify-center w-7 h-7 shrink-0 rounded-md transition-colors',
          'text-text-muted hover:text-brand hover:bg-brand-muted',
          'focus:outline-none focus:ring-2 focus:ring-brand/30',
          isOpen && 'text-brand bg-brand-muted',
          className
        )}
        aria-label="Filter help"
      >
        <Icon name={ICONS.actions.infoCircle} className="w-4 h-4" />
      </button>
    )}
    className="max-w-[260px] p-3"
  >
    {() => <p className="text-xs text-text-secondary">{helpText}</p>}
  </Popover>
);
