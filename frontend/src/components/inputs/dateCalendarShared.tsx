/**
 * Shared calendar view, month cursor, and header for DateInput and DatePicker.
 */
/* eslint-disable react-refresh/only-export-components -- hook + header share one module */

import { useState } from 'react';
import { format } from 'date-fns';
import { Icon } from '@/components/primitives';
import { IconKeys } from '@/config/icons';
import { text, RADIUS } from '@/theme/recipes';
import { generateCalendarYears } from '@/utils/date';

export type CalendarView = 'days' | 'months' | 'years';

/**
 * Month cursor and days/months/years view for calendar popovers.
 *
 * @param initialMonth - Month shown when the popover opens
 */
export function useCalendarMonth(initialMonth: Date) {
  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);
  const [view, setView] = useState<CalendarView>('days');

  const navigatePrevious = () => {
    if (view === 'days') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    } else if (view === 'months') {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() - 10, currentMonth.getMonth(), 1));
    }
  };

  const navigateNext = () => {
    if (view === 'days') {
      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    } else if (view === 'months') {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    } else {
      setCurrentMonth(new Date(currentMonth.getFullYear() + 10, currentMonth.getMonth(), 1));
    }
  };

  return {
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    navigatePrevious,
    navigateNext,
  };
}

/**
 * Prev / title / next chrome shared by DateInput and DatePicker calendars.
 */
export function CalendarHeader({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
  isPrevDisabled = false,
  isNextDisabled = false,
}: {
  currentMonth: Date;
  view: CalendarView;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
  isPrevDisabled?: boolean;
  isNextDisabled?: boolean;
}) {
  const title =
    view === 'days'
      ? format(currentMonth, 'MMMM yyyy')
      : view === 'months'
        ? format(currentMonth, 'yyyy')
        : (() => {
            const years = generateCalendarYears(currentMonth);
            return `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
          })();

  return (
    <div className="flex items-center justify-between mb-space-3">
      <button
        type="button"
        onClick={onPrevClick}
        disabled={isPrevDisabled}
        className={`p-space-1 hover:bg-surface-hover ${RADIUS.field} text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center`}
      >
        <Icon iconKey={IconKeys.actions.chevronLeft} className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onTitleClick}
        className={`${text({ role: 'amount' })} text-text-secondary hover:bg-surface-page px-space-2 py-space-1 ${RADIUS.field} transition-colors cursor-pointer`}
      >
        {title}
      </button>
      <button
        type="button"
        onClick={onNextClick}
        disabled={isNextDisabled}
        className={`p-space-1 hover:bg-surface-hover ${RADIUS.field} text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center`}
      >
        <Icon iconKey={IconKeys.actions.chevronRight} className="w-4 h-4" />
      </button>
    </div>
  );
}
