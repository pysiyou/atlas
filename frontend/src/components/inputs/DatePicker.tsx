/**
 * DatePicker — date range picker with calendar popover and presets.
 */

import React, { useState, useRef, useCallback } from 'react';
import { format, isBefore, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { Popover, Icon, FilterTriggerShell } from '@/components';
import { ICONS } from '@/config/icons';
import {
  isDateDisabledForPicker,
  isSelectedDateForPicker,
  isDateInRangeForPicker,
  getDateRangeFromPreset,
  getActivePresetId,
} from '@/utils/date';
import { MIN_DATE, MAX_DATE, type CalendarView } from './DatePickerCalendar';
import { DatePickerPopoverBody } from './DatePickerPopoverBody';

export type { CalendarView };

export interface DatePickerProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Filter by date range',
  className,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(value?.[0] || new Date());
  const [view, setView] = useState<CalendarView>('days');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const valueSnapshotRef = useRef<[Date, Date] | null>(value);

  const [tempStart, setTempStart] = useState<Date | null>(() =>
    value?.[0] ? startOfDay(value[0]) : null
  );
  const [tempEnd, setTempEnd] = useState<Date | null>(() =>
    value?.[1] ? endOfDay(value[1]) : null
  );

  const syncTempRangeFromValue = useCallback((nextValue: [Date, Date] | null) => {
    valueSnapshotRef.current = nextValue;
    if (nextValue) {
      setTempStart(startOfDay(nextValue[0]));
      setTempEnd(endOfDay(nextValue[1]));
    } else {
      setTempStart(null);
      setTempEnd(null);
    }
  }, []);

  const handlePopoverOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen && !isPopoverOpen) {
        syncTempRangeFromValue(value);
      }
      setIsPopoverOpen(isOpen);
    },
    [isPopoverOpen, syncTempRangeFromValue, value]
  );

  const navigatePrevious = () => {
    if (view === 'days') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    else if (view === 'months')
      setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear() - 10, currentMonth.getMonth(), 1));
  };
  const navigateNext = () => {
    if (view === 'days') setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    else if (view === 'months')
      setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    else setCurrentMonth(new Date(currentMonth.getFullYear() + 10, currentMonth.getMonth(), 1));
  };

  const handleDateClick = (date: Date) => {
    const normalizedDate = startOfDay(date);
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(normalizedDate);
      setTempEnd(null);
    } else if (tempStart && !tempEnd) {
      if (isBefore(normalizedDate, tempStart) || isSameDay(normalizedDate, tempStart)) {
        setTempEnd(endOfDay(tempStart));
        setTempStart(normalizedDate);
      } else {
        setTempEnd(endOfDay(normalizedDate));
      }
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) onChange([tempStart, tempEnd]);
    else if (tempStart) onChange([tempStart, endOfDay(tempStart)]);
  };

  const handleClear = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTempStart(null);
    setTempEnd(null);
    onChange(null);
  };

  const isDateDisabled = (date: Date) => isDateDisabledForPicker(date, MIN_DATE, MAX_DATE);
  const isSelected = (date: Date) => isSelectedDateForPicker(date, tempStart, tempEnd);
  const isInRange = (date: Date) => isDateInRangeForPicker(date, tempStart, tempEnd);

  const calendarValue: [Date, Date] | null =
    tempStart && tempEnd ? [tempStart, tempEnd] : tempStart ? [tempStart, tempStart] : null;
  const activePresetId = getActivePresetId(value);

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }: { isOpen: boolean }) => {
        if (isOpen !== isPopoverOpen) queueMicrotask(() => handlePopoverOpenChange(isOpen));
        return (
          <FilterTriggerShell
            isOpen={isOpen}
            leftIcon={
              <Icon
                name={ICONS.dataFields.date}
                className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors shrink-0"
              />
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
              <span className="text-text-muted">{placeholder}</span>
            )}
          </FilterTriggerShell>
        );
      }}
      className="p-0 w-[320px]"
    >
      {({ close }: { close: () => void }) => (
        <DatePickerPopoverBody
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          view={view}
          setView={setView}
          calendarValue={calendarValue}
          minDate={MIN_DATE}
          maxDate={MAX_DATE}
          isDateDisabled={isDateDisabled}
          handleDateClick={handleDateClick}
          isSelected={isSelected}
          isInRange={isInRange}
          navigatePrevious={navigatePrevious}
          navigateNext={navigateNext}
          activePresetId={activePresetId}
          onPresetClick={presetId => {
            onChange(getDateRangeFromPreset(presetId));
            close();
          }}
          tempStart={tempStart}
          onApply={() => {
            handleApply();
            close();
          }}
        />
      )}
    </Popover>
  );
};
