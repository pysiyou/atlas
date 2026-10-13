/**
 * Segmented tabs for panel headerEnd (order test samples, collection requirements, etc.).
 */

import React from 'react';
import { CONTROL, RADIUS, TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';

export interface PanelHeaderSegmentTab {
  id: string;
  label: React.ReactNode;
}

interface PanelHeaderSegmentTabsProps {
  tabs: PanelHeaderSegmentTab[];
  activeId: string;
  onTabChange: (id: string) => void;
  className?: string;
}

export function PanelHeaderSegmentTabs({
  tabs,
  activeId,
  onTabChange,
  className,
}: PanelHeaderSegmentTabsProps) {
  if (tabs.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        `bg-surface-hover p-space-1 ${RADIUS.field} flex flex-wrap items-center gap-space-1`,
        className
      )}
    >
      {tabs.map(tab => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={
              isActive
                ? `px-space-3 py-space-1-5 ${RADIUS.field} ${TYPE.value} font-normal cursor-pointer bg-surface text-brand ${CONTROL.segmentActive}`
                : `px-space-3 py-space-1-5 ${RADIUS.field} ${TYPE.value} font-normal cursor-pointer text-text-tertiary hover:text-text-primary hover:bg-surface-hover`
            }
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

interface PanelHeaderSegmentRowProps {
  tabs: PanelHeaderSegmentTab[];
  activeId: string;
  onTabChange: (id: string) => void;
  trailing?: React.ReactNode;
  className?: string;
}

/** Segment control plus optional actions (e.g. View) in panel headerEnd. */
export function PanelHeaderSegmentRow({
  tabs,
  activeId,
  onTabChange,
  trailing,
  className,
}: PanelHeaderSegmentRowProps) {
  return (
    <div className={cn('flex flex-wrap items-center justify-end gap-space-2', className)}>
      <PanelHeaderSegmentTabs tabs={tabs} activeId={activeId} onTabChange={onTabChange} />
      {trailing}
    </div>
  );
}
