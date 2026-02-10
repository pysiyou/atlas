/**
 * DateFilter Component
 * Date range picker with calendar popover and quick presets
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { format, isSameDay, isBefore, startOfDay, endOfDay } from 'date-fns';
import { Popover, Icon, FilterTriggerShell } from '@/shared/ui';
import { cn } from '@/utils';
import { ICONS } from '@/utils';
import { DateFilterCalendar } from './DateFilterCalendar';
import { DateFilterHeader } from './DateFilterHeader';
import { useCalendarNavigation } from '../hooks/useCalendarNavigation';
import {
  isDateDisabled as isDateDisabledHelper,
  isSelectedDate,
  isDateInRange,
} from '../utils/dateFilterHelpers';
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
  const navigation = useCalendarNavigation(value?.[0] || new Date());

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

  const minDate = useMemo(() => new Date(1900, 0, 1), []);
  const maxDate = useMemo(() => new Date(2100, 11, 31), []);

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

  const isDateDisabled = (date: Date) =>
    isDateDisabledHelper(date, minDate, maxDate);
  const isSelected = (date: Date) =>
    isSelectedDate(date, tempStart, tempEnd);
  const isInRange = (date: Date) =>
    isDateInRange(date, tempStart, tempEnd);

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
        if (isOpen !== isPopoverOpen) {
          queueMicrotask(() => setIsPopoverOpen(isOpen));
        }
        return (
          <FilterTriggerShell
            isOpen={isOpen}
            leftIcon={
              <Icon name={ICONS.dataFields.date} className="w-4 h-4 text-fg-faint group-hover:text-brand transition-colors shrink-0" />
            }
            showClear={!!value}
            onClear={handleClear}
            className={className}
          >
            {value ? (
              <span>
                {format(value[0], 'MMM dd')} - {format(value[1], 'MMM dd')}
              </span>
            ) : (
              <span className="text-fg-faint">{placeholder}</span>
            )}
          </FilterTriggerShell>
        );
      }}
      className="p-0 w-[320px]"
    >
      {({ close }: { close: () => void }) => (
        <div className="p-3">
          {/* Calendar Header */}
          <DateFilterHeader
            currentMonth={navigation.currentMonth}
            view={navigation.view}
            onPrevClick={navigation.navigatePrevious}
            onNextClick={navigation.navigateNext}
            onTitleClick={navigation.toggleView}
            isPrevDisabled={false}
            isNextDisabled={false}
          />

          {/* Calendar */}
          <DateFilterCalendar
            currentMonth={navigation.currentMonth}
            setCurrentMonth={navigation.setCurrentMonth}
            view={navigation.view}
            setView={navigation.setView}
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
                      'px-2 py-1 text-xxs font-normal rounded cursor-pointer transition-colors',
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
                className="w-full px-3 py-2 bg-brand hover:opacity-90 text-fg-inverse text-xs font-normal rounded transition-colors"
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
