import React from 'react';
import { Skeleton } from '@/components/loaders/Skeleton';
import { Timeline } from '@/features/timeline';
import { useOrderTimeline } from '@/features/timeline/useOrderTimeline';

interface OrderEventTimelineProps {
  orderId: number;
}

export const OrderEventTimeline: React.FC<OrderEventTimelineProps> = ({ orderId }) => {
  const { data, isLoading, isError, refetch } = useOrderTimeline(orderId);

  if (isLoading) {
    return (
      <div className="p-panel space-y-3" aria-busy="true">
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
    );
  }

  if (isError) {
    return (
      <div className="p-panel text-sm text-text-secondary">
        Couldn&apos;t load timeline.{' '}
        <button type="button" className="text-brand hover:underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <Timeline
      preset="order"
      events={data?.events ?? []}
      interactiveEntities
      className="max-h-80 p-panel"
      emptyMessage="No activity recorded for this order yet."
    />
  );
};
