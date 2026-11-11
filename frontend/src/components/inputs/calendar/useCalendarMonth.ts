/**
 * Month cursor + days/months/years view for calendar popovers.
 */

import { useState } from 'react';
import type { CalendarView } from './calendarTypes';

/**
 * Shared month cursor and days/months/years view for DateInput and DatePicker.
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
