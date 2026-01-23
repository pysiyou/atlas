/**
 * DateFilter Component (Refactored)
 * 
 * Simplified by extracting:
 * - State logic → hooks/useDateFilterState.ts
 * - Navigation logic → hooks/useDateFilterNavigation.ts
 * - Helper functions → utils/dateFilterHelpers.ts
 * - Calendar views → components/ (days, months, years)
 */

import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Icon } from '@/shared/ui/Icon';
import { Popover } from '@/shared/ui/Popover';
import { cn } from '@/utils';
import { useDateFilterState } from './hooks/useDateFilterState';
import { useDateFilterNavigation } from './hooks/useDateFilterNavigation';
import { DateFilterCalendar } from './components/DateFilterCalendar';
import { DateFilterHeader } from './components/DateFilterHeader';
import { DateFilterPresets } from './components/DateFilterPresets';

interface DateFilterProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Main DateFilter component with calendar picker and quick presets
 */
export const DateFilter: React.FC<DateFilterProps> = ({
  value,
  onChange,
  placeholder = 'Filter by Date',
  className,
}) => {
  const {
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    minDate,
    maxDate,
    isDateDisabled,
    handleDateClick,
    isSelected,
    isInRange,
    handleClear,
  } = useDateFilterState({ value, onChange });

  const navigation = useDateFilterNavigation({
    currentMonth,
    setCurrentMonth,
    view,
    setView,
    minDate,
    maxDate,
  });

  /**
   * Renders trigger button content with formatted date range
   */
  const renderTriggerContent = () => {
    if (!value) {
      return <span className="text-gray-500">{placeholder}</span>;
    }
    const [start, end] = value;
    if (isSameDay(start, end)) {
      return <span className="text-gray-700 font-medium">{format(start, 'dd MMM yyyy')}</span>;
    }
    return (
      <span className="text-gray-700 font-medium">
        {format(start, 'dd MMM')} - {format(end, 'dd MMM yyyy')}
      </span>
    );
  };

  /**
   * Handles preset selection (Today, Yesterday, Last Week)
   */
  const handlePresetSelect = (start: Date, end: Date) => {
    onChange([start, end]);
    setCurrentMonth(end);
    setView('days');
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded cursor-pointer transition-colors w-full sm:w-[240px] h-[34px]',
            isOpen
              ? 'border-sky-500 ring-2 ring-sky-500/20'
              : 'border-gray-300 hover:border-gray-400',
            className
          )}
        >
          <Icon name="calendar" className="w-4 h-4 text-gray-400" />
          <div className="flex-1 text-xs truncate ml-1">{renderTriggerContent()}</div>

          <Icon
            name="chevron-down"
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform flex-shrink-0',
              isOpen && 'rotate-180'
            )}
          />

          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 -mr-1 hover:bg-gray-100 rounded transition-colors flex items-center justify-center cursor-pointer"
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
            value={value}
            minDate={minDate}
            maxDate={maxDate}
            isDateDisabled={isDateDisabled}
            handleDateClick={handleDateClick}
            isSelected={isSelected}
            isInRange={isInRange}
          />

          <DateFilterPresets onSelect={handlePresetSelect} />
        </div>
      )}
    </Popover>
  );
};
