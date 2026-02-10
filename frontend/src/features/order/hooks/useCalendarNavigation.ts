/**
 * useCalendarNavigation - Calendar month/view navigation for date pickers.
 * Encapsulates currentMonth, view (days/months/years), and navigation actions.
 */

import { useState, useCallback } from 'react';

export type CalendarView = 'days' | 'months' | 'years';

export interface UseCalendarNavigationReturn {
  currentMonth: Date;
  view: CalendarView;
  setCurrentMonth: (date: Date) => void;
  setView: (view: CalendarView) => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToToday: () => void;
  toggleView: () => void;
  selectMonth: (month: number) => void;
  selectYear: (year: number) => void;
}

export function useCalendarNavigation(initialMonth: Date): UseCalendarNavigationReturn {
  const [currentMonth, setCurrentMonth] = useState<Date>(initialMonth);
  const [view, setView] = useState<CalendarView>('days');

  const navigatePrevious = useCallback(() => {
    if (view === 'days') {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
    } else if (view === 'months') {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1)
      );
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() - 10, currentMonth.getMonth(), 1)
      );
    }
  }, [currentMonth, view]);

  const navigateNext = useCallback(() => {
    if (view === 'days') {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
    } else if (view === 'months') {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1)
      );
    } else {
      setCurrentMonth(
        new Date(currentMonth.getFullYear() + 10, currentMonth.getMonth(), 1)
      );
    }
  }, [currentMonth, view]);

  const navigateToToday = useCallback(() => {
    setCurrentMonth(new Date());
    setView('days');
  }, []);

  const toggleView = useCallback(() => {
    setView(prev =>
      prev === 'days' ? 'months' : prev === 'months' ? 'years' : 'days'
    );
  }, []);

  const selectMonth = useCallback((month: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), month, 1));
    setView('days');
  }, []);

  const selectYear = useCallback((year: number) => {
    setCurrentMonth(prev => new Date(year, prev.getMonth(), 1));
    setView('months');
  }, []);

  return {
    currentMonth,
    view,
    setCurrentMonth,
    setView,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    toggleView,
    selectMonth,
    selectYear,
  };
}
