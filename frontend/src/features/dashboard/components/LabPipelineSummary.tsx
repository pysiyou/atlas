/**
 * LabPipelineSummary - Quick links to lab workflow queues from the dashboard.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge, Icon, type IconName } from '@/components';
import { ICONS } from '@/config/icons';
import { useLabPipelineCounts } from '@/features/lab/hooks';
import { getLabTabPath, LAB_TAB_LABELS, type LabTabId } from '@/features/lab/constants/labTabs';
import { useAuthStore } from '@/app/store';

const LAB_QUEUE_ITEMS: Array<{
  id: LabTabId;
  icon: string;
  countKey: keyof ReturnType<typeof useLabPipelineCounts>['counts'];
}> = [
  { id: 'collection', icon: ICONS.dataFields.flask, countKey: 'collection' },
  { id: 'entry', icon: ICONS.dataFields.notebook, countKey: 'entry' },
  { id: 'validation', icon: ICONS.ui.shieldCheck, countKey: 'validation' },
];

export const LabPipelineSummary: React.FC = () => {
  const { hasRole } = useAuthStore();
  const canViewLab = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const { counts } = useLabPipelineCounts();

  if (!canViewLab) {
    return null;
  }

  return (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-normal text-text-primary">Lab Pipeline</h2>
        <Link to={getLabTabPath('dashboard')} className="text-xs text-brand hover:underline">
          Command Center
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {LAB_QUEUE_ITEMS.map(item => {
          const count = counts[item.countKey];
          return (
            <Link
              key={item.id}
              to={getLabTabPath(item.id)}
              className="flex items-center justify-between p-3 rounded border border-border-default hover:bg-surface-page transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon name={item.icon as IconName} className="w-4 h-4 text-brand shrink-0" />
                <span className="text-xs text-text-secondary truncate">{LAB_TAB_LABELS[item.id]}</span>
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
