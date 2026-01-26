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
import { neutralColors } from '@/shared/design-system/tokens/colors';
import { dropdown } from '@/shared/design-system/tokens/components';
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
      return <span className={neutralColors.text.muted}>{placeholder}</span>;
    }
    const [start, end] = value;
    if (isSameDay(start, end)) {
      return <span className={cn(neutralColors.text.secondary, 'font-medium')}>{format(start, 'dd MMM yyyy')}</span>;
    }
    return (
      <span className={cn(neutralColors.text.secondary, 'font-medium')}>
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
            dropdown.trigger.base,
            isOpen ? dropdown.trigger.open : dropdown.trigger.default,
            className
          )}
        >
          <Icon name={ICONS.dataFields.date} className={dropdown.icon} />
          <div className={dropdown.content}>{renderTriggerContent()}</div>

          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(dropdown.chevron, isOpen && 'rotate-180')}
          />

          {value && (
            <button
              onClick={handleClear}
              className={dropdown.clearButton}
            >
              <Icon name={ICONS.actions.closeCircle} className={dropdown.clearIcon} />
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
