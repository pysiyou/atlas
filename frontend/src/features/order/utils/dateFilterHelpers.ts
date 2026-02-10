/**
 * Date Filter Helper Utilities
 * Functions for generating calendar dates, formatting, and date predicates.
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
  isBefore,
  isAfter,
  isSameDay,
  startOfDay,
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

/** Whether the date is outside the allowed min/max range (for disabling in calendar). */
export function isDateDisabled(date: Date, min: Date, max: Date): boolean {
  return isBefore(date, min) || isAfter(date, max);
}

/** Whether the date is the range start or end (for highlighting). */
export function isSelectedDate(
  date: Date,
  tempStart: Date | null,
  tempEnd: Date | null
): boolean {
  if (!tempStart) return false;
  if (tempEnd) {
    return isSameDay(date, tempStart) || isSameDay(date, tempEnd);
  }
  return isSameDay(date, tempStart);
}

/** Whether the date is strictly between start and end (for range highlight). */
export function isDateInRange(
  date: Date,
  tempStart: Date | null,
  tempEnd: Date | null
): boolean {
  if (!tempStart || !tempEnd) return false;
  const dateStart = startOfDay(date);
  return (
    (isAfter(dateStart, tempStart) || isSameDay(dateStart, tempStart)) &&
    (isBefore(dateStart, tempEnd) || isSameDay(dateStart, tempEnd)) &&
    !isSameDay(dateStart, tempStart) &&
    !isSameDay(dateStart, tempEnd)
  );
}
