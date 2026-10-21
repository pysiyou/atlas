import type { ReactNode } from 'react';
import { Badge } from '@/components/primitives';
import { CONTROL } from '@/theme/recipes';
import { cn } from '@/utils';
import { getStageVisual, isLabWorkflowStageTab, type LabTabId } from '../constants/labConstants';
import { SEGMENT_TABS } from '@/theme/recipes';

export interface LaboratoryPageTabDef {
  id: LabTabId;
  label: string;
  icon: ReactNode;
  count?: number;
}

export interface LaboratoryPageTabRailProps {
  tabs: LaboratoryPageTabDef[];
  activeTab: LabTabId;
  onTabChange: (tab: LabTabId) => void;
}

export function LaboratoryPageTabRail({
  tabs,
  activeTab,
  onTabChange,
}: LaboratoryPageTabRailProps) {
  return (
    <div className={SEGMENT_TABS.rail}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const hasCount = typeof tab.count === 'number' && tab.count > 0;
        const stageVisual = isLabWorkflowStageTab(tab.id) ? getStageVisual(tab.id) : null;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              SEGMENT_TABS.buttonBase,
              isActive
                ? stageVisual
                  ? `bg-surface ${stageVisual.text} ${CONTROL.segmentActive}`
                  : SEGMENT_TABS.buttonActive
                : SEGMENT_TABS.buttonInactive,
            )}
          >
            <div
              className={cn(
                'flex items-center',
                isActive
                  ? stageVisual
                    ? stageVisual.text
                    : SEGMENT_TABS.iconActive
                  : SEGMENT_TABS.iconInactive,
              )}
            >
              {tab.icon}
            </div>
            {tab.label}
            {hasCount && (
              <Badge
                variant={isActive ? 'primary' : 'default'}
                size="xs"
                className={SEGMENT_TABS.countBadgeMargin}
              >
                {tab.count}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
