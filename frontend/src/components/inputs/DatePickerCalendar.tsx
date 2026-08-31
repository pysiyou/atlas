/**
 * DatePicker calendar subcomponents — header and grid views.
 */

import {
  format,
  isSameDay,
  isSameMonth,
  isBefore,
  isAfter,
  endOfMonth,
  setYear,
} from 'date-fns';
import { Icon } from '@/components';
import { cn, ICONS } from '@/utils';
import {
  generateCalendarDays,
  generateCalendarMonths,
  generateCalendarYears,
  WEEKDAY_LABELS,
} from '@/utils/date';

export type CalendarView = 'days' | 'months' | 'years';

export const MIN_DATE = new Date(1900, 0, 1);
export const MAX_DATE = new Date(2100, 11, 31);

export interface DatePickerHeaderProps {
  currentMonth: Date;
  view: CalendarView;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}

export function DatePickerHeader({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
  isPrevDisabled,
  isNextDisabled,
}: DatePickerHeaderProps) {
  const getTitle = (): string => {
    if (view === 'days') return format(currentMonth, 'MMMM yyyy');
    if (view === 'months') return format(currentMonth, 'yyyy');
    const years = generateCalendarYears(currentMonth);
    return `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
  };
  return (
    <div className="flex items-center justify-between mb-3">
      <button
        onClick={onPrevClick}
        disabled={isPrevDisabled}
        className="p-1 hover:bg-neutral-100 rounded text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
      >
        <Icon name={ICONS.actions.chevronLeft} className="w-4 h-4" />
      </button>
      <button
        onClick={onTitleClick}
        className={cn(
          'text-sm font-normal text-text-secondary hover:bg-surface-page px-2 py-1 rounded transition-colors cursor-pointer',
          view === 'years' && 'pointer-events-none hover:bg-transparent cursor-default'
        )}
      >
        {getTitle()}
      </button>
      <button
        onClick={onNextClick}
        disabled={isNextDisabled}
        className="p-1 hover:bg-neutral-100 rounded text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
      >
        <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
      </button>
    </div>
  );
}

export interface DatePickerCalendarGridProps {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  view: CalendarView;
  setView: (v: CalendarView) => void;
  value: [Date, Date] | null;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (d: Date) => boolean;
  handleDateClick: (d: Date) => void;
  isSelected: (d: Date) => boolean;
  isInRange: (d: Date) => boolean;
}

export function DatePickerCalendarGrid({
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
}: DatePickerCalendarGridProps) {
  if (view === 'days') {
    return (
      <>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-xs text-text-disabled py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays(currentMonth).map(day => {
            const currentMonthMatch = isSameMonth(day, currentMonth);
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
                  !currentMonthMatch && 'text-text-disabled',
                  currentMonthMatch &&
                    !selected &&
                    !inRange &&
                    !disabled &&
                    'text-text-secondary hover:bg-neutral-100',
                  isToday && !selected && !inRange && !disabled && 'font-normal text-brand bg-brand-muted',
                  inRange && !selected && 'bg-brand-muted text-brand rounded-none',
                  value &&
                    isSameDay(day, value[0]) &&
                    !isSameDay(value[0], value[1]) &&
                    'rounded-l-full rounded-r-none',
                  value &&
                    isSameDay(day, value[1]) &&
                    !isSameDay(value[0], value[1]) &&
                    'rounded-r-full rounded-l-none',
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
              onClick={() => {
                if (!disabled) {
                  setCurrentMonth(month);
                  setView('days');
                }
              }}
              disabled={disabled}
              className={cn(
                'h-10 text-sm rounded flex items-center justify-center transition-colors cursor-pointer',
                disabled && 'opacity-30 cursor-not-allowed',
                !disabled && isSameMonth(month, new Date()) && 'text-brand font-normal bg-brand-muted',
                !disabled && isSameMonth(month, currentMonth)
                  ? 'bg-brand-muted text-brand'
                  : 'hover:bg-neutral-100 text-text-secondary',
                !disabled && 'hover:bg-neutral-100'
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
              if (!disabled) {
                setCurrentMonth(setYear(currentMonth, y));
                setView('months');
              }
            }}
            disabled={disabled}
            className={cn(
              'h-10 text-sm rounded flex items-center justify-center transition-colors cursor-pointer',
              disabled && 'opacity-30 cursor-not-allowed',
              !disabled && y === new Date().getFullYear() && 'text-brand font-normal bg-brand-muted',
              !disabled && y === currentMonth.getFullYear()
                ? 'bg-brand-muted text-brand'
                : 'hover:bg-neutral-100 text-text-secondary',
              !disabled && 'hover:bg-neutral-100'
            )}
          >
            {format(year, 'yyyy')}
          </button>
        );
      })}
    </div>
  );
}
