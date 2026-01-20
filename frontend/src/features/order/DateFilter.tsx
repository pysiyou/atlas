import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isWithinInterval,
  addMonths,
  subMonths,
  subDays,
  setYear,
  addYears,
  subYears,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  eachYearOfInterval,
  isBefore,
  isAfter,
  startOfDay
} from 'date-fns';
import { Icon } from '@/shared/ui/Icon';
import { Popover } from '@/shared/ui/Popover';
import { cn } from '@/utils';
import { DATE_RANGE_CONFIG } from '@/config';

interface DateFilterProps {
  value: [Date, Date] | null;
  onChange: (value: [Date, Date] | null) => void;
  placeholder?: string;
  className?: string;
}

type CalendarView = 'days' | 'months' | 'years';

export const DateFilter: React.FC<DateFilterProps> = ({
  value,
  onChange,
  placeholder = 'Filter by Date',
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<CalendarView>('days');

  // Calculate date limits from config
  const today = new Date();
  const minDate = subYears(startOfDay(today), DATE_RANGE_CONFIG.maxYearsBack);
  const maxDate = addYears(endOfYear(today), DATE_RANGE_CONFIG.maxYearsForward);

  // Days View Helpers
  const generateDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    return eachDayOfInterval({
      start: startDate,
      end: endDate
    });
  };

  // Months View Helpers
  const generateMonths = () => {
    const yearStart = startOfYear(currentMonth);
    const yearEnd = endOfYear(currentMonth);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  };

  // Years View Helpers
  const generateYears = () => {
    // Show a 12-year window centered roughly around current year
    const start = subYears(currentMonth, 6);
    const end = addYears(currentMonth, 5);
    return eachYearOfInterval({ start, end });
  };

  const isDateDisabled = (date: Date) => {
      // Comparison at start of day level
      return isBefore(date, minDate) || isAfter(date, maxDate); 
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (!value) {
      onChange([date, date]);
    } else {
      const [start, end] = value;
      if (isSameDay(start, end)) {
        if (date < start) {
          onChange([date, start]);
        } else {
          onChange([start, date]);
        }
      } else {
        onChange([date, date]);
      }
    }
  };

  const isSelected = (date: Date) => {
    if (!value) return false;
    const [start, end] = value;
    return isSameDay(date, start) || isSameDay(date, end);
  };

  const isInRange = (date: Date) => {
    if (!value) return false;
    const [start, end] = value;
    return isWithinInterval(date, { start, end });
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handlePrevClick = () => {
    if (view === 'days') {
        const prevMonth = subMonths(currentMonth, 1);
        if (isBefore(endOfMonth(prevMonth), minDate)) return; 
        setCurrentMonth(prevMonth);
    }
    if (view === 'months') {
        const prevYear = subYears(currentMonth, 1);
        if (prevYear.getFullYear() < minDate.getFullYear()) return;
        setCurrentMonth(prevYear);
    } 
    if (view === 'years') {
        const prevPageStart = subYears(currentMonth, 12); 
        if (prevPageStart.getFullYear() + 5 < minDate.getFullYear()) return; 
        setCurrentMonth(subYears(currentMonth, 12));
    }
  };

  const handleNextClick = () => {
    if (view === 'days') {
        const nextMonth = addMonths(currentMonth, 1);
        if (isAfter(startOfMonth(nextMonth), maxDate)) return;
        setCurrentMonth(nextMonth);
    }
    if (view === 'months') {
         const nextYear = addYears(currentMonth, 1);
         if (nextYear.getFullYear() > maxDate.getFullYear()) return;
         setCurrentMonth(nextYear);
    }
    if (view === 'years') {
        const nextPageEnd = addYears(currentMonth, 12); // Approximate check
         // Prevent if next page starts after maxDate (simplified)
        if (nextPageEnd.getFullYear() - 5 > maxDate.getFullYear()) return;
        setCurrentMonth(addYears(currentMonth, 12));
    }
  };

  const handleTitleClick = () => {
    if (view === 'days') setView('months');
    if (view === 'months') setView('years');
  };

  const renderHeader = () => {
    let title = '';
    if (view === 'days') title = format(currentMonth, 'MMMM yyyy');
    if (view === 'months') title = format(currentMonth, 'yyyy');
    if (view === 'years') {
      const years = generateYears();
      title = `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
    }

    // Determine if prev/next should be disabled based on minDate/maxDate
    let isPrevDisabled = false;
    let isNextDisabled = false;

    if (view === 'days') {
        isPrevDisabled = isBefore(endOfMonth(subMonths(currentMonth, 1)), minDate);
        isNextDisabled = isAfter(startOfMonth(addMonths(currentMonth, 1)), maxDate);
    }
    else if (view === 'months') {
         isPrevDisabled = (currentMonth.getFullYear() - 1) < minDate.getFullYear();
         isNextDisabled = (currentMonth.getFullYear() + 1) > maxDate.getFullYear();
    }
    else if (view === 'years') {
        const years = generateYears();
        isPrevDisabled = (years[0].getFullYear() - 12) < minDate.getFullYear() - 10; 
        isNextDisabled = (years[years.length-1].getFullYear() + 12) > maxDate.getFullYear() + 10;
    }


    return (
      <div className="flex items-center justify-between mb-3">
        <button 
            onClick={handlePrevClick}
            disabled={isPrevDisabled}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        >
            <Icon name="chevron-left" className="w-4 h-4" />
        </button>
        <button 
          onClick={handleTitleClick}
          className={cn(
            "text-sm font-semibold text-gray-700 hover:bg-gray-50 px-2 py-1 rounded transition-colors",
            view === 'years' && "pointer-events-none hover:bg-transparent"
          )}
        >
            {title}
        </button>
        <button 
            onClick={handleNextClick}
            disabled={isNextDisabled}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
        >
            <Icon name="chevron-right" className="w-4 h-4" />
        </button>
      </div>
    );
  };

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

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded cursor-pointer transition-colors w-full h-[34px]",
            isOpen
              ? "border-sky-500 ring-2 ring-sky-500/20"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
        >
            <Icon name="calendar" className="w-4 h-4 text-gray-400" />
            <div className="flex-1 text-xs truncate ml-1">{renderTriggerContent()}</div>
            
            <Icon
                name="chevron-down"
                className={cn(
                "w-4 h-4 text-gray-400 transition-transform flex-shrink-0",
                isOpen && "rotate-180"
                )}
            />

            {value && (
                <button
                onClick={handleClear}
                className="p-0.5 -mr-1 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                >
                <Icon name="close" className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                </button>
            )}
        </div>
      )}
      className="p-0 w-[280px]"
    >
      {() => (
        <div className="p-3">
          {renderHeader()}

          {view === 'days' && (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-center text-xs text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateDays().map(day => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
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
                                "h-8 w-8 text-xs rounded-full flex items-center justify-center transition-colors relative",
                                disabled && "opacity-30 cursor-not-allowed",
                                !isCurrentMonth && "text-gray-300",
                                isCurrentMonth && !selected && !inRange && !disabled && "text-gray-700 hover:bg-gray-100",
                                // Highlight today if not selected/in-range
                                isToday && !selected && !inRange && !disabled && "font-bold text-sky-600 bg-sky-50",
                                inRange && !selected && "bg-sky-50 text-sky-700 rounded-none",
                                // Start/End of range rounded styles
                                value && isSameDay(day, value[0]) && !isSameDay(value[0], value[1]) && "rounded-l-full rounded-r-none",
                                value && isSameDay(day, value[1]) && !isSameDay(value[0], value[1]) && "rounded-r-full rounded-l-none",
                                selected && "bg-sky-500 text-white hover:bg-sky-600 z-10"
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
              </div>
            </>
          )}

          {view === 'months' && (
            <div className="grid grid-cols-3 gap-2">
              {generateMonths().map(month => {
                  const endOfM = endOfMonth(month);
                  const disabled = isBefore(endOfM, minDate) || isAfter(month, maxDate);
                  return (
                    <button
                    key={month.toISOString()}
                    onClick={() => {
                        if (disabled) return;
                        setCurrentMonth(month);
                        setView('days');
                    }}
                    disabled={disabled}
                    className={cn(
                        "h-10 text-sm rounded flex items-center justify-center transition-colors",
                         disabled && "opacity-30 cursor-not-allowed",
                        !disabled && isSameMonth(month, new Date()) && "text-sky-600 font-bold bg-sky-50",
                        !disabled && isSameMonth(month, currentMonth) ? "bg-sky-100 text-sky-700" : "hover:bg-gray-100 text-gray-700",
                        !disabled && "hover:bg-gray-100"
                    )}
                    >
                    {format(month, 'MMM')}
                    </button>
                  );
              })}
            </div>
          )}

          {view === 'years' && (
            <div className="grid grid-cols-3 gap-2">
              {generateYears().map(year => {
                  const y = year.getFullYear();
                  const disabled = y < minDate.getFullYear() || y > maxDate.getFullYear();
                  return (
                    <button
                        key={year.toISOString()}
                        onClick={() => {
                            if (disabled) return;
                            setCurrentMonth(setYear(currentMonth, year.getFullYear()));
                            setView('months');
                        }}
                        disabled={disabled}
                        className={cn(
                            "h-10 text-sm rounded flex items-center justify-center transition-colors",
                            disabled && "opacity-30 cursor-not-allowed",
                            !disabled && year.getFullYear() === new Date().getFullYear() && "text-sky-600 font-bold bg-sky-50",
                            !disabled && year.getFullYear() === currentMonth.getFullYear() ? "bg-sky-100 text-sky-700" : "hover:bg-gray-100 text-gray-700",
                            !disabled && "hover:bg-gray-100"
                        )}
                    >
                        {format(year, 'yyyy')}
                    </button>
                  );
              })}
            </div>
          )}

          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
             <button
               onClick={() => {
                 const today = new Date();
                 onChange([today, today]);
                 setCurrentMonth(today);
                 setView('days');
               }}
               className="hover:text-sky-600 font-medium px-1 py-0.5 rounded hover:bg-sky-50 transition-colors"
             >
               Today
             </button>
             <button
               onClick={() => {
                 const yesterday = subDays(new Date(), 1);
                 onChange([yesterday, yesterday]);
                 setCurrentMonth(yesterday);
                 setView('days');
               }}
               className="hover:text-sky-600 font-medium px-1 py-0.5 rounded hover:bg-sky-50 transition-colors"
             >
               Yesterday
             </button>
             <button
               onClick={() => {
                 const today = new Date();
                 const lastWeek = subDays(today, 6);
                 onChange([lastWeek, today]);
                 setCurrentMonth(today);
                 setView('days');
               }}
               className="hover:text-sky-600 font-medium px-1 py-0.5 rounded hover:bg-sky-50 transition-colors"
             >
               Last Week
             </button>
          </div>
        </div>
      )}
    </Popover>
  );
};
