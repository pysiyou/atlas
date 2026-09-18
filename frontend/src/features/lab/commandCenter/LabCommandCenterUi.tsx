/**
 * Command center UI primitives — section title, KPI tile, donut chart, legend.
 */

import { Link } from 'react-router-dom';
import { RADIUS } from '@/components/theme/recipes';
import { Icon, type IconName } from '@/components';
import { cn } from '@/utils';
import {
  COMMAND_CENTER_KPI,
  COMMAND_CENTER_KPI_RING_TONE,
  COMMAND_CENTER_KPI_TONE_ICON,
  COMMAND_CENTER_KPI_TONE_VALUE,
  COMMAND_CENTER_SECTION,
  COMMAND_CENTER_TEXT,
  resolveCommandCenterTextTone,
  type CommandCenterKpiTone,
  type CommandCenterTextTone,
} from './commandCenterStyles';

export function SectionTitle({
  title,
  aside,
  className,
}: {
  title: string;
  aside?: string;
  className?: string;
}) {
  if (!aside) {
    return <p className={cn(COMMAND_CENTER_SECTION.title, className)}>{title}</p>;
  }

  return (
    <div className={cn('flex items-baseline justify-between gap-space-2', className)}>
      <p className={COMMAND_CENTER_SECTION.title}>{title}</p>
      <span className={COMMAND_CENTER_SECTION.aside}>{aside}</span>
    </div>
  );
}

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
        <div className="flex min-w-0 items-baseline gap-space-1">
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

export interface DonutSegment {
  value: number;
  colorClass: string;
}

function describeFullDonutRing(cx: number, cy: number, outerR: number, innerR: number): string {
  return [
    `M ${cx + outerR} ${cy}`,
    `A ${outerR} ${outerR} 0 1 1 ${cx - outerR} ${cy}`,
    `A ${outerR} ${outerR} 0 1 1 ${cx + outerR} ${cy}`,
    `M ${cx + innerR} ${cy}`,
    `A ${innerR} ${innerR} 0 1 0 ${cx - innerR} ${cy}`,
    `A ${innerR} ${innerR} 0 1 0 ${cx + innerR} ${cy}`,
    'Z',
  ].join(' ');
}

function describeDonutArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startPct: number,
  endPct: number
): string {
  const span = endPct - startPct;
  if (span >= 0.9999) {
    return describeFullDonutRing(cx, cy, outerR, innerR);
  }
  if (span <= 0) {
    return '';
  }

  const startAngle = startPct * 2 * Math.PI - Math.PI / 2;
  const endAngle = endPct * 2 * Math.PI - Math.PI / 2;
  const x1 = cx + outerR * Math.cos(startAngle);
  const y1 = cy + outerR * Math.sin(startAngle);
  const x2 = cx + outerR * Math.cos(endAngle);
  const y2 = cy + outerR * Math.sin(endAngle);
  const x3 = cx + innerR * Math.cos(endAngle);
  const y3 = cy + innerR * Math.sin(endAngle);
  const x4 = cx + innerR * Math.cos(startAngle);
  const y4 = cy + innerR * Math.sin(startAngle);
  const largeArc = endPct - startPct > 0.5 ? 1 : 0;

  return [
    `M ${x1} ${y1}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z',
  ].join(' ');
}

export function DonutChart({
  segments,
  size = 80,
  centerLabel,
  centerDetail,
  centerTone = 'default',
  centerSize = 'sm',
  ariaLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  centerLabel: string;
  centerDetail?: string;
  centerTone?: CommandCenterTextTone;
  centerSize?: 'sm' | 'md';
  ariaLabel?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.8;
  const activeSegments = segments.filter(segment => segment.value > 0);
  const total = activeSegments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;

  const arcs =
    total > 0
      ? activeSegments
          .map(segment => {
            const start = cursor;
            const end = cursor + segment.value / total;
            cursor = end;
            const d = describeDonutArc(cx, cy, outerR, innerR, start, end);
            return d
              ? {
                  d,
                  colorClass: segment.colorClass,
                }
              : null;
          })
          .filter((arc): arc is { d: string; colorClass: string } => arc !== null)
      : [
          {
            d: describeDonutArc(cx, cy, outerR, innerR, 0, 1),
            colorClass: 'fill-surface-hover',
          },
        ];

  const fallbackLabel = [centerLabel, centerDetail].filter(Boolean).join(' ');

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel ?? fallbackLabel}
      >
        {arcs.map((arc, index) => (
          <path key={index} d={arc.d} className={arc.colorClass} />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-space-1 text-center">
        <span
          className={cn(
            'leading-none tabular-nums',
            centerSize === 'md' ? 'text-base font-light' : 'text-sm font-light',
            resolveCommandCenterTextTone(centerTone)
          )}
        >
          {centerLabel}
        </span>
        {centerDetail && (
          <span
            className={cn(
              'mt-space-0-5 leading-none',
              COMMAND_CENTER_TEXT.centerDetail,
              centerSize === 'md' ? 'text-xs' : 'text-xxs'
            )}
          >
            {centerDetail}
          </span>
        )}
      </div>
    </div>
  );
}

export function LegendRow({
  colorClass,
  label,
  value,
  detail,
  tone = 'default',
  active = true,
  size = 'sm',
}: {
  colorClass: string;
  label: string;
  value: string;
  detail?: string;
  tone?: CommandCenterTextTone;
  active?: boolean;
  size?: 'sm' | 'md';
}) {
  const swatchClass = colorClass.replace('fill-', 'bg-');
  const isMd = size === 'md';

  return (
    <div className={cn('flex items-center justify-between gap-space-2', isMd ? 'text-xs' : 'text-xxs')}>
      <span className={cn('flex min-w-0 items-center gap-space-1-5 truncate', COMMAND_CENTER_TEXT.label)}>
        <span
          className={cn(`shrink-0 ${RADIUS.field}`, swatchClass, isMd ? 'h-2 w-2' : 'h-1.5 w-1.5')}
        />
        {label}
      </span>
      <span className="shrink-0 text-right">
        <span
          className={cn(
            'tabular-nums font-light',
            isMd ? 'text-sm' : '',
            resolveCommandCenterTextTone(tone, active)
          )}
        >
          {value}
        </span>
        {detail && (
          <span className={cn('ml-space-1 tabular-nums', COMMAND_CENTER_TEXT.detail)}>{detail}</span>
        )}
      </span>
    </div>
  );
}
