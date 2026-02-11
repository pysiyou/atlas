/**
 * DateFilterHeader - Calendar header with navigation and title.
 */

import React from 'react';
import { format } from 'date-fns';
import { Icon } from '@/shared/ui';
import { cn } from '@/utils';
import { ICONS } from '@/utils';
import { generateCalendarYears } from './dateFilterHelpers';
import type { CalendarView } from './useCalendarNavigation';

export interface DateFilterHeaderProps {
  currentMonth: Date;
  view: CalendarView;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

export const DateFilterHeader: React.FC<DateFilterHeaderProps> = ({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
  isPrevDisabled,
  isNextDisabled,
}) => {
  const getTitle = (): string => {
    if (view === 'days') return format(currentMonth, 'MMMM yyyy');
    if (view === 'months') return format(currentMonth, 'yyyy');
    const years = generateCalendarYears(currentMonth);
    return `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
  };

  return (
    <div className="flex items-center justify-between mb-3">
      <button
        onClick={onPrevClick}
        disabled={isPrevDisabled}
        className="p-1 hover:bg-neutral-100 rounded text-fg-subtle disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
      >
        <Icon name={ICONS.actions.chevronLeft} className="w-4 h-4" />
      </button>
      <button
        onClick={onTitleClick}
        className={cn(
          'text-sm font-normal text-fg-muted hover:bg-canvas px-2 py-1 rounded transition-colors cursor-pointer',
          view === 'years' && 'pointer-events-none hover:bg-transparent cursor-default'
        )}
      >
        {getTitle()}
      </button>
      <button
        onClick={onNextClick}
        disabled={isNextDisabled}
        className="p-1 hover:bg-neutral-100 rounded text-fg-subtle disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
      >
        <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
      </button>
    </div>
  );
};
