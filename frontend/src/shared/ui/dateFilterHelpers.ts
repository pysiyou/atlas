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

export const generateCalendarDays = (currentMonth: Date): Date[] => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const generateCalendarMonths = (currentMonth: Date): Date[] => {
  const yearStart = startOfYear(currentMonth);
  const yearEnd = endOfYear(currentMonth);
  return eachMonthOfInterval({ start: yearStart, end: yearEnd });
};

export const generateCalendarYears = (currentMonth: Date): Date[] => {
  const start = subYears(currentMonth, 6);
  const end = addYears(currentMonth, 5);
  return eachYearOfInterval({ start, end });
};

export const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function isDateDisabled(date: Date, min: Date, max: Date): boolean {
  return isBefore(date, min) || isAfter(date, max);
}

export function isSelectedDate(
  date: Date,
  tempStart: Date | null,
  tempEnd: Date | null
): boolean {
  if (!tempStart) return false;
  if (tempEnd) return isSameDay(date, tempStart) || isSameDay(date, tempEnd);
  return isSameDay(date, tempStart);
}

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
