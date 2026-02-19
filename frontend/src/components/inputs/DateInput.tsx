/**
 * DateInput — single date picker with calendar popover (max-depth-1).
 */

import React, { useState } from 'react';
import { format, isSameMonth, isSameDay, endOfMonth, setYear, isBefore, isAfter } from 'date-fns';
import { Popover, Icon } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/utils';
import { inputTrigger, inputTriggerOpen, inputError, inputClearButton } from '@/components/inputs/inputStyles';
import {
  generateCalendarDays,
  generateCalendarMonths,
  generateCalendarYears,
  WEEKDAY_LABELS,
} from '@/utils/date';

export interface DateInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

function DateInputHeader({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
}: {
  currentMonth: Date;
  view: 'days' | 'months' | 'years';
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
}) {
  const getTitle = (): string => {
    if (view === 'days') return format(currentMonth, 'MMMM yyyy');
    if (view === 'months') return format(currentMonth, 'yyyy');
    const years = generateCalendarYears(currentMonth);
    return `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
  };
  return (
    <div className="flex items-center justify-between mb-3">
      <button type="button" onClick={onPrevClick} className="p-1 hover:bg-neutral-100 rounded text-text-tertiary cursor-pointer flex items-center justify-center">
        <Icon name={ICONS.actions.chevronLeft} className="w-4 h-4" />
      </button>
      <button type="button" onClick={onTitleClick} className="text-sm font-normal text-text-secondary hover:bg-surface-page px-2 py-1 rounded transition-colors cursor-pointer">
        {getTitle()}
      </button>
      <button type="button" onClick={onNextClick} className="p-1 hover:bg-neutral-100 rounded text-text-tertiary cursor-pointer flex items-center justify-center">
        <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
      </button>
    </div>
  );
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  placeholder = 'Select date',
  id,
  name,
  disabled = false,
  minDate,
  maxDate,
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const dateValue = value ? new Date(value) : null;
  const [currentMonth, setCurrentMonth] = useState<Date>(dateValue || new Date());
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const defaultMinDate = minDate || new Date(1900, 0, 1);
  const defaultMaxDate = maxDate || new Date(2100, 11, 31);

  const navigatePrevious = () => {
    if (view === 'days') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    else if (view === 'months') setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear() - 10, currentMonth.getMonth(), 1));
  };
  const navigateNext = () => {
    if (view === 'days') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    else if (view === 'months') setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear() + 10, currentMonth.getMonth(), 1));
  };

  const handleDateClick = (date: Date) => onChange(format(date, 'yyyy-MM-dd'));

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };
  const isSelected = (date: Date): boolean =>
    !!dateValue && format(date, 'yyyy-MM-dd') === format(dateValue, 'yyyy-MM-dd');

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="w-full group">
      {label && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label htmlFor={inputId} className="text-xs font-normal text-text-tertiary cursor-pointer truncate min-w-0">
            {label}
            {required && <span className="text-danger-fg ml-1">*</span>}
          </label>
        </div>
      )}
      <Popover
        placement="bottom-start"
        showBackdrop={false}
        trigger={({ isOpen }: { isOpen: boolean }) => (
          <div
            className={cn(
              inputTrigger,
              'w-full',
              isOpen && inputTriggerOpen,
              error && inputError,
              disabled && 'bg-neutral-100 cursor-not-allowed'
            )}
          >
            <Icon name={ICONS.dataFields.date} className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors shrink-0" />
            <div className="flex-1 min-w-0 text-xs text-text-primary truncate">
              {dateValue ? (
                <span className="text-text-primary">{format(dateValue, 'dd MMM yyyy')}</span>
              ) : (
                <span className="text-text-muted">{placeholder}</span>
              )}
            </div>
            <Icon name={ICONS.actions.chevronDown} className={cn('w-4 h-4 text-text-disabled transition-transform shrink-0', isOpen && 'rotate-180')} />
            {dateValue && !disabled && (
              <button onClick={handleClear} className={cn(inputClearButton, '-mr-1 hover:bg-neutral-100')} type="button">
                <Icon name={ICONS.actions.closeCircle} className="w-3.5 h-3.5 text-text-disabled hover:text-text-tertiary" />
              </button>
            )}
          </div>
        )}
        className="p-0 w-[280px]"
      >
        {() => (
          <div className="p-3">
            <DateInputHeader
              currentMonth={currentMonth}
              view={view}
              onPrevClick={navigatePrevious}
              onNextClick={navigateNext}
              onTitleClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')}
            />
            {view === 'days' && (
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
            )}
            {view === 'months' && (
              <div className="grid grid-cols-3 gap-2">
                {generateCalendarMonths(currentMonth).map(month => {
                  const endOfM = endOfMonth(month);
                  const disabled = isBefore(endOfM, defaultMinDate) || isAfter(month, defaultMaxDate);
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
            )}
            {view === 'years' && (
              <div className="grid grid-cols-3 gap-2">
                {generateCalendarYears(currentMonth).map(year => {
                  const y = year.getFullYear();
                  const disabled = y < defaultMinDate.getFullYear() || y > defaultMaxDate.getFullYear();
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
            )}
          </div>
        )}
      </Popover>
      <input type="hidden" id={inputId} name={name} value={value} />
      {error && <p className="text-xs text-danger-fg mt-1">{error}</p>}
    </div>
  );
};
