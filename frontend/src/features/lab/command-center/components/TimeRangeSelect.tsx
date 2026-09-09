/**
 * Time range selector for command center panels.
 */

import { Icon } from '@/components/primitives/Icon';
import { ICONS } from '@/config/icons';
import type { CommandCenterTimeRange } from '../timeRange';
import { TIME_RANGE_OPTIONS } from '../timeRange';
import { COMMAND_CENTER_SELECT } from './styles';

export function TimeRangeSelect({
  value,
  onChange,
  ariaLabel = 'Time range',
}: {
  value: CommandCenterTimeRange;
  onChange: (range: CommandCenterTimeRange) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="relative ml-auto shrink-0">
      <select
        value={value}
        onChange={event => onChange(event.target.value as CommandCenterTimeRange)}
        className={COMMAND_CENTER_SELECT.base}
        aria-label={ariaLabel}
      >
        {TIME_RANGE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name={ICONS.actions.chevronDown} className={COMMAND_CENTER_SELECT.chevron} aria-hidden />
    </div>
  );
}
