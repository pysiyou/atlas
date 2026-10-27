import type { ReactNode } from 'react';
import { Badge } from '@/components/primitives';
import { cn } from '@/utils';
import type { LabTabId } from '../constants/labConstants';
import { SEGMENTED_CONTROL } from '@/theme/recipes';

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
    <div className={SEGMENTED_CONTROL.rail}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        const hasCount = typeof tab.count === 'number' && tab.count > 0;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              SEGMENTED_CONTROL.buttonBase,
              isActive ? SEGMENTED_CONTROL.buttonActive : SEGMENTED_CONTROL.buttonInactive,
            )}
          >
            <div
              className={cn(
                'flex items-center',
                isActive ? SEGMENTED_CONTROL.iconActive : SEGMENTED_CONTROL.iconInactive,
              )}
            >
              {tab.icon}
            </div>
            {tab.label}
            {hasCount && (
              <Badge
                variant={isActive ? 'primary' : 'default'}
                size="xs"
                className={SEGMENTED_CONTROL.countBadgeMargin}
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
