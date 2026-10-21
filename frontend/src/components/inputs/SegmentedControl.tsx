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

export interface SegmentedControlProps {
  options: SegmentOption[];
  activeId: string;
  onActiveIdChange: (id: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  activeId,
  onActiveIdChange,
  className,
}: SegmentedControlProps) {
  if (options.length === 0) return null;

  return (
    <div
      className={cn(
        `bg-surface-hover p-space-1 ${RADIUS.field} flex flex-wrap items-center gap-space-1`,
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
            className={
              isActive
                ? `px-space-3 py-space-1-5 ${RADIUS.field} ${text({ role: 'body' })} font-normal cursor-pointer bg-surface text-brand ${CONTROL.segmentActive}`
                : `px-space-3 py-space-1-5 ${RADIUS.field} ${text({ role: 'body' })} font-normal cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-surface-hover`
            }
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
