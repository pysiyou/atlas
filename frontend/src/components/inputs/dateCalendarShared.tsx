/**
 * Shared calendar view, month cursor, header, and day/month/year grids.
 */
/* eslint-disable react-refresh/only-export-components -- hook + header + grids share one module */

import { useState } from 'react';
import {
  format,
  isSameMonth,
  isSameDay,
  endOfMonth,
  setYear,
  isBefore,
  isAfter,
} from 'date-fns';
import { Icon } from '@/components/primitives';
import { IconKeys } from '@/config/icons';
import { cn } from '@/utils';
import { text, RADIUS, CALENDAR_TYPE } from '@/theme/recipes';
import {
  generateCalendarDays,
  generateCalendarMonths,
  generateCalendarYears,
  WEEKDAY_LABELS,
} from '@/utils/date';

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

export interface CalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  view: CalendarView;
  setView: (view: CalendarView) => void;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (date: Date) => boolean;
  handleDateClick: (date: Date) => void;
  isSelected: (date: Date) => boolean;
  /** Range-fill predicate; omit for single-date pickers. */
  isInRange?: (date: Date) => boolean;
  /** Inclusive range endpoints for start/end radius; omit for single-date. */
  rangeValue?: [Date, Date] | null;
  /** Highlight the current month/year (DatePicker). DateInput leaves this off. */
  highlightCurrent?: boolean;
}

/**
 * Days / months / years body shared by DateInput and DatePicker.
 * Range highlighting is opt-in so single-date styling stays unchanged.
 */
export function CalendarGrid({
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
  rangeValue,
  highlightCurrent = false,
}: CalendarGridProps) {
  if (view === 'days') {
    return (
      <>
        <div className="grid grid-cols-7 gap-space-1 mb-space-1">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className={CALENDAR_TYPE.weekday}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-space-1">
          {generateCalendarDays(currentMonth).map(day => {
            const currentMonthMatch = isSameMonth(day, currentMonth);
            const selected = isSelected(day);
            const inRange = isInRange?.(day) ?? false;
            const isToday = isSameDay(day, new Date());
            const disabled = isDateDisabled(day);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={cn(
                  `h-8 w-8 ${CALENDAR_TYPE.day} ${RADIUS.pill} flex items-center justify-center transition-colors cursor-pointer`,
                  isInRange && 'relative',
                  disabled && 'opacity-30 cursor-not-allowed',
                  !currentMonthMatch && 'text-text-disabled',
                  currentMonthMatch &&
                    !selected &&
                    !inRange &&
                    !disabled &&
                    'text-text-secondary hover:bg-surface-hover',
                  isToday &&
                    !selected &&
                    !inRange &&
                    !disabled &&
                    'font-normal text-brand bg-brand-muted',
                  inRange && !selected && `bg-brand-muted text-brand ${RADIUS.none}`,
                  rangeValue &&
                    isSameDay(day, rangeValue[0]) &&
                    !isSameDay(rangeValue[0], rangeValue[1]) &&
                    RADIUS.rangeStart,
                  rangeValue &&
                    isSameDay(day, rangeValue[1]) &&
                    !isSameDay(rangeValue[0], rangeValue[1]) &&
                    RADIUS.rangeEnd,
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
      <div className="grid grid-cols-3 gap-space-2">
        {generateCalendarMonths(currentMonth).map(month => {
          const endOfM = endOfMonth(month);
          const disabled = isBefore(endOfM, minDate) || isAfter(month, maxDate);
          return (
            <button
              key={month.toISOString()}
              type="button"
              onClick={() => {
                if (!disabled) {
                  setCurrentMonth(month);
                  setView('days');
                }
              }}
              disabled={disabled}
              className={cn(
                `h-10 ${CALENDAR_TYPE.month} ${RADIUS.field} flex items-center justify-center transition-colors cursor-pointer`,
                disabled && 'opacity-30 cursor-not-allowed',
                highlightCurrent &&
                  !disabled &&
                  isSameMonth(month, new Date()) &&
                  'text-brand font-normal bg-brand-muted',
                highlightCurrent
                  ? !disabled && isSameMonth(month, currentMonth)
                    ? 'bg-brand-muted text-brand'
                    : 'hover:bg-surface-hover text-text-secondary'
                  : !disabled && 'hover:bg-surface-hover text-text-secondary',
                highlightCurrent && !disabled && 'hover:bg-surface-hover'
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
    <div className="grid grid-cols-3 gap-space-2">
      {generateCalendarYears(currentMonth).map(year => {
        const y = year.getFullYear();
        const disabled = y < minDate.getFullYear() || y > maxDate.getFullYear();
        return (
          <button
            key={year.toISOString()}
            type="button"
            onClick={() => {
              if (!disabled) {
                setCurrentMonth(setYear(currentMonth, y));
                setView('months');
              }
            }}
            disabled={disabled}
            className={cn(
              `h-10 ${CALENDAR_TYPE.month} ${RADIUS.field} flex items-center justify-center transition-colors cursor-pointer`,
              disabled && 'opacity-30 cursor-not-allowed',
              highlightCurrent &&
                !disabled &&
                y === new Date().getFullYear() &&
                'text-brand font-normal bg-brand-muted',
              highlightCurrent
                ? !disabled && y === currentMonth.getFullYear()
                  ? 'bg-brand-muted text-brand'
                  : 'hover:bg-surface-hover text-text-secondary'
                : !disabled && 'hover:bg-surface-hover text-text-secondary',
              highlightCurrent && !disabled && 'hover:bg-surface-hover'
            )}
          >
            {format(year, 'yyyy')}
          </button>
        );
      })}
    </div>
  );
}
