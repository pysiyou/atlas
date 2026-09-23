/**
 * Today — average time per workflow step (today's accessions).
 */
import React from 'react';
import { EmptyState, EMPTY_COPY, DASHBOARD_EMPTY_STATE_TEXT } from '@/components';
import { Panel } from '@/components/surfaces/Panel';
import { labStageLabel } from '../../constants/labConstants';
import type { LabPipelineStage, LabTodayPanelSnapshot } from '../commandCenterModel';
import { TODAY_PANEL } from '../dashboardStyles';
import { LabDashboardTodayStepChart } from './LabDashboardTodayStepChart';

export interface LabDashboardTodayPanelProps {
  todayPanel: LabTodayPanelSnapshot;
  healthMessage: string;
  totalActive: number;
  suggestedTab: LabPipelineStage | null;
}

export const LabDashboardTodayPanel: React.FC<LabDashboardTodayPanelProps> = ({
  todayPanel,
  healthMessage,
  totalActive,
  suggestedTab,
}) => {
  const hasStepData = todayPanel.steps.some(step => step.sampleCount > 0);

  const panelMetaParts = [`${totalActive.toLocaleString()} active`, healthMessage];
  if (suggestedTab) {
    panelMetaParts.push(`→ ${labStageLabel(suggestedTab, 'short')}`);
  }

  return (
    <Panel
      title="Today"
      meta={panelMetaParts.join(' · ')}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      padding="none"
    >
      <div className={TODAY_PANEL.body}>
        {hasStepData ? (
          <LabDashboardTodayStepChart steps={todayPanel.steps} />
        ) : (
          <EmptyState
            {...DASHBOARD_EMPTY_STATE_TEXT}
            title={EMPTY_COPY.dashboardTodaySteps.title}
            description={EMPTY_COPY.dashboardTodaySteps.description}
          />
        )}
      </div>
    </Panel>
  );
};
