/**
 * Custom hook for date filter navigation logic
 * Handles moving between months, years, and calendar views
 */

import {
  addMonths,
  subMonths,
  addYears,
  subYears,
  isBefore,
  isAfter,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import type { CalendarView } from './useDateFilterState';

export interface UseDateFilterNavigationProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  minDate: Date;
  maxDate: Date;
}

export interface UseDateFilterNavigationReturn {
  handlePrevClick: () => void;
  handleNextClick: () => void;
  handleTitleClick: () => void;
  isPrevDisabled: () => boolean;
  isNextDisabled: () => boolean;
}

/**
 * Hook for managing calendar navigation
 */
export const useDateFilterNavigation = ({
  currentMonth,
  setCurrentMonth,
  view,
  setView,
  minDate,
  maxDate,
}: UseDateFilterNavigationProps): UseDateFilterNavigationReturn => {
  /**
   * Navigates to the previous month/year/decade based on current view
   */
  const handlePrevClick = () => {
    if (view === 'days') {
      const prevMonth = subMonths(currentMonth, 1);
      if (isBefore(endOfMonth(prevMonth), minDate)) return;
      setCurrentMonth(prevMonth);
    }
    if (view === 'months') {
      const prevYear = subYears(currentMonth, 1);
      if (prevYear.getFullYear() < minDate.getFullYear()) return;
      setCurrentMonth(prevYear);
    }
    if (view === 'years') {
      const prevPageStart = subYears(currentMonth, 12);
      if (prevPageStart.getFullYear() + 5 < minDate.getFullYear()) return;
      setCurrentMonth(subYears(currentMonth, 12));
    }
  };

  /**
   * Navigates to the next month/year/decade based on current view
   */
  const handleNextClick = () => {
    if (view === 'days') {
      const nextMonth = addMonths(currentMonth, 1);
      if (isAfter(startOfMonth(nextMonth), maxDate)) return;
      setCurrentMonth(nextMonth);
    }
    if (view === 'months') {
      const nextYear = addYears(currentMonth, 1);
      if (nextYear.getFullYear() > maxDate.getFullYear()) return;
      setCurrentMonth(nextYear);
    }
    if (view === 'years') {
      const nextPageEnd = addYears(currentMonth, 12);
      if (nextPageEnd.getFullYear() - 5 > maxDate.getFullYear()) return;
      setCurrentMonth(addYears(currentMonth, 12));
    }
  };

  /**
   * Handles clicking on the calendar title to change view
   */
  const handleTitleClick = () => {
    if (view === 'days') setView('months');
    if (view === 'months') setView('years');
  };

  /**
   * Determines if previous navigation should be disabled
   */
  const isPrevDisabled = (): boolean => {
    if (view === 'days') {
      return isBefore(endOfMonth(subMonths(currentMonth, 1)), minDate);
    }
    if (view === 'months') {
      return currentMonth.getFullYear() - 1 < minDate.getFullYear();
    }
    if (view === 'years') {
      return currentMonth.getFullYear() - 12 < minDate.getFullYear() - 10;
    }
    return false;
  };

  /**
   * Determines if next navigation should be disabled
   */
  const isNextDisabled = (): boolean => {
    if (view === 'days') {
      return isAfter(startOfMonth(addMonths(currentMonth, 1)), maxDate);
    }
    if (view === 'months') {
      return currentMonth.getFullYear() + 1 > maxDate.getFullYear();
    }
    if (view === 'years') {
      return currentMonth.getFullYear() + 12 > maxDate.getFullYear() + 10;
    }
    return false;
  };

  return {
    handlePrevClick,
    handleNextClick,
    handleTitleClick,
    isPrevDisabled,
    isNextDisabled,
  };
};
