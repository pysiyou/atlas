import React, { useMemo } from 'react';
import { ErrorAlert, Skeleton } from '@/components';
import { Panel } from '@/components/surfaces/Panel';
import { errorAlertMessage } from '@/utils/feedback';
import { EVENT_LOG_COPY } from './copy';
import { EventLogFeed } from './EventLogFeed';
import { useEventLog } from './useEventLog';
import type { EventLogFilter, EventLogScope } from './types';

type PanelVariant = 'order' | 'scope' | 'recent';

interface EventLogPanelProps {
  variant: PanelVariant;
  orderId?: number;
  scope?: EventLogScope;
  hours?: number;
  className?: string;
  panelVariant?: 'default' | 'lab';
}

function metaForVariant(variant: PanelVariant): string {
  switch (variant) {
    case 'order':
      return EVENT_LOG_COPY.panelMetaOrder;
    case 'scope':
      return EVENT_LOG_COPY.panelMetaEntity;
    case 'recent':
      return EVENT_LOG_COPY.panelMetaCommandCenter;
  }
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({
  variant,
  orderId,
  scope,
  hours = 24,
  className,
  panelVariant = 'default',
}) => {
  const filter = useMemo((): EventLogFilter => {
    if (variant === 'order' && orderId != null) {
      return { mode: 'order', orderId };
    }
    if (variant === 'scope' && scope) {
      return { mode: 'scope', scope };
    }
    return { mode: 'recent', hours };
  }, [variant, orderId, scope, hours]);

  const { resolved, isLoading, isError, error, refetch } = useEventLog(filter);

  return (
    <Panel
      title={EVENT_LOG_COPY.panelTitle}
      meta={metaForVariant(variant)}
      padding="none"
      scroll="auto"
      variant={panelVariant === 'lab' ? 'lab' : 'page'}
      className={className}
    >
      {isLoading ? (
        <div className="flex flex-col gap-space-3 p-space-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} height={56} className="w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-space-3">
          <ErrorAlert
            error={{ message: errorAlertMessage('lab.page.loadFailed', error) }}
            onRetry={refetch}
          />
        </div>
      ) : (
        <EventLogFeed items={resolved} />
      )}
    </Panel>
  );
};

export const OrderEventLogPanel: React.FC<{ orderId: number; className?: string }> = props => (
  <EventLogPanel variant="order" orderId={props.orderId} className={props.className} />
);

export const ScopedEventLogPanel: React.FC<{ scope: EventLogScope; className?: string }> = props => (
  <EventLogPanel variant="scope" scope={props.scope} panelVariant="lab" className={props.className} />
);

export const CommandCenterEventLogPanel: React.FC = () => (
  <EventLogPanel variant="recent" className="min-h-0 h-full" />
);
