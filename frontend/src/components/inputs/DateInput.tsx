/**
 * DateInput — single date picker with calendar popover.
 */

import React from 'react';
import { format } from 'date-fns';
import { Popover } from '@/components/overlays';
import { Icon } from '@/components/primitives';
import { cn } from '@/utils';
import { IconKeys } from '@/config/icons';
import { text, inputTrigger,
  inputTriggerOpen,
  inputError,
  inputClearButton,
  FORM_CONTROL_LABEL } from '@/theme/recipes';
import { FIELD_ERROR, TONE } from '@/theme/recipes';
import { CalendarGrid, CalendarHeader, useCalendarMonth } from './dateCalendarShared';

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
  const {
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    navigatePrevious,
    navigateNext,
  } = useCalendarMonth(dateValue || new Date());
  const defaultMinDate = minDate || new Date(1900, 0, 1);
  const defaultMaxDate = maxDate || new Date(2100, 11, 31);

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
        <div className="flex justify-between items-baseline mb-space-1 gap-space-2">
          <label htmlFor={inputId} className={FORM_CONTROL_LABEL}>
            {label}
            {required && <span className={`${TONE.danger.fg} ml-space-1`}>*</span>}
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
              disabled && 'bg-surface-hover cursor-not-allowed'
            )}
          >
            <Icon iconKey={IconKeys.dataFields.date}
              className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors shrink-0"
            />
            <div className={`flex-1 min-w-0 ${text({ role: 'body' })} truncate`}>
              {dateValue ? (
                <span className="text-text-primary">{format(dateValue, 'dd MMM yyyy')}</span>
              ) : (
                <span className="text-text-muted">{placeholder}</span>
              )}
            </div>
            <Icon iconKey={IconKeys.actions.chevronDown}
              className={cn('w-4 h-4 text-text-disabled transition-transform shrink-0', isOpen && 'rotate-180')}
            />
            {dateValue && !disabled && (
              <button
                onClick={handleClear}
                className={cn(inputClearButton, '-mr-space-1 hover:bg-surface-hover')}
                type="button"
              >
                <Icon iconKey={IconKeys.actions.close} className="w-3.5 h-3.5 text-text-disabled hover:text-text-tertiary" />
              </button>
            )}
          </div>
        )}
        className="p-0 w-[280px]"
      >
        {() => (
          <div className="p-space-3">
            <CalendarHeader
              currentMonth={currentMonth}
              view={view}
              onPrevClick={navigatePrevious}
              onNextClick={navigateNext}
              onTitleClick={cycleView}
            />
            <CalendarGrid
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
      {error && <p className={`${FIELD_ERROR} mt-space-1`}>{error}</p>}
    </div>
  );
};
