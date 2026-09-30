import React, { useMemo } from 'react';
import { ErrorAlert, Skeleton } from '@/components';
import { Panel } from '@/components/surfaces/Panel';
import { errorAlertMessage } from '@/utils/feedback';
import { EVENT_LOG_COPY } from './types';
import { EventLogFeed } from './EventLogFeed';
import { EventLogFilters } from './EventLogFilters';
import { useEventLog } from './useEventLog';
import { useEventLogPanelState } from './useEventLogPanelState';
import type {
  EventLogFilterField,
  EventLogFilterUiConfig,
  EventLogQuery,
  EventLogScope,
  EventLogUserFilters,
} from './types';

const ALL_FILTER_FIELDS: EventLogFilterField[] = [
  'category',
  'dateRange',
  'orderId',
  'testId',
];

export interface EventLogPanelProps {
  query: EventLogQuery;
  filterUi?: EventLogFilterUiConfig;
  filterDefaults?: Partial<EventLogUserFilters>;
  className?: string;
  panelVariant?: 'default' | 'lab';
  meta?: string;
  hideMeta?: boolean;
}

function scopeToQuery(scope: EventLogScope): Pick<EventLogQuery, 'targetType' | 'targetId'> {
  return {
    targetType: scope.targetType,
    targetId: scope.targetId,
  };
}

function metaForQuery(query: EventLogQuery, hasUserFilters: boolean): string {
  if (hasUserFilters) {
    return 'Newest first';
  }
  if (query.categories?.includes('laboratory') && query.hours === 24) {
    return EVENT_LOG_COPY.panelMetaMonitor;
  }
  if (query.orderId != null) {
    return EVENT_LOG_COPY.panelMetaOrder;
  }
  if (query.targetType && query.targetId != null) {
    return EVENT_LOG_COPY.panelMetaEntity;
  }
  if (query.limit === 2000 && !query.hours) {
    return EVENT_LOG_COPY.panelMetaAll;
  }
  if (query.hours != null) {
    return EVENT_LOG_COPY.panelMetaMonitor;
  }
  return EVENT_LOG_COPY.panelMetaAll;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({
  query,
  filterUi,
  filterDefaults,
  className,
  panelVariant = 'default',
  meta,
  hideMeta = false,
}) => {
  const visibleFields = filterUi?.fields ?? [];
  const showFilters = visibleFields.length > 0;

  const panelState = useEventLogPanelState({
    query,
    filterDefaults,
    visibleFields,
  });

  const skipFetch =
    panelState.orderIdInputInvalid ||
    panelState.testIdInputInvalid;

  const { resolved, isLoading, isError, error, refetch } = useEventLog(panelState.mergedQuery, {
    enabled: !skipFetch,
  });

  const panelMeta = useMemo(() => {
    if (hideMeta) return undefined;
    if (meta) return meta;
    return metaForQuery(query, panelState.activeFilterCount > 0);
  }, [hideMeta, meta, query, panelState.activeFilterCount]);

  return (
    <Panel
      title={EVENT_LOG_COPY.panelTitle}
      meta={panelMeta}
      padding="none"
      scroll="auto"
      variant={panelVariant === 'lab' ? 'lab' : 'page'}
      className={className}
    >
      {showFilters ? (
        <EventLogFilters
          visibleFields={visibleFields}
          lockedFields={panelState.lockedFields}
          categories={panelState.userFilters.categories}
          onCategoriesChange={categories =>
            panelState.setUserFilters(prev => ({ ...prev, categories }))
          }
          dateRange={panelState.userFilters.dateRange}
          onDateRangeChange={dateRange =>
            panelState.setUserFilters(prev => ({ ...prev, dateRange }))
          }
          orderIdInput={panelState.orderIdInput}
          onOrderIdInputChange={panelState.setOrderIdInput}
          testIdInput={panelState.testIdInput}
          onTestIdInputChange={panelState.setTestIdInput}
          orderIdInputInvalid={panelState.orderIdInputInvalid}
          testIdInputInvalid={panelState.testIdInputInvalid}
          activeFilterCount={panelState.activeFilterCount}
          onReset={panelState.resetUserFilters}
        />
      ) : null}
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
  <EventLogPanel
    query={{ orderId: props.orderId, limit: 500 }}
    filterUi={{ fields: ['category', 'dateRange', 'testId'] }}
    className={props.className}
  />
);

export const ScopedEventLogPanel: React.FC<{
  scope: EventLogScope;
  testId?: number;
  className?: string;
}> = props => (
  <EventLogPanel
    query={{
      ...scopeToQuery(props.scope),
      testId: props.testId,
      limit: 200,
    }}
    filterUi={{ fields: [] }}
    panelVariant="lab"
    className={props.className}
  />
);

export const LabMonitorEventLogPanel: React.FC = () => (
  <EventLogPanel
    query={{ hours: 24, categories: ['laboratory'], limit: 500 }}
    filterUi={{ fields: [] }}
    className="min-h-0 h-full"
  />
);

export { ALL_FILTER_FIELDS };
