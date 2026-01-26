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
import { ICONS } from '@/utils/icon-mappings';
import { useDateFilterState } from '../../hooks/useDateFilterState';
import { useDateFilterNavigation } from '../../hooks/useDateFilterNavigation';
import { DateFilterCalendar } from '../DateFilterCalendar';
import { DateFilterHeader } from '../DateFilterHeader';
import { DateFilterPresets } from '../DateFilterPresets';

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
      return <span className="text-text-muted">{placeholder}</span>;
    }
    const [start, end] = value;
    if (isSameDay(start, end)) {
      return <span className="text-text-secondary font-medium">{format(start, 'dd MMM yyyy')}</span>;
    }
    return (
      <span className="text-text-secondary font-medium">
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
            'flex items-center justify-between gap-2 h-9 px-3 text-xs bg-surface border rounded-md cursor-pointer transition-colors',
            isOpen ? 'border-brand bg-app-bg' : 'border-border-medium hover:bg-app-bg',
            className
          )}
        >
          {/* Column 1: Left Icon */}
          <Icon name={ICONS.dataFields.date} className="w-3.5 h-3.5 text-text-disabled shrink-0" />
          
          {/* Column 2: Content - flexible middle */}
          <div className="flex-1 truncate">{renderTriggerContent()}</div>

          {/* Column 3: Right Icons (clear + chevron) - close icon always reserves space */}
          <div className="flex items-center gap-1 shrink-0">
            {value ? (
              <button
                onClick={handleClear}
                className="p-0.5 hover:bg-neutral-100 rounded transition-colors"
              >
                <Icon name={ICONS.actions.closeCircle} className="w-3.5 h-3.5 text-text-disabled hover:text-text-tertiary" />
              </button>
            ) : (
              <div className="w-4 h-4" />
            )}
            <Icon
              name={ICONS.actions.chevronDown}
              className={cn('w-3.5 h-3.5 text-text-disabled transition-transform', isOpen && 'rotate-180')}
            />
          </div>
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
