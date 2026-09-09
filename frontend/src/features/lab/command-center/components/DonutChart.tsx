/**
 * Donut chart and legend primitives for metric panels.
 */

import { cn } from '@/utils';

export interface DonutSegment {
  value: number;
  colorClass: string;
}

function describeDonutArc(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startPct: number,
  endPct: number,
): string {
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
  centerTone = 'text-text-primary',
}: {
  segments: DonutSegment[];
  size?: number;
  centerLabel: string;
  centerDetail?: string;
  centerTone?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.62;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  let cursor = 0;

  const arcs =
    total > 0
      ? segments.map(segment => {
          const start = cursor;
          const end = cursor + segment.value / total;
          cursor = end;
          return {
            d: describeDonutArc(cx, cy, outerR, innerR, start, end),
            colorClass: segment.colorClass,
          };
        })
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
        <span className={cn('text-sm font-semibold leading-none tabular-nums', centerTone)}>
          {centerLabel}
        </span>
        {centerDetail && (
          <span className="mt-0.5 text-[9px] leading-none text-text-tertiary">{centerDetail}</span>
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
  valueTone = 'text-text-primary',
}: {
  colorClass: string;
  label: string;
  value: string;
  detail?: string;
  valueTone?: string;
}) {
  const swatchClass = colorClass.replace('fill-', 'bg-');

  return (
    <div className="flex items-center justify-between gap-2 text-xxs">
      <span className="flex min-w-0 items-center gap-1.5 truncate text-text-secondary">
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-sm', swatchClass)} />
        {label}
      </span>
      <span className="shrink-0 text-right">
        <span className={cn('tabular-nums font-medium', valueTone)}>{value}</span>
        {detail && <span className="ml-1 tabular-nums text-text-tertiary">{detail}</span>}
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

export function ColumnHeader({ title }: { title: string }) {
  return (
    <p className="text-[9px] font-medium uppercase tracking-wide text-text-tertiary">{title}</p>
  );
}

export const DELTA_TONE_CLASS = {
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
} as const;

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)}h`;
}
