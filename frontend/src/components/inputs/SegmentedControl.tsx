/**
 * Segmented single-select control.
 */

import React from 'react';
import { text, CONTROL, RADIUS } from '@/theme/recipes';
import { cn } from '@/utils';

export interface SegmentOption {
  id: string;
  label: React.ReactNode;
}

export type SegmentedControlLayout = 'wrap' | 'scroll';

export interface SegmentedControlProps {
  options: SegmentOption[];
  activeId: string;
  onActiveIdChange: (id: string) => void;
  /** `scroll` — single row with horizontal scroll (panel headers). Default `wrap`. */
  layout?: SegmentedControlLayout;
  className?: string;
}

export function SegmentedControl({
  options,
  activeId,
  onActiveIdChange,
  layout = 'wrap',
  className,
}: SegmentedControlProps) {
  if (options.length === 0) return null;

  const railLayout =
    layout === 'scroll'
      ? 'flex flex-nowrap items-center gap-space-1 max-w-full overflow-x-auto'
      : 'flex flex-wrap items-center gap-space-1';

  return (
    <div
      className={cn(
        `bg-surface-hover p-space-1 ${RADIUS.field}`,
        railLayout,
        className
      )}
    >
      {options.map(opt => {
        const isActive = opt.id === activeId;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onActiveIdChange(opt.id)}
            className={cn(
              `px-space-3 py-space-1-5 ${RADIUS.field} ${text({ role: 'body' })} font-normal cursor-pointer shrink-0 whitespace-nowrap`,
              isActive
                ? `bg-surface text-brand ${CONTROL.segmentActive}`
                : 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover'
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export interface SegmentedControlRowProps {
  options: SegmentOption[];
  activeId: string;
  onActiveIdChange: (id: string) => void;
  trailing?: React.ReactNode;
  className?: string;
}

export function SegmentedControlRow({
  options,
  activeId,
  onActiveIdChange,
  trailing,
  className,
}: SegmentedControlRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-space-2', className)}>
      <SegmentedControl options={options} activeId={activeId} onActiveIdChange={onActiveIdChange} />
      {trailing}
    </div>
  );
}
