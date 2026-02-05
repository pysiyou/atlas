/**
 * DateFilter Component
 * Date range picker with calendar popover and quick presets
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, isSameDay, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Popover } from '@/shared/ui/overlay/Popover';
import { Icon } from '@/shared/ui';
import { inputTrigger, inputTriggerOpen } from '@/shared/ui/forms/inputStyles';
import { cn } from '@/utils';
import { ICONS } from '@/utils';
import { DateFilterCalendar } from './DateFilterCalendar';
import { DateFilterHeader } from './DateFilterHeader';

import { DATE_PRESETS, getDateRangeFromPreset, getActivePresetId, type DatePreset } from '@/utils/dateHelpers';

interface DateFilterProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
}

type DatePresetId = DatePreset;

/**
 * DateFilter component with calendar popover and quick presets
 */
export const DateFilter: React.FC<DateFilterProps> = ({
  value,
  onChange,
  placeholder = 'Filter by date range',
  className,
}) => {
  // Current month for calendar navigation
  const [currentMonth, setCurrentMonth] = useState<Date>(value?.[0] || new Date());
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  
  // Track popover open state
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const prevOpenRef = useRef(false);
  const valueSnapshotRef = useRef<[Date, Date] | null>(value);
  
  // Initialize temp values from value prop
  const [tempStart, setTempStart] = useState<Date | null>(() => 
    value?.[0] ? startOfDay(value[0]) : null
  );
  const [tempEnd, setTempEnd] = useState<Date | null>(() => 
    value?.[1] ? endOfDay(value[1]) : null
  );
  
  // Reset temp values when popover opens - snapshot value when opening
  // This is a valid use case: we need to reset temp state when modal opens to allow cancellation
  useEffect(() => {
    if (isPopoverOpen && !prevOpenRef.current) {
      // Popover just opened - snapshot current value and reset temp values
      valueSnapshotRef.current = value;
      if (value) {
        setTempStart(startOfDay(value[0]));
        setTempEnd(endOfDay(value[1]));
      } else {
        setTempStart(null);
        setTempEnd(null);
      }
    }
    prevOpenRef.current = isPopoverOpen;
    // We intentionally only depend on isPopoverOpen to reset on open, not on value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPopoverOpen]);

  // Default date constraints
  const minDate = useMemo(() => new Date(1900, 0, 1), []);
  const maxDate = useMemo(() => new Date(2100, 11, 31), []);

  // Navigation logic
  const navigation = useMemo(() => ({
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
  }), [currentMonth, view]);

  /**
   * Handle date click for range selection
   */
  const handleDateClick = (date: Date) => {
    const normalizedDate = startOfDay(date);
    
    if (!tempStart || (tempStart && tempEnd)) {
      // Start new selection
      setTempStart(normalizedDate);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      // Complete selection
      if (isBefore(normalizedDate, tempStart) || isSameDay(normalizedDate, tempStart)) {
        // If clicked date is before or same as start, swap them
        setTempEnd(endOfDay(tempStart));
        setTempStart(normalizedDate);
      } else {
        setTempEnd(endOfDay(normalizedDate));
      }
    }
  };

  /**
   * Apply the selected range
   */
  const handleApply = () => {
    if (tempStart && tempEnd) {
      onChange([tempStart, tempEnd]);
    } else if (tempStart) {
      // If only start is selected, use it as both start and end
      onChange([tempStart, endOfDay(tempStart)]);
    }
  };

  /**
   * Handle preset click
   */
  const handlePresetClick = (presetId: DatePresetId, close: () => void) => {
    const range = getDateRangeFromPreset(presetId);
    onChange(range);
    close();
  };

  /**
   * Handle clear
   */
  const handleClear = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setTempStart(null);
    setTempEnd(null);
    onChange(null);
  };

  /**
   * Check if date is disabled
   */
  const isDateDisabled = (date: Date): boolean => {
    return isBefore(date, minDate) || isAfter(date, maxDate);
  };

  /**
   * Check if date is selected (start or end)
   */
  const isSelected = (date: Date): boolean => {
    if (!tempStart) return false;
    if (tempEnd) {
      return isSameDay(date, tempStart) || isSameDay(date, tempEnd);
    }
    return isSameDay(date, tempStart);
  };

  /**
   * Check if date is in range
   */
  const isInRange = (date: Date): boolean => {
    if (!tempStart || !tempEnd) return false;
    const dateStart = startOfDay(date);
    return (isAfter(dateStart, tempStart) || isSameDay(dateStart, tempStart)) &&
           (isBefore(dateStart, tempEnd) || isSameDay(dateStart, tempEnd)) &&
           !isSameDay(dateStart, tempStart) &&
           !isSameDay(dateStart, tempEnd);
  };

  // Current range value for calendar
  const calendarValue: [Date, Date] | null = tempStart && tempEnd 
    ? [tempStart, tempEnd] 
    : tempStart 
      ? [tempStart, tempStart] 
      : null;

  const activePresetId = getActivePresetId(value);

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }: { isOpen: boolean }) => {
        // Defer sync to avoid setState during Popover's render (React forbids updating DateFilter while Popover is rendering)
        if (isOpen !== isPopoverOpen) {
          queueMicrotask(() => setIsPopoverOpen(isOpen));
        }
        return (
        <div
          className={cn(inputTrigger, 'w-full', isOpen && inputTriggerOpen, className)}
        >
          <Icon name={ICONS.dataFields.date} className="w-4 h-4 text-fg-faint group-hover:text-brand transition-colors shrink-0" />
          <div className="flex-1 min-w-0 text-xs text-fg truncate">
            {value ? (
              <span className="text-fg">
                {format(value[0], 'MMM dd')} - {format(value[1], 'MMM dd')}
              </span>
            ) : (
              <span className="text-fg-faint">{placeholder}</span>
            )}
          </div>

          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(
              'w-4 h-4 text-fg-disabled transition-transform shrink-0',
              isOpen && 'rotate-180'
            )}
          />

          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 -mr-1 hover:bg-panel-hover rounded transition-colors flex items-center justify-center cursor-pointer"
              type="button"
            >
              <Icon
                name={ICONS.actions.closeCircle}
                className="w-3.5 h-3.5 text-fg-disabled hover:text-fg-subtle"
              />
            </button>
          )}
        </div>
        );
      }}
      className="p-0 w-[320px]"
    >
      {({ close }: { close: () => void }) => (
        <div className="p-3">
          {/* Calendar Header */}
          <DateFilterHeader
            currentMonth={currentMonth}
            view={view}
            onPrevClick={navigation.navigatePrevious}
            onNextClick={navigation.navigateNext}
            onTitleClick={navigation.toggleView}
            isPrevDisabled={false}
            isNextDisabled={false}
          />

          {/* Calendar */}
          <DateFilterCalendar
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            view={view}
            setView={setView}
            value={calendarValue}
            minDate={minDate}
            maxDate={maxDate}
            isDateDisabled={isDateDisabled}
            handleDateClick={handleDateClick}
            isSelected={isSelected}
            isInRange={isInRange}
          />

          {/* Separator */}
          <div className="my-3 border-t border-stroke" />

          {/* Quick Presets */}
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map(preset => {
                const isActive = activePresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetClick(preset.id, close)}
                    className={cn(
                      'px-2 py-1 text-xxs font-medium rounded cursor-pointer transition-colors',
                      'filter-chip',
                      isActive && 'filter-chip--active'
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Apply Button */}
          {tempStart && (
            <div className="mt-3 pt-3 border-t border-stroke">
              <button
                onClick={() => {
                  handleApply();
                  close();
                }}
                className="w-full px-3 py-2 bg-brand hover:opacity-90 text-fg-inverse text-xs font-medium rounded transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      )}
    </Popover>
  );
};
