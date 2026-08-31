/**
 * Calendar grid views for DateInput (days, months, years).
 */

import React from 'react';
import { format, isSameMonth, isSameDay, endOfMonth, setYear, isBefore, isAfter } from 'date-fns';
import { cn } from '@/utils';
import {
  generateCalendarDays,
  generateCalendarMonths,
  generateCalendarYears,
  WEEKDAY_LABELS,
} from '@/utils/date';

export type DateInputCalendarView = 'days' | 'months' | 'years';

export interface DateInputCalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  view: DateInputCalendarView;
  setView: (view: DateInputCalendarView) => void;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (date: Date) => boolean;
  handleDateClick: (date: Date) => void;
  isSelected: (date: Date) => boolean;
}

export const DateInputCalendarGrid: React.FC<DateInputCalendarGridProps> = ({
  currentMonth,
  setCurrentMonth,
  view,
  setView,
  minDate,
  maxDate,
  isDateDisabled,
  handleDateClick,
  isSelected,
}) => {
  if (view === 'days') {
    return (
      <>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-xs text-text-disabled py-1">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays(currentMonth).map(day => {
            const currentMonthMatch = isSameMonth(day, currentMonth);
            const selected = isSelected(day);
            const isToday = isSameDay(day, new Date());
            const disabled = isDateDisabled(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={cn(
                  'h-8 w-8 text-xs rounded-full flex items-center justify-center transition-colors cursor-pointer',
                  disabled && 'opacity-30 cursor-not-allowed',
                  !currentMonthMatch && 'text-text-disabled',
                  currentMonthMatch && !selected && !disabled && 'text-text-secondary hover:bg-neutral-100',
                  isToday && !selected && !disabled && 'font-normal text-brand bg-brand-muted',
                  selected && 'bg-brand text-on-brand hover:bg-brand-hover z-10'
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
              type="button"
              onClick={() => { if (!disabled) { setCurrentMonth(month); setView('days'); } }}
              disabled={disabled}
              className={cn(
                'h-10 text-sm rounded flex items-center justify-center transition-colors cursor-pointer',
                disabled && 'opacity-30 cursor-not-allowed',
                !disabled && 'hover:bg-neutral-100 text-text-secondary'
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
            type="button"
            onClick={() => { if (!disabled) { setCurrentMonth(setYear(currentMonth, y)); setView('months'); } }}
            disabled={disabled}
            className={cn(
              'h-10 text-sm rounded flex items-center justify-center transition-colors cursor-pointer',
              disabled && 'opacity-30 cursor-not-allowed',
              !disabled && 'hover:bg-neutral-100 text-text-secondary'
            )}
          >
            {format(year, 'yyyy')}
          </button>
        );
      })}
    </div>
  );
};
