/**
 * Prev / title / next chrome shared by DateInput and DatePicker calendars.
 */

import { format } from 'date-fns';
import { Icon } from '@/components/primitives';
import { IconKeys } from '@/config/icons';
import { text, RADIUS } from '@/theme/recipes';
import { generateCalendarYears } from '@/utils/date';
import type { CalendarView } from './calendarTypes';

/**
 * Prev / title / next chrome shared by DateInput and DatePicker calendars.
 *
 * @param currentMonth - Month the title represents
 * @param view - Days, months, or years grid
 */
export function CalendarHeader({
  currentMonth,
  view,
  onPrevClick,
  onNextClick,
  onTitleClick,
  isPrevDisabled = false,
  isNextDisabled = false,
}: {
  currentMonth: Date;
  view: CalendarView;
  onPrevClick: () => void;
  onNextClick: () => void;
  onTitleClick: () => void;
  isPrevDisabled?: boolean;
  isNextDisabled?: boolean;
}) {
  const title =
    view === 'days'
      ? format(currentMonth, 'MMMM yyyy')
      : view === 'months'
        ? format(currentMonth, 'yyyy')
        : (() => {
            const years = generateCalendarYears(currentMonth);
            return `${format(years[0], 'yyyy')} - ${format(years[years.length - 1], 'yyyy')}`;
          })();

  return (
    <div className="flex items-center justify-between mb-space-3">
      <button
        type="button"
        onClick={onPrevClick}
        disabled={isPrevDisabled}
        className={`p-space-1 hover:bg-surface-hover ${RADIUS.field} text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center`}
      >
        <Icon iconKey={IconKeys.actions.chevronLeft} className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onTitleClick}
        className={`${text({ role: 'amount' })} text-text-secondary hover:bg-surface-page px-space-2 py-space-1 ${RADIUS.field} transition-colors cursor-pointer`}
      >
        {title}
      </button>
      <button
        type="button"
        onClick={onNextClick}
        disabled={isNextDisabled}
        className={`p-space-1 hover:bg-surface-hover ${RADIUS.field} text-text-tertiary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center`}
      >
        <Icon iconKey={IconKeys.actions.chevronRight} className="w-4 h-4" />
      </button>
    </div>
  );
}
