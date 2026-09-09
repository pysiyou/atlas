/**
 * KPI tile with optional completion ring and link.
 */

import { Link } from 'react-router-dom';
import { Icon, type IconName } from '@/components';
import { cn } from '@/utils';
import {
  COMMAND_CENTER_KPI,
  COMMAND_CENTER_KPI_RING_TONE,
  COMMAND_CENTER_KPI_TONE_ICON,
  COMMAND_CENTER_KPI_TONE_VALUE,
  type CommandCenterKpiTone,
} from './styles';

function CompletionRing({
  value,
  tone = 'success',
  size = 36,
}: {
  value: number;
  tone?: CommandCenterKpiTone;
  size?: number;
}) {
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className={COMMAND_CENTER_KPI.ringTrack}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        className={cn('transition-all duration-500', COMMAND_CENTER_KPI_RING_TONE[tone])}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function KpiTile({
  icon,
  label,
  value,
  tone = 'neutral',
  denominator,
  ringValue,
  to,
}: {
  icon: IconName;
  label: string;
  value: number;
  tone?: CommandCenterKpiTone;
  denominator: number;
  ringValue: number;
  to?: string;
}) {
  const body = (
    <div className={cn(COMMAND_CENTER_KPI.tile, to && COMMAND_CENTER_KPI.tileInteractive)}>
      <div className={COMMAND_CENTER_KPI.iconWrap}>
        <Icon name={icon} className={cn('h-4 w-4', COMMAND_CENTER_KPI_TONE_ICON[tone])} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={COMMAND_CENTER_KPI.label}>{label}</p>
        <div className="flex min-w-0 items-baseline gap-1">
          <p className={cn(COMMAND_CENTER_KPI.value, COMMAND_CENTER_KPI_TONE_VALUE[tone])}>{value}</p>
          <span className={COMMAND_CENTER_KPI.context}>on {denominator}</span>
        </div>
      </div>
      <CompletionRing value={ringValue} tone={tone} />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className={COMMAND_CENTER_KPI.tileLink}>
        {body}
      </Link>
    );
  }

  return <div className={COMMAND_CENTER_KPI.tileWrap}>{body}</div>;
}
