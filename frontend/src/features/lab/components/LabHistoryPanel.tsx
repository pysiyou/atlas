/**
 * LabHistoryPanel — entity operation timeline for lab detail modals.
 */
import React from 'react';
import { SectionPanel } from '@/components';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useEntityTimeline } from '@/features/lab/api/audit.api';
import { LabTimeline } from './LabTimeline';

interface LabHistoryPanelProps {
  entityType: 'sample' | 'order_test';
  entityId: number;
  title?: string;
}

export const LabHistoryPanel: React.FC<LabHistoryPanelProps> = ({
  entityType,
  entityId,
  title = 'History',
}) => {
  const { data, isLoading, isError, refetch } = useEntityTimeline(entityType, entityId);

  return (
    <SectionPanel title={title}>
      {isLoading ? (
        <div className="space-y-3 py-1" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton circle width={10} height={10} className="mt-1 shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton height={14} width="70%" />
                <Skeleton height={12} width="85%" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-sm text-text-secondary">
          Failed to load history.{' '}
          <button type="button" className="text-brand hover:underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <LabTimeline events={data?.events ?? []} interactiveEntities emptyMessage="No recorded actions yet." />
      )}
    </SectionPanel>
  );
};
