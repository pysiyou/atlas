/**
 * Dense board primitives — timeline-scale type, no-scroll charts.
 */

import type { ReactNode } from 'react';
import { cn } from '@/utils';
import { COMMAND_CENTER_SECTION, COMMAND_CENTER_TEXT, resolveCommandCenterTextTone, type CommandCenterTextTone } from '../components/styles';

export function InfoRow({
  label,
  value,
  tone = 'default',
  active = true,
}: {
  label: string;
  value: string | number;
  tone?: CommandCenterTextTone;
  active?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={cn('min-w-0 truncate text-xs', COMMAND_CENTER_TEXT.label)}>{label}</span>
      <span
        className={cn(
          'shrink-0 text-sm font-light tabular-nums',
          resolveCommandCenterTextTone(tone, active),
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function StackedBar({
  segments,
}: {
  segments: Array<{ value: number; className: string }>;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const activeSegments = segments
    .map((segment, index) => ({ ...segment, index }))
    .filter(segment => segment.value > 0);

  return (
    <div className="flex h-1 w-full overflow-hidden rounded-xs bg-surface-hover">
      {total === 0 ? (
        <div className="h-full w-full rounded-xs bg-border-subtle" />
      ) : (
        activeSegments.map((segment, activeIndex) => {
          const isFirst = activeIndex === 0;
          const isLast = activeIndex === activeSegments.length - 1;

          return (
            <div
              key={segment.index}
              className={cn(
                'h-full min-w-0',
                segment.className,
                isFirst && isLast && 'rounded-xs',
                isFirst && !isLast && 'rounded-l-xs',
                !isFirst && isLast && 'rounded-r-xs',
              )}
              style={{ width: `${(segment.value / total) * 100}%` }}
            />
          );
        })
      )}
    </div>
  );
}

export function LegendDot({
  colorClass,
  label,
  value,
}: {
  colorClass: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={cn('flex min-w-0 items-center gap-1.5 truncate text-xs', COMMAND_CENTER_TEXT.label)}>
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-sm', colorClass)} />
        {label}
      </span>
      <span className={cn('shrink-0 text-sm font-light tabular-nums', COMMAND_CENTER_TEXT.value)}>{value}</span>
    </div>
  );
}

export function PanelNote({ children }: { children: ReactNode }) {
  return <p className={COMMAND_CENTER_SECTION.summary}>{children}</p>;
}

export function MetricCell({
  label,
  value,
  tone = 'default',
  active = true,
}: {
  label: string;
  value: string | number;
  tone?: CommandCenterTextTone;
  active?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className={cn('text-xs', COMMAND_CENTER_TEXT.label)}>{label}</p>
      <p className={cn('text-sm font-light tabular-nums', resolveCommandCenterTextTone(tone, active))}>
        {value}
      </p>
    </div>
  );
}
