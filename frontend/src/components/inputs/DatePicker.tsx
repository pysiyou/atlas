/**
 * DatePicker — date range picker with calendar popover and presets.
 */

import React, { useState, useRef, useCallback } from 'react';
import { format, isBefore, isSameDay, startOfDay, endOfDay } from 'date-fns';
import { FilterTriggerShell, Popover } from '@/components/overlays';
import { FilterChip } from '@/components/primitives';
import { IconKeys, type IconKey } from '@/config/icons';
import { filterTriggerIcon } from '@/components/filters/filterControlIcons';
import { CALENDAR_TYPE, RADIUS } from '@/theme/recipes';
import { CalendarGrid, CalendarHeader, useCalendarMonth, type CalendarView } from './dateCalendarShared';
import {
  isDateDisabledForPicker,
  isSelectedDateForPicker,
  isDateInRangeForPicker,
  getDateRangeFromPreset,
  getActivePresetId,
  DATE_PRESETS,
  type DatePreset } from '@/utils/date';

export type { CalendarView };

const MIN_DATE = new Date(1900, 0, 1);
const MAX_DATE = new Date(2100, 11, 31);

export interface DatePickerProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
  /** Leading trigger icon; defaults to calendar. */
  iconKey?: IconKey;
}

function DatePickerPopoverBody({
  currentMonth,
  setCurrentMonth,
  view,
  setView,
  calendarValue,
  minDate,
  maxDate,
  isDateDisabled,
  handleDateClick,
  isSelected,
  isInRange,
  navigatePrevious,
  navigateNext,
  activePresetId,
  onPresetClick,
  tempStart,
  onApply,
}: {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  view: CalendarView;
  setView: (v: CalendarView) => void;
  calendarValue: [Date, Date] | null;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (d: Date) => boolean;
  handleDateClick: (d: Date) => void;
  isSelected: (d: Date) => boolean;
  isInRange: (d: Date) => boolean;
  navigatePrevious: () => void;
  navigateNext: () => void;
  activePresetId: DatePreset | null;
  onPresetClick: (presetId: DatePreset) => void;
  tempStart: Date | null;
  onApply: () => void;
}) {
  return (
    <div className="p-space-3">
      <CalendarHeader
        currentMonth={currentMonth}
        view={view}
        onPrevClick={navigatePrevious}
        onNextClick={navigateNext}
        onTitleClick={() =>
          setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')
        }
      />
      <CalendarGrid
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        view={view}
        setView={setView}
        minDate={minDate}
        maxDate={maxDate}
        isDateDisabled={isDateDisabled}
        handleDateClick={handleDateClick}
        isSelected={isSelected}
        isInRange={isInRange}
        rangeValue={calendarValue}
        highlightCurrent
      />
      <div className="my-space-3 border-t border-border-default" />
      <div className="mt-space-3">
        <div className="flex flex-wrap gap-space-2">
          {DATE_PRESETS.map(preset => (
            <FilterChip
              key={preset.id}
              size="sm"
              active={activePresetId === preset.id}
              onClick={() => onPresetClick(preset.id)}
            >
              {preset.label}
            </FilterChip>
          ))}
        </div>
      </div>
      {tempStart && (
        <div className="mt-space-3 pt-space-3 border-t border-border-default">
          <button
            onClick={onApply}
            className={`w-full px-space-3 py-space-2 bg-brand hover:opacity-90 text-text-inverse ${CALENDAR_TYPE.applyButton} ${RADIUS.field} transition-colors`}
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Filter by date range',
  className,
  iconKey = IconKeys.dataFields.date,
}) => {
  const {
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    navigatePrevious,
    navigateNext,
  } = useCalendarMonth(value?.[0] || new Date());
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
            leftIcon={filterTriggerIcon(iconKey)}
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
