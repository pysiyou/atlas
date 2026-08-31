/**
 * DateInput — single date picker with calendar popover (max-depth-1).
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Popover, Icon } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { inputTrigger, inputTriggerOpen, inputError, inputClearButton } from '@/components/inputs/inputStyles';
import { DateInputHeader } from './DateInputHeader';
import { DateInputCalendarGrid, type DateInputCalendarView } from './DateInputCalendarGrid';

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
  const [view, setView] = useState<DateInputCalendarView>('days');
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

  const cycleView = () => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days');

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
              onTitleClick={cycleView}
            />
            <DateInputCalendarGrid
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              view={view}
              setView={setView}
              minDate={defaultMinDate}
              maxDate={defaultMaxDate}
              isDateDisabled={isDateDisabled}
              handleDateClick={handleDateClick}
              isSelected={isSelected}
            />
          </div>
        )}
      </Popover>
      <input type="hidden" id={inputId} name={name} value={value} />
      {error && <p className="text-xs text-danger-fg mt-1">{error}</p>}
    </div>
  );
};
