/**
 * Command center — full-screen lab operations dashboard.
 */

import React from 'react';
import { ActivityFeedPanel } from './ActivityFeedPanel';
import { CatalogVolumePanel } from './CatalogVolumePanel';
import { DelayImpactPanel } from './DelayImpactPanel';
import { DeliverySlaPanel } from './DeliverySlaPanel';
import { StageTimingPanel } from './StageTimingPanel';
import { TestFlowPanel } from './TestFlowPanel';
import { TurnaroundTimePanel } from './TurnaroundTimePanel';
import { COMMAND_CENTER_PANEL } from './components';
import { CommandCenterDashboardProvider } from './useCommandCenterDashboard';

export const CommandCenterPage: React.FC = () => {
  return (
    <CommandCenterDashboardProvider>
      <div className={COMMAND_CENTER_PANEL.page}>
        <div
          className="grid h-full min-h-0 auto-rows-fr grid-cols-1 gap-2 lg:grid-cols-12 lg:[grid-template-rows:minmax(0,2fr)_minmax(0,1.5fr)_minmax(0,1.5fr)]"
        >
          <div className="min-h-[280px] lg:col-span-8 lg:row-start-1 lg:min-h-0">
            <TestFlowPanel />
          </div>

          <div className="min-h-[320px] overflow-hidden lg:col-span-4 lg:row-start-1 lg:min-h-0">
            <CatalogVolumePanel />
          </div>

          <div className="h-full min-h-[240px] overflow-hidden lg:col-span-4 lg:row-start-2 lg:min-h-0">
            <StageTimingPanel />
          </div>

          <div className="h-full min-h-[240px] overflow-hidden lg:col-span-4 lg:row-start-2 lg:min-h-0">
            <DelayImpactPanel />
          </div>

          <div className="h-full min-h-[480px] overflow-hidden lg:col-span-4 lg:row-span-2 lg:row-start-2 lg:min-h-0">
            <ActivityFeedPanel />
          </div>

          <div className="h-full min-h-[240px] overflow-hidden lg:col-span-4 lg:row-start-3 lg:min-h-0">
            <TurnaroundTimePanel />
          </div>

          <div className="h-full min-h-[240px] overflow-hidden lg:col-span-4 lg:row-start-3 lg:min-h-0">
            <DeliverySlaPanel />
          </div>
        </div>
      </div>
    </CommandCenterDashboardProvider>
  );
};
