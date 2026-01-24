/**
 * DateInput Component
 * Single date picker using the same calendar as DateFilter
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Icon } from './Icon';
import { Popover } from './Popover';
import { cn } from '@/utils';
import { DateFilterCalendar } from '@/features/order/components/DateFilterCalendar';
import { DateFilterHeader } from '@/features/order/components/DateFilterHeader';
import { useDateFilterNavigation } from '@/features/order/hooks/useDateFilterNavigation';

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

  const navigation = useDateFilterNavigation({
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    minDate: defaultMinDate,
    maxDate: defaultMaxDate,
  });

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
            className="text-xxs font-medium text-gray-500 cursor-pointer truncate min-w-0"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
      )}

      <Popover
        placement="bottom-start"
        showBackdrop={false}
        trigger={({ isOpen }) => (
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 bg-white border rounded cursor-pointer transition-colors w-full',
              isOpen
                ? 'border-sky-500 ring-2 ring-sky-500/20'
                : error
                  ? 'border-red-500'
                  : 'border-gray-300 hover:border-gray-400',
              disabled && 'bg-gray-100 cursor-not-allowed'
            )}
          >
            <Icon name="calendar" className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div className="flex-1 text-xs truncate">
              {dateValue ? (
                <span className="text-gray-900">{format(dateValue, 'dd MMM yyyy')}</span>
              ) : (
                <span className="text-gray-300">{placeholder}</span>
              )}
            </div>

            <Icon
              name="chevron-down"
              className={cn(
                'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
                isOpen && 'rotate-180'
              )}
            />

            {dateValue && !disabled && (
              <button
                onClick={handleClear}
                className="p-0.5 -mr-1 hover:bg-gray-100 rounded transition-colors flex items-center justify-center cursor-pointer"
                type="button"
              >
                <Icon
                  name="close-circle"
                  className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600"
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
              onPrevClick={navigation.handlePrevClick}
              onNextClick={navigation.handleNextClick}
              onTitleClick={navigation.handleTitleClick}
              isPrevDisabled={navigation.isPrevDisabled()}
              isNextDisabled={navigation.isNextDisabled()}
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

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
