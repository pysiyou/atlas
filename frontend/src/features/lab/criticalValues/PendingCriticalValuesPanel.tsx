/**
 * PendingCriticalValuesPanel - Pending critical value notifications queue.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Icon, Panel, EntityId } from '@/components';
import { ICONS } from '@/config/icons';
import { cn, displayId } from '@/utils';
import { getLabQueueUrl } from '../constants/labConstants';
import { usePendingCriticalValues } from './criticalValues';
import { CriticalValueActions } from './CriticalValueActions';
import { RADIUS, TONE, TYPE } from '@/components/theme/recipes';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';

export const PendingCriticalValuesPanel: React.FC = () => {
  const { criticalValues, isLoading, refetch } = usePendingCriticalValues();

  if (isLoading) {
    return (
      <Panel variant="lab" title="Critical Values">
        <p className={`${TYPE.meta} py-space-4`}>Loading critical values...</p>
      </Panel>
    );
  }

  if (criticalValues.length === 0) {
    return null;
  }

  return (
    <Panel
      variant="lab"
      title="Critical Values Pending"
      headerEnd={
        <Badge variant="danger" size={LAB_CARD_BADGE_SIZE}>
          {criticalValues.length}
        </Badge>
      }
    >
      <div className="space-y-space-4">
        {criticalValues.map(record => (
          <div
            key={record.id}
            className={cn(RADIUS.surface, 'p-panel space-y-space-3', TONE.danger.well)}
          >
            <div className="flex items-center justify-between gap-space-2">
              <div className={`flex items-center gap-space-2 ${TYPE.value}`}>
                <Icon name={ICONS.actions.alertCircle} className={`w-4 h-4 ${TONE.danger.fg}`} />
                <EntityId type="orderTest" value={record.id} />
                {record.testName ?? record.testCode}
              </div>
              <Link
                to={getLabQueueUrl('validation', {
                  search: displayId.orderTest(record.id),
                })}
                className={`${TYPE.caption} ${TONE.brand.fg} hover:underline`}
              >
                Open in Lab
              </Link>
            </div>
            <CriticalValueActions record={record} compact onUpdated={() => refetch()} />
          </div>
        ))}
      </div>
    </Panel>
  );
};
