import type { ReactNode } from 'react';
import { Badge } from '@/components';
import { CONTROL } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { getStageVisual, isLabWorkflowStageTab, type LabTabId } from '../constants/labConstants';
import { LAB_PAGE_TABS } from '../utils/labStyles';

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
    <div className={LAB_PAGE_TABS.rail}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const hasCount = typeof tab.count === 'number' && tab.count > 0;
        const stageVisual = isLabWorkflowStageTab(tab.id) ? getStageVisual(tab.id) : null;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              LAB_PAGE_TABS.buttonBase,
              isActive
                ? stageVisual
                  ? `bg-surface ${stageVisual.text} ${CONTROL.segmentActive}`
                  : LAB_PAGE_TABS.buttonActive
                : LAB_PAGE_TABS.buttonInactive,
            )}
          >
            <div
              className={cn(
                'flex items-center',
                isActive
                  ? stageVisual
                    ? stageVisual.text
                    : LAB_PAGE_TABS.iconActive
                  : LAB_PAGE_TABS.iconInactive,
              )}
            >
              {tab.icon}
            </div>
            {tab.label}
            {hasCount && (
              <Badge
                variant={isActive ? 'primary' : 'default'}
                size="xs"
                className={LAB_PAGE_TABS.countBadgeMargin}
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
