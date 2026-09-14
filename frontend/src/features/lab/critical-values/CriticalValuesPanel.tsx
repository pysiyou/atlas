/**
 * CriticalValuesPanel - Pending critical value notifications queue.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Icon } from '@/components';
import { LabSectionPanel } from '../components/LabSectionPanel';
import { ICONS } from '@/config/icons';
import { displayId } from '@/utils';
import { getLabQueueUrl } from '@/features/lab/constants/labTabs';
import { usePendingCriticalValues } from './useCriticalValues';
import { CriticalValueActions } from './CriticalValueActions';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';

export const CriticalValuesPanel: React.FC = () => {
  const { criticalValues, isLoading, refetch } = usePendingCriticalValues();

  if (isLoading) {
    return (
      <LabSectionPanel title="Critical Values">
        <p className="text-sm text-text-tertiary py-4">Loading critical values...</p>
      </LabSectionPanel>
    );
  }

  if (criticalValues.length === 0) {
    return null;
  }

  return (
    <LabSectionPanel
      title="Critical Values Pending"
      headerRight={
        <Badge variant="danger" size={LAB_CARD_BADGE_SIZE}>
          {criticalValues.length}
        </Badge>
      }
    >
      <div className="space-y-4">
        {criticalValues.map(record => (
          <div
            key={record.id}
            className="p-4 border border-danger-stroke rounded-md bg-danger-bg/30 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-normal text-text-primary">
                <Icon name={ICONS.actions.alertCircle} className="w-4 h-4 text-danger-fg" />
                <span className="entity-id">{displayId.orderTest(record.id)}</span>
                {record.testName ?? record.testCode}
              </div>
              <Link
                to={getLabQueueUrl('validation', {
                  search: displayId.orderTest(record.id),
                })}
                className="text-xs text-brand hover:underline"
              >
                Open in Lab
              </Link>
            </div>
            <CriticalValueActions record={record} compact onUpdated={() => refetch()} />
          </div>
        ))}
      </div>
    </LabSectionPanel>
  );
};
