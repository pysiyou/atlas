/**
 * WorkflowFunnel - Three-column funnel: Pre-Analytical, Analytical, Post-Analytical.
 * Responsive: 3-col → 2-col → 1-col. Queue cards navigate to workflow tabs.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils';
import { FunnelColumn } from './FunnelColumn';
import { QueueCountCard } from './QueueCountCard';
import { RetestQueueCard } from './RetestQueueCard';
import { RejectedRecollectList } from './RejectedRecollectList';
import { PartialValidationIndicator } from './PartialValidationIndicator';
import type { CommandCenterData } from '../types';

export type LabTabId = 'collection' | 'entry' | 'validation';

export interface WorkflowFunnelProps {
  workflow: CommandCenterData['workflow'];
  onNavigateToTab?: (tab: LabTabId) => void;
}

export const WorkflowFunnel: React.FC<WorkflowFunnelProps> = ({
  workflow,
  onNavigateToTab,
}) => {
  const { preAnalytical, analytical, postAnalytical } = workflow;
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
        Workflow Funnel
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FunnelColumn title="Pre-Analytical">
          <QueueCountCard
            title="Pending Collections"
            count={preAnalytical.pending}
            icon={<Icon name={ICONS.dataFields.flask} className="w-5 h-5 text-text-tertiary" />}
            onViewQueue={onNavigateToTab ? () => onNavigateToTab('collection') : undefined}
          />
          <RejectedRecollectList
            items={preAnalytical.rejected}
            onViewQueue={onNavigateToTab ? () => onNavigateToTab('collection') : undefined}
          />
        </FunnelColumn>
        <FunnelColumn title="Analytical">
          <QueueCountCard
            title="Pending Results"
            count={analytical.pending}
            icon={<Icon name={ICONS.dataFields.notebook} className="w-5 h-5 text-text-tertiary" />}
            onViewQueue={onNavigateToTab ? () => onNavigateToTab('entry') : undefined}
          />
          <RetestQueueCard
            items={analytical.retestQueue}
            onViewQueue={onNavigateToTab ? () => onNavigateToTab('entry') : undefined}
          />
        </FunnelColumn>
        <FunnelColumn title="Post-Analytical">
          <QueueCountCard
            title="Pending Validation"
            count={postAnalytical.pending}
            icon={<Icon name={ICONS.ui.shieldCheck} className="w-5 h-5 text-text-tertiary" />}
            onViewQueue={onNavigateToTab ? () => onNavigateToTab('validation') : undefined}
          />
          <PartialValidationIndicator count={postAnalytical.partiallyValidated} />
        </FunnelColumn>
      </div>
    </section>
  );
}
