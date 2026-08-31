/**
 * Calendar header navigation for DateInput.
 */

import { format } from 'date-fns';
import { Icon } from '@/components';
import { ICONS } from '@/utils';
import { generateCalendarYears } from '@/utils/date';
import type { DateInputCalendarView } from './DateInputCalendarGrid';

export function DateInputHeader({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
}: {
  currentMonth: Date;
  view: DateInputCalendarView;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
}) {
  const getTitle = (): string => {
    if (view === 'days') return format(currentMonth, 'MMMM yyyy');
    if (view === 'months') return format(currentMonth, 'yyyy');
    const years = generateCalendarYears(currentMonth);
    return `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
  };
  return (
    <div className="flex items-center justify-between mb-3">
      <button type="button" onClick={onPrevClick} className="p-1 hover:bg-neutral-100 rounded text-text-tertiary cursor-pointer flex items-center justify-center">
        <Icon name={ICONS.actions.chevronLeft} className="w-4 h-4" />
      </button>
      <button type="button" onClick={onTitleClick} className="text-sm font-normal text-text-secondary hover:bg-surface-page px-2 py-1 rounded transition-colors cursor-pointer">
        {getTitle()}
      </button>
      <button type="button" onClick={onNextClick} className="p-1 hover:bg-neutral-100 rounded text-text-tertiary cursor-pointer flex items-center justify-center">
        <Icon name={ICONS.actions.chevronRight} className="w-4 h-4" />
      </button>
    </div>
  );
}
