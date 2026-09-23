/**
 * LabEntityTimelinePanel — entity operation timeline for lab detail modals.
 */
import React from 'react';
import { EMPTY_COPY, Panel } from '@/components';
import { Skeleton } from '@/components/loaders/Skeleton';
import { useEntityTimeline } from '../api/audit';
import { getFeedback } from '@/utils/feedback';
import { ENTITY_MODAL_TIMELINE_CATEGORIES, Timeline, TIMELINE_STYLES } from '@/features/timeline';
import { TYPE } from '@/components/theme/recipes';

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
        <div className="space-y-space-3 py-space-1" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-space-2">
              <Skeleton circle width={8} height={8} className="mt-space-1-5 shrink-0" />
              <div className="flex-1 space-y-space-1 pb-space-3">
                <Skeleton height={12} width="75%" />
                <Skeleton height={10} width="50%" />
                <Skeleton height={10} width="35%" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className={TYPE.label}>
          {getFeedback('lab.history.panel.loadFailed').title}{' '}
          <button type="button" className={TIMELINE_STYLES.retryLink} onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : (
        <Timeline
          preset="commandCenter"
          categoryFilter={ENTITY_MODAL_TIMELINE_CATEGORIES}
          events={data?.events ?? []}
          interactiveEntities
          showRetestDividers={false}
          emptyVisual="textOnly"
          emptyMessage={EMPTY_COPY.recentActivity.title}
          emptyDescription={EMPTY_COPY.recentActivity.description}
          className="max-h-80 px-space-3 py-space-1"
        />
      )}
    </Panel>
  );
};
