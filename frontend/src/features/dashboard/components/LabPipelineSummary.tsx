/**
 * LabPipelineSummary - Quick links to lab workflow queues from the dashboard.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/surfaces';
import { Badge, Icon } from '@/components/primitives';
import {
  useLabStageQueueCounts,
  getValidationTabCount,
  getLabTabPath,
  getStageVisual,
  LAB_TAB_LABELS,
  LAB_WORKFLOW_KPI_ICONS,
  type LabWorkflowStage,
} from '@/features/lab/cross';
import { useAuthStore } from '@/app/authStore';
import { text, INLINE_LINK, RADIUS } from '@/theme/recipes';

const LAB_QUEUE_ITEMS: Array<{
  id: LabWorkflowStage;
  countKey: keyof ReturnType<typeof useLabStageQueueCounts>['counts'];
}> = [
  { id: 'collection', countKey: 'collection' },
  { id: 'entry', countKey: 'entry' },
  { id: 'validation', countKey: 'validation' },
];

export interface LabPipelineSummaryProps {
  loading?: boolean;
}

export const LabPipelineSummary: React.FC<LabPipelineSummaryProps> = ({ loading: loadingProp }) => {
  const { hasRole } = useAuthStore();
  const canViewLab = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const { counts, isPending } = useLabStageQueueCounts();
  const loading = loadingProp ?? isPending;

  if (!canViewLab) {
    return null;
  }

  return (
    <Card
      padding="md"
      loading={loading}
    >
      <div className="flex items-center justify-between mb-space-4">
        <h2 className={text({ role: 'amount' })}>Lab Pipeline</h2>
        <Link to={getLabTabPath('monitor')} className={INLINE_LINK}>
          Command Center
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-space-3">
        {LAB_QUEUE_ITEMS.map(item => {
          const count =
            item.countKey === 'validation'
              ? getValidationTabCount(counts)
              : counts[item.countKey];
          const stageVisual = getStageVisual(item.id);
          return (
            <Link
              key={item.id}
              to={getLabTabPath(item.id)}
              className={`flex items-center justify-between p-space-3 ${RADIUS.field} border border-border-default hover:bg-surface-page transition-colors`}
            >
              <div className="flex items-center gap-space-2 min-w-0">
                <Icon
                  iconKey={LAB_WORKFLOW_KPI_ICONS[item.id]}
                  className={`w-4 h-4 shrink-0 ${stageVisual.text}`}
                />
                <span className={`${text({ role: 'label' })} truncate`}>{LAB_TAB_LABELS[item.id]}</span>
              </div>
              {count > 0 && (
                <Badge variant="primary" size="xs">
                  {count}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </Card>
  );
};
