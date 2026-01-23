/**
 * DateFilterHeader Component
 * Renders the calendar header with navigation buttons and title
 */

import React from 'react';
import { format } from 'date-fns';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';
import type { CalendarView } from '../hooks/useDateFilterState';
import { generateCalendarYears } from '../utils/dateFilterHelpers';

export interface DateFilterHeaderProps {
  currentMonth: Date;
  view: CalendarView;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

/**
 * Renders the header with prev/next buttons and clickable title
 */
export const DateFilterHeader: React.FC<DateFilterHeaderProps> = ({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
  isPrevDisabled,
  isNextDisabled,
}) => {
  /**
   * Get formatted title based on current view
   */
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
        className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
      >
        <Icon name="chevron-left" className="w-4 h-4" />
      </button>

      <button
        onClick={onTitleClick}
        className={cn(
          'text-sm font-semibold text-gray-700 hover:bg-gray-50 px-2 py-1 rounded transition-colors cursor-pointer',
          view === 'years' && 'pointer-events-none hover:bg-transparent cursor-default'
        )}
      >
        {getTitle()}
      </button>

      <button
        onClick={onNextClick}
        disabled={isNextDisabled}
        className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
      >
        <Icon name="chevron-right" className="w-4 h-4" />
      </button>
    </div>
  );
};
