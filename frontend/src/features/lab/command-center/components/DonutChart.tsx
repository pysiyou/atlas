/**
 * Donut chart and legend primitives for metric panels.
 */

import { cn } from '@/utils';
import {
  COMMAND_CENTER_TEXT,
  type CommandCenterTextTone,
  resolveCommandCenterTextTone,
} from './styles';

export interface DonutSegment {
  value: number;
  colorClass: string;
}

function describeFullDonutRing(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
): string {
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
  endPct: number,
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
}: {
  segments: DonutSegment[];
  size?: number;
  centerLabel: string;
  centerDetail?: string;
  centerTone?: CommandCenterTextTone;
  centerSize?: 'sm' | 'md';
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.62;
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

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {arcs.map((arc, index) => (
          <path key={index} d={arc.d} className={arc.colorClass} />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-1 text-center">
        <span
          className={cn(
            'leading-none tabular-nums',
            centerSize === 'md'
              ? 'text-base font-light'
              : 'text-sm font-light',
            resolveCommandCenterTextTone(centerTone),
          )}
        >
          {centerLabel}
        </span>
        {centerDetail && (
          <span
            className={cn(
              'mt-0.5 leading-none',
              COMMAND_CENTER_TEXT.centerDetail,
              centerSize === 'md' ? 'text-xs' : 'text-xxs',
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
    <div className={cn('flex items-center justify-between gap-2', isMd ? 'text-xs' : 'text-xxs')}>
      <span className={cn('flex min-w-0 items-center gap-1.5 truncate', COMMAND_CENTER_TEXT.label)}>
        <span
          className={cn(
            'shrink-0 rounded-sm',
            swatchClass,
            isMd ? 'h-2 w-2' : 'h-1.5 w-1.5',
          )}
        />
        {label}
      </span>
      <span className="shrink-0 text-right">
        <span
          className={cn(
            'tabular-nums font-light',
            isMd ? 'text-sm' : '',
            resolveCommandCenterTextTone(tone, active),
          )}
        >
          {value}
        </span>
        {detail && (
          <span className={cn('ml-1 tabular-nums', COMMAND_CENTER_TEXT.detail)}>{detail}</span>
        )}
      </span>
    </div>
  );
}

export function StatLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex items-center justify-between gap-2 text-[9px] tabular-nums text-text-tertiary">
      <span>{label}</span>
      <span className="text-text-secondary">{value}</span>
    </p>
  );
}
