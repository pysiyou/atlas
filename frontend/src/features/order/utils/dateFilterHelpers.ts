/**
 * Date Filter Helper Utilities
 * Functions for generating calendar dates and formatting
 */

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  eachYearOfInterval,
  addYears,
  subYears,
} from 'date-fns';

/**
 * Generates array of days for the current month view (including padding days)
 */
export const generateCalendarDays = (currentMonth: Date): Date[] => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  return eachDayOfInterval({
    start: startDate,
    end: endDate,
  });
};

/**
 * Generates array of months for the current year view
 */
export const generateCalendarMonths = (currentMonth: Date): Date[] => {
  const yearStart = startOfYear(currentMonth);
  const yearEnd = endOfYear(currentMonth);
  return eachMonthOfInterval({ start: yearStart, end: yearEnd });
};

/**
 * Generates array of years for the current decade view (12-year window)
 */
export const generateCalendarYears = (currentMonth: Date): Date[] => {
  const start = subYears(currentMonth, 6);
  const end = addYears(currentMonth, 5);
  return eachYearOfInterval({ start, end });
};

/**
 * Weekday labels for calendar header
 */
export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Month labels for month view
 */
export const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
