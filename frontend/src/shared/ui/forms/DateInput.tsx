/**
 * DateInput Component
 * Single date picker using the same calendar as DateFilter
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Icon } from '../display/Icon';
import { Popover } from '../overlay/Popover';
import { cn } from '@/utils';
import { ICONS } from '@/utils';
import { inputTrigger, inputTriggerOpen, inputError } from './inputStyles';
import { DateFilterCalendar } from '@/features/order/components/DateFilterCalendar';
import { DateFilterHeader } from '@/features/order/components/DateFilterHeader';
// useDateFilterNavigation removed - logic inlined below

interface DateInputProps {
  label?: string;
  value: string; // ISO date string (YYYY-MM-DD)
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

/**
 * DateInput - Single date picker with calendar popover
 */
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

  // Parse value to Date or null
  const dateValue = value ? new Date(value) : null;

  // Current month for calendar navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(dateValue || new Date());
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');

  // Provide default dates if not specified (100 years ago to 100 years in future)
  const defaultMinDate = minDate || new Date(1900, 0, 1);
  const defaultMaxDate = maxDate || new Date(2100, 11, 31);

  // Inline navigation logic (previously from useDateFilterNavigation)
  const navigation = {
    currentMonth,
    view,
    navigatePrevious: () => {
      if (view === 'days') {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
      } else if (view === 'months') {
        setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
      } else {
        setCurrentMonth(new Date(currentMonth.getFullYear() - 10, currentMonth.getMonth(), 1));
      }
    },
    navigateNext: () => {
      if (view === 'days') {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
      } else if (view === 'months') {
        setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
      } else {
        setCurrentMonth(new Date(currentMonth.getFullYear() + 10, currentMonth.getMonth(), 1));
      }
    },
    navigateToToday: () => {
      setCurrentMonth(new Date());
      setView('days');
    },
    toggleView: () => {
      setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days');
    },
    selectMonth: (month: number) => {
      setCurrentMonth(new Date(currentMonth.getFullYear(), month, 1));
      setView('days');
    },
    selectYear: (year: number) => {
      setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
      setView('months');
    },
  };

  /**
   * Handle date selection
   */
  const handleDateClick = (date: Date) => {
    // Convert to ISO string (YYYY-MM-DD)
    const isoDate = format(date, 'yyyy-MM-dd');
    onChange(isoDate);
  };

  /**
   * Check if date is disabled
   */
  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  /**
   * Check if date is selected
   */
  const isSelected = (date: Date): boolean => {
    if (!dateValue) return false;
    return format(date, 'yyyy-MM-dd') === format(dateValue, 'yyyy-MM-dd');
  };

  /**
   * Handle clear
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="w-full group">
      {label && (
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-tertiary cursor-pointer truncate min-w-0"
          >
            {label}
            {required && <span className="text-feedback-danger-text ml-1">*</span>}
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
            <Icon name={ICONS.dataFields.date} className="w-4 h-4 text-text-muted group-hover:text-action-primary transition-colors shrink-0" />
            <div className="flex-1 min-w-0 text-xs text-text-primary truncate">
              {dateValue ? (
                <span className="text-text-primary">{format(dateValue, 'dd MMM yyyy')}</span>
              ) : (
                <span className="text-text-muted">{placeholder}</span>
              )}
            </div>

            <Icon
              name={ICONS.actions.chevronDown}
              className={cn(
                'w-4 h-4 text-text-disabled transition-transform shrink-0',
                isOpen && 'rotate-180'
              )}
            />

            {dateValue && !disabled && (
              <button
                onClick={handleClear}
                className="p-0.5 -mr-1 hover:bg-neutral-100 rounded transition-colors flex items-center justify-center cursor-pointer"
                type="button"
              >
                <Icon
                  name={ICONS.actions.closeCircle}
                  className="w-3.5 h-3.5 text-text-disabled hover:text-text-tertiary"
                />
              </button>
            )}
          </div>
        )}
        className="p-0 w-[280px]"
      >
        {() => (
          <div className="p-3">
            <DateFilterHeader
              currentMonth={currentMonth}
              view={view}
              onPrevClick={navigation.navigatePrevious}
              onNextClick={navigation.navigateNext}
              onTitleClick={navigation.toggleView}
              isPrevDisabled={false}
              isNextDisabled={false}
            />

            <DateFilterCalendar
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              view={view}
              setView={setView}
              value={dateValue ? [dateValue, dateValue] : null}
              minDate={defaultMinDate}
              maxDate={defaultMaxDate}
              isDateDisabled={isDateDisabled}
              handleDateClick={handleDateClick}
              isSelected={isSelected}
              isInRange={() => false}
            />
          </div>
        )}
      </Popover>

      {/* Hidden input for form compatibility */}
      <input type="hidden" id={inputId} name={name} value={value} />

      {error && <p className="text-xs text-feedback-danger-text mt-1">{error}</p>}
    </div>
  );
};
