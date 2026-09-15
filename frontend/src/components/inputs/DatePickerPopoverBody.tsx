/**
 * DatePicker popover body — calendar, presets, and apply button.
 */

import React from 'react';
import { FilterChip } from '@/components';
import { DATE_PRESETS, type DatePreset } from '@/utils/date';
import {
  DatePickerHeader,
  DatePickerCalendarGrid,
  type CalendarView,
} from './DatePickerCalendar';

export interface DatePickerPopoverBodyProps {
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
}

export const DatePickerPopoverBody: React.FC<DatePickerPopoverBodyProps> = ({
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
}) => (
  <div className="p-3">
    <DatePickerHeader
      currentMonth={currentMonth}
      view={view}
      onPrevClick={navigatePrevious}
      onNextClick={navigateNext}
      onTitleClick={() =>
        setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')
      }
      isPrevDisabled={false}
      isNextDisabled={false}
    />
    <DatePickerCalendarGrid
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
    <div className="my-3 border-t border-border-default" />
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
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
      <div className="mt-3 pt-3 border-t border-border-default">
        <button
          onClick={onApply}
          className="w-full px-3 py-2 bg-brand hover:opacity-90 text-text-inverse text-xs font-normal rounded transition-colors"
        >
          Apply
        </button>
      </div>
    )}
  </div>
);
