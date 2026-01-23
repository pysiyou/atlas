/**
 * DateFilterCalendar Component
 * Renders the calendar grid for days, months, or years view
 */

import React from 'react';
import {
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  endOfMonth,
  setYear,
} from 'date-fns';
import { cn } from '@/utils';
import type { CalendarView } from '../hooks/useDateFilterState';
import {
  generateCalendarDays,
  generateCalendarMonths,
  generateCalendarYears,
  WEEKDAY_LABELS,
} from '../utils/dateFilterHelpers';

export interface DateFilterCalendarProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  value: [Date, Date] | null;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (date: Date) => boolean;
  handleDateClick: (date: Date) => void;
  isSelected: (date: Date) => boolean;
  isInRange: (date: Date) => boolean;
}

/**
 * Renders the calendar grid based on current view (days/months/years)
 */
export const DateFilterCalendar: React.FC<DateFilterCalendarProps> = ({
  currentMonth,
  setCurrentMonth,
  view,
  setView,
  value,
  minDate,
  maxDate,
  isDateDisabled,
  handleDateClick,
  isSelected,
  isInRange,
}) => {
  if (view === 'days') {
    return (
      <>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-xs text-gray-400 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays(currentMonth).map(day => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const selected = isSelected(day);
            const inRange = isInRange(day);
            const isToday = isSameDay(day, new Date());
            const disabled = isDateDisabled(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={cn(
                  'h-8 w-8 text-xs rounded-full flex items-center justify-center transition-colors relative cursor-pointer',
                  disabled && 'opacity-30 cursor-not-allowed',
                  !isCurrentMonth && 'text-gray-300',
                  isCurrentMonth &&
                    !selected &&
                    !inRange &&
                    !disabled &&
                    'text-gray-700 hover:bg-gray-100',
                  isToday && !selected && !inRange && !disabled && 'font-bold text-sky-600 bg-sky-50',
                  inRange && !selected && 'bg-sky-50 text-sky-700 rounded-none',
                  value &&
                    isSameDay(day, value[0]) &&
                    !isSameDay(value[0], value[1]) &&
                    'rounded-l-full rounded-r-none',
                  value &&
                    isSameDay(day, value[1]) &&
                    !isSameDay(value[0], value[1]) &&
                    'rounded-r-full rounded-l-none',
                  selected && 'bg-sky-500 text-white hover:bg-sky-600 z-10'
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  if (view === 'months') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {generateCalendarMonths(currentMonth).map(month => {
          const endOfM = endOfMonth(month);
          const disabled = isBefore(endOfM, minDate) || isAfter(month, maxDate);
          return (
            <button
              key={month.toISOString()}
              onClick={() => {
                if (disabled) return;
                setCurrentMonth(month);
                setView('days');
              }}
              disabled={disabled}
              className={cn(
                'h-10 text-sm rounded flex items-center justify-center transition-colors cursor-pointer',
                disabled && 'opacity-30 cursor-not-allowed',
                !disabled &&
                  isSameMonth(month, new Date()) &&
                  'text-sky-600 font-bold bg-sky-50',
                !disabled && isSameMonth(month, currentMonth)
                  ? 'bg-sky-100 text-sky-700'
                  : 'hover:bg-gray-100 text-gray-700',
                !disabled && 'hover:bg-gray-100'
              )}
            >
              {format(month, 'MMM')}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {generateCalendarYears(currentMonth).map(year => {
        const y = year.getFullYear();
        const disabled = y < minDate.getFullYear() || y > maxDate.getFullYear();
        return (
          <button
            key={year.toISOString()}
            onClick={() => {
              if (disabled) return;
              setCurrentMonth(setYear(currentMonth, year.getFullYear()));
              setView('months');
            }}
            disabled={disabled}
            className={cn(
              'h-10 text-sm rounded flex items-center justify-center transition-colors cursor-pointer',
              disabled && 'opacity-30 cursor-not-allowed',
              !disabled &&
                year.getFullYear() === new Date().getFullYear() &&
                'text-sky-600 font-bold bg-sky-50',
              !disabled && year.getFullYear() === currentMonth.getFullYear()
                ? 'bg-sky-100 text-sky-700'
                : 'hover:bg-gray-100 text-gray-700',
              !disabled && 'hover:bg-gray-100'
            )}
          >
            {format(year, 'yyyy')}
          </button>
        );
      })}
    </div>
  );
};
