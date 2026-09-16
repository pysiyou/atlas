/**
 * LabEntityTimelinePanel — entity operation timeline for lab detail modals.
 */
import React from 'react';
import { Panel } from '@/components';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useEntityTimeline } from '../api/audit';
import { getFeedback } from '@/utils/feedback';
import { LabAuditTimeline } from './LabAuditTimeline';

interface LabEntityTimelinePanelProps {
  entityType: 'sample' | 'order_test';
  entityId: number;
  title?: string;
}

function defaultTitle(entityType: 'sample' | 'order_test'): string {
  return entityType === 'order_test' ? 'Test History' : 'Sample History';
}

export const LabEntityTimelinePanel: React.FC<LabEntityTimelinePanelProps> = ({
  entityType,
  entityId,
  title,
}) => {
  const { data, isLoading, isError, refetch } = useEntityTimeline(entityType, entityId);
  const panelTitle = title ?? defaultTitle(entityType);

  return (
    <Panel variant="lab" title={panelTitle}>
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
          {getFeedback('lab.history.panel.loadFailed').title}{' '}
          <button type="button" className="text-brand hover:underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <LabAuditTimeline events={data?.events ?? []} interactiveEntities />
      )}
    </Panel>
  );
};
