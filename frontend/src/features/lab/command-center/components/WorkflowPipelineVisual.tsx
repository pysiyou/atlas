/**
 * WorkflowPipelineVisual - Center panel: Pre-Analytical → Analytical → Post-Analytical with counts.
 * Click stage navigates to tab.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { Card } from '@/shared/ui';
import type { CommandCenterData } from '../types';

export type LabTabId = 'collection' | 'entry' | 'validation';

export interface WorkflowPipelineVisualProps {
  workflow: CommandCenterData['workflow'];
  onNavigateToTab?: (tab: LabTabId) => void;
}

const STAGES: Array<{
  key: keyof CommandCenterData['workflow'];
  label: string;
  tab: LabTabId;
  icon: string;
}> = [
  { key: 'preAnalytical', label: 'Pre-Analytical', tab: 'collection', icon: ICONS.dataFields.flask },
  { key: 'analytical', label: 'Analytical', tab: 'entry', icon: ICONS.dataFields.notebook },
  { key: 'postAnalytical', label: 'Post-Analytical', tab: 'validation', icon: ICONS.ui.shieldCheck },
];

export const WorkflowPipelineVisual: React.FC<WorkflowPipelineVisualProps> = ({
  workflow,
  onNavigateToTab,
}) => {
  return (
    <Card className="rounded-xl flex flex-col min-h-0 h-full min-w-0 overflow-hidden" padding="sm" variant="default">
      <h3 className="text-xs font-bold text-text-primary uppercase tracking-wide mb-2 shrink-0">
        Workflow Pipeline
      </h3>
      <div className="flex-1 min-h-0 flex items-stretch gap-2 md:gap-4">
        {STAGES.map((stage, idx) => {
          const data = workflow[stage.key];
          const pending =
            'pending' in data ? data.pending : (data as { pending: number }).pending;
          const extra =
            'rejected' in data
              ? (data as { rejected: unknown[] }).rejected.length
              : 'retestQueue' in data
                ? (data as { retestQueue: unknown[] }).retestQueue.length
                : 'partiallyValidated' in data
                  ? (data as { partiallyValidated: number }).partiallyValidated
                  : 0;
          const handleClick = () => onNavigateToTab?.(stage.tab);

          return (
            <React.Fragment key={stage.key}>
              {idx > 0 && (
                <div className="hidden md:flex items-center shrink-0">
                  <Icon
                    name={ICONS.actions.arrowRight}
                    className="w-5 h-5 text-text-tertiary"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleClick}
                className="flex-1 flex flex-col items-center justify-center rounded-lg border border-border-default bg-surface-canvas hover:border-action-primary hover:bg-surface-hover transition-colors p-4 min-w-0"
              >
                <Icon
                  name={stage.icon as import('@/shared/ui').IconName}
                  className="w-8 h-8 text-text-tertiary mb-2"
                />
                <span className="text-xs font-medium text-text-secondary text-center">
                  {stage.label}
                </span>
                <span className="text-xl font-bold text-action-primary tabular-nums mt-1">
                  {pending}
                </span>
                {extra > 0 && (
                  <span className="text-xxs text-text-tertiary mt-0.5">
                    +{extra} other
                  </span>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </Card>
  );
};
