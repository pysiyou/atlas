/**
 * PendingCriticalValuesPanel - Pending critical value notifications queue.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge, Icon } from '@/components/primitives';
import { Panel, criticalValuesPanelLoadingContent } from '@/components/surfaces';
import { RecordId } from '@/features/shared';
import { ICONS } from '@/config/icons';
import { cn, displayId } from '@/utils';
import { getLabQueueUrl } from '../constants/labConstants';
import { usePendingCriticalValues } from './criticalValues';
import { CriticalValueActions } from './CriticalValueActions';
import { text, RADIUS, TONE } from '@/theme/recipes';
import { WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';

export interface PendingCriticalValuesPanelProps {
  loading?: boolean;
}

export const PendingCriticalValuesPanel: React.FC<PendingCriticalValuesPanelProps> = ({
  loading: loadingProp,
}) => {
  const { criticalValues, isLoading, refetch } = usePendingCriticalValues();
  const loading = loadingProp ?? isLoading;

  if (!loading && criticalValues.length === 0) {
    return null;
  }

  return (
    <Panel
      preset="panel.compact.standard"
      title={loading ? 'Critical Values' : 'Critical Values Pending'}
      loading={loading}
      loadingContent={criticalValuesPanelLoadingContent()}
      headerEnd={
        loading ? undefined : (
          <Badge variant="danger" size={WORKLIST_CARD_BADGE_SIZE}>
            {criticalValues.length}
          </Badge>
        )
      }
      loadingHeaderAside={!loading}
    >
      <div className="space-y-space-4">
        {criticalValues.map(record => (
          <div
            key={record.id}
            className={cn(RADIUS.surface, 'p-panel space-y-space-3', TONE.danger.well)}
          >
            <div className="flex items-center justify-between gap-space-2">
              <div className={`flex items-center gap-space-2 ${text({ role: 'body' })}`}>
                <Icon name={ICONS.actions.alertCircle} className={`w-4 h-4 ${TONE.danger.fg}`} />
                <RecordId type="orderTest" value={record.id} />
                {record.testName ?? record.testCode}
              </div>
              <Link
                to={getLabQueueUrl('validation', {
                  search: displayId.orderTest(record.id),
                })}
                className={`${text({ role: 'caption' })} ${TONE.brand.fg} hover:underline`}
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
