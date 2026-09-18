/**
 * DatePicker — date range picker with calendar popover and presets.
 */
/* eslint-disable max-lines -- single module: range picker + calendar + presets */

import React, { useState, useRef, useCallback } from 'react';
import {
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isAfter,
  endOfMonth,
  setYear,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { Popover, Icon, FilterTriggerShell, FilterChip } from '@/components';
import { ICONS } from '@/config/icons';
import { RADIUS } from '@/components/theme/recipes';
import { cn } from '@/utils';
import {
  isDateDisabledForPicker,
  isSelectedDateForPicker,
  isDateInRangeForPicker,
  getDateRangeFromPreset,
  getActivePresetId,
  generateCalendarDays,
  generateCalendarMonths,
  generateCalendarYears,
  WEEKDAY_LABELS,
  DATE_PRESETS,
  type DatePreset,
} from '@/utils/date';

export type CalendarView = 'days' | 'months' | 'years';

const MIN_DATE = new Date(1900, 0, 1);
const MAX_DATE = new Date(2100, 11, 31);

export interface DatePickerProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
}

function DatePickerHeader({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
  isPrevDisabled,
  isNextDisabled,
}: {
  currentMonth: Date;
  view: CalendarView;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
}) {
  const getTitle = (): string => {
    if (view === 'days') return format(currentMonth, 'MMMM yyyy');
    if (view === 'months') return format(currentMonth, 'yyyy');
    const years = generateCalendarYears(currentMonth);
    return `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
  };
  return (
    <div className="flex items-center justify-between mb-3">
      <button
        onClick={onPrevClick}
        disabled={isPrevDisabled}
        className={`p-1 hover:bg-surface-hover ${RADIUS.field} text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center`}
      >
        <Icon name={ICONS.actions.chevronLeft} className="w-4 h-4" />
      </button>
      <button
        onClick={onTitleClick}
        className={cn(
          `text-sm font-normal text-text-secondary hover:bg-surface-page px-2 py-1 ${RADIUS.field} transition-colors cursor-pointer`,
          view === 'years' && 'pointer-events-none hover:bg-transparent cursor-default'
        )}
      >
        {getTitle()}
      </button>
      <button
        onClick={onNextClick}
        disabled={isNextDisabled}
        className={`p-1 hover:bg-surface-hover ${RADIUS.field} text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center`}
      >
        <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
      </button>
    </div>
  );
}

function DatePickerCalendarGrid({
  currentMonth,
  setCurrentMonth,
  view,
  setView,
  value,
  minDate,
  maxDate,
  isDateDisabled,
  handleDateClick,
  isSelected,
  isInRange,
}: {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  view: CalendarView;
  setView: (v: CalendarView) => void;
  value: [Date, Date] | null;
  minDate: Date;
  maxDate: Date;
  isDateDisabled: (d: Date) => boolean;
  handleDateClick: (d: Date) => void;
  isSelected: (d: Date) => boolean;
  isInRange: (d: Date) => boolean;
}) {
  if (view === 'days') {
    return (
      <>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-xs text-text-disabled py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {generateCalendarDays(currentMonth).map(day => {
            const currentMonthMatch = isSameMonth(day, currentMonth);
            const selected = isSelected(day);
            const inRange = isInRange(day);
            const isToday = isSameDay(day, new Date());
            const disabled = isDateDisabled(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={disabled}
                className={cn(
                  `h-8 w-8 text-xs ${RADIUS.pill} flex items-center justify-center transition-colors relative cursor-pointer`,
                  disabled && 'opacity-30 cursor-not-allowed',
                  !currentMonthMatch && 'text-text-disabled',
                  currentMonthMatch &&
                    !selected &&
                    !inRange &&
                    !disabled &&
                    'text-text-secondary hover:bg-surface-hover',
                  isToday && !selected && !inRange && !disabled && 'font-normal text-brand bg-brand-muted',
                  inRange && !selected && `bg-brand-muted text-brand ${RADIUS.none}`,
                  value &&
                    isSameDay(day, value[0]) &&
                    !isSameDay(value[0], value[1]) &&
                    RADIUS.rangeStart,
                  value &&
                    isSameDay(day, value[1]) &&
                    !isSameDay(value[0], value[1]) &&
                    RADIUS.rangeEnd,
                  selected && 'bg-brand text-on-brand hover:bg-brand-hover z-10'
                )}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </>
    );
  }
  if (view === 'months') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {generateCalendarMonths(currentMonth).map(month => {
          const endOfM = endOfMonth(month);
          const disabled = isBefore(endOfM, minDate) || isAfter(month, maxDate);
          return (
            <button
              key={month.toISOString()}
              onClick={() => {
                if (!disabled) {
                  setCurrentMonth(month);
                  setView('days');
                }
              }}
              disabled={disabled}
              className={cn(
                `h-10 text-sm ${RADIUS.field} flex items-center justify-center transition-colors cursor-pointer`,
                disabled && 'opacity-30 cursor-not-allowed',
                !disabled && isSameMonth(month, new Date()) && 'text-brand font-normal bg-brand-muted',
                !disabled && isSameMonth(month, currentMonth)
                  ? 'bg-brand-muted text-brand'
                  : 'hover:bg-surface-hover text-text-secondary',
                !disabled && 'hover:bg-surface-hover'
              )}
            >
              {format(month, 'MMM')}
            </button>
          );
        })}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {generateCalendarYears(currentMonth).map(year => {
        const y = year.getFullYear();
        const disabled = y < minDate.getFullYear() || y > maxDate.getFullYear();
        return (
          <button
            key={year.toISOString()}
            onClick={() => {
              if (!disabled) {
                setCurrentMonth(setYear(currentMonth, y));
                setView('months');
              }
            }}
            disabled={disabled}
            className={cn(
              `h-10 text-sm ${RADIUS.field} flex items-center justify-center transition-colors cursor-pointer`,
              disabled && 'opacity-30 cursor-not-allowed',
              !disabled && y === new Date().getFullYear() && 'text-brand font-normal bg-brand-muted',
              !disabled && y === currentMonth.getFullYear()
                ? 'bg-brand-muted text-brand'
                : 'hover:bg-surface-hover text-text-secondary',
              !disabled && 'hover:bg-surface-hover'
            )}
          >
            {format(year, 'yyyy')}
          </button>
        );
      })}
    </div>
  );
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
            className={`w-full px-3 py-2 bg-brand hover:opacity-90 text-text-inverse text-xs font-normal ${RADIUS.field} transition-colors`}
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
