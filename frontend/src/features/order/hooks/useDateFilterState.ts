/**
 * Custom hook for managing date filter state and logic
 * Extracted from DateFilter component for better maintainability
 */

import { useState } from 'react';
import {
  isSameDay,
  isWithinInterval,
  isBefore,
  isAfter,
  addYears,
  subYears,
  startOfDay,
  endOfYear,
} from 'date-fns';
import { DATE_RANGE_CONFIG } from '@/config';

export type CalendarView = 'days' | 'months' | 'years';

export interface UseDateFilterStateProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
}

export interface UseDateFilterStateReturn {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (date: Date) => boolean;
  handleDateClick: (date: Date) => void;
  isSelected: (date: Date) => boolean;
  isInRange: (date: Date) => boolean;
  handleClear: (e: React.MouseEvent) => void;
}

/**
 * Hook for managing date filter state and interactions
 */
export const useDateFilterState = ({
  value,
  onChange,
}: UseDateFilterStateProps): UseDateFilterStateReturn => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<CalendarView>('days');

  // Calculate date limits from config
  const today = new Date();
  const minDate = subYears(startOfDay(today), DATE_RANGE_CONFIG.maxYearsBack);
  const maxDate = addYears(endOfYear(today), DATE_RANGE_CONFIG.maxYearsForward);

  /**
   * Checks if a date is outside the allowed range
   */
  const isDateDisabled = (date: Date): boolean => {
    return isBefore(date, minDate) || isAfter(date, maxDate);
  };

  /**
   * Handles clicking on a date in the calendar
   */
  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!value) {
      onChange([date, date]);
    } else {
      const [start, end] = value;
      if (isSameDay(start, end)) {
        if (date < start) {
          onChange([date, start]);
        } else {
          onChange([start, date]);
        }
      } else {
        onChange([date, date]);
      }
    }
  };

  /**
   * Checks if a date is selected (start or end of range)
   */
  const isSelected = (date: Date): boolean => {
    if (!value) return false;
    const [start, end] = value;
    return isSameDay(date, start) || isSameDay(date, end);
  };

  /**
   * Checks if a date is within the selected range
   */
  const isInRange = (date: Date): boolean => {
    if (!value) return false;
    const [start, end] = value;
    return isWithinInterval(date, { start, end });
  };

  /**
   * Clears the current date selection
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return {
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    minDate,
    maxDate,
    isDateDisabled,
    handleDateClick,
    isSelected,
    isInRange,
    handleClear,
  };
};
