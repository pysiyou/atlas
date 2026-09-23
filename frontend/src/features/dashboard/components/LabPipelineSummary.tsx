/**
 * LabPipelineSummary - Quick links to lab workflow queues from the dashboard.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Icon, type IconName } from '@/components';
import { ICONS } from '@/config/icons';
import {
  useLabStageQueueCounts,
  getValidationTabCount,
  getLabTabPath,
  LAB_TAB_LABELS,
  type LabTabId,
} from '@/features/lab';
import { useAuthStore } from '@/app/authStore';
import { RADIUS, TYPE } from '@/components/theme/recipes';


const LAB_QUEUE_ITEMS: Array<{
  id: LabTabId;
  icon: string;
  countKey: keyof ReturnType<typeof useLabStageQueueCounts>['counts'];
}> = [
  { id: 'collection', icon: ICONS.dataFields.flask, countKey: 'collection' },
  { id: 'entry', icon: ICONS.dataFields.notebook, countKey: 'entry' },
  { id: 'validation', icon: ICONS.ui.shieldCheck, countKey: 'validation' },
];

export const LabPipelineSummary: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canViewLab = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const { counts } = useLabStageQueueCounts();

  if (!canViewLab) {
    return null;
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-space-4">
        <h2 className="text-sm font-normal text-text-primary">Lab Pipeline</h2>
        <Link to={getLabTabPath('command-center')} className="text-xs text-brand hover:underline">
          Command Center
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-space-3">
        {LAB_QUEUE_ITEMS.map(item => {
          const count =
            item.countKey === 'validation'
              ? getValidationTabCount(counts)
              : counts[item.countKey];
          return (
            <Link
              key={item.id}
              to={getLabTabPath(item.id)}
              className={`flex items-center justify-between p-space-3 ${RADIUS.field} border border-border-default hover:bg-surface-page transition-colors`}
            >
              <div className="flex items-center gap-space-2 min-w-0">
                <Icon name={item.icon as IconName} className="w-4 h-4 text-brand shrink-0" />
                <span className={`${TYPE.label} truncate`}>{LAB_TAB_LABELS[item.id]}</span>
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
