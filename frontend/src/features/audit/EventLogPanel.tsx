/**
 * Event log panel — fetch by named scope and optional kind / date / entity filters.
 */
import React, { useMemo } from 'react';
import { Button, ErrorAlert, Skeleton } from '@/components';
import { Panel } from '@/components/surfaces/Panel';
import { cn } from '@/utils';
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
  EventLogUserFilters,
} from './types';

/** Global Event Log page — simplified filter bar. */
export const GLOBAL_EVENT_LOG_FILTER_FIELDS: EventLogFilterField[] = [
  'search',
  'dateRange',
  'kind',
  'actorRole',
];

/** @deprecated Prefer GLOBAL_EVENT_LOG_FILTER_FIELDS on the global page. */
const ALL_FILTER_FIELDS: EventLogFilterField[] = GLOBAL_EVENT_LOG_FILTER_FIELDS;

export type EventLogPanelLayout = 'standalone' | 'embedded';

export interface EventLogPanelProps {
  query: EventLogQuery;
  filterUi?: EventLogFilterUiConfig;
  filterDefaults?: Partial<EventLogUserFilters>;
  className?: string;
  panelVariant?: 'default' | 'lab';
  /** `embedded` matches list pages (Patients, Orders): no inner panel title, fills raised shell. */
  layout?: EventLogPanelLayout;
  meta?: string;
  hideMeta?: boolean;
}

function metaForQuery(query: EventLogQuery, hasUserFilters: boolean): string {
  if (hasUserFilters) {
    return 'Newest first';
  }
  if (query.scope === 'stream' && query.kinds?.includes('laboratory') && query.hours === 24) {
    return EVENT_LOG_COPY.panelMetaMonitor;
  }
  if (query.scope === 'order') {
    return EVENT_LOG_COPY.panelMetaOrder;
  }
  if (query.scope === 'lab') {
    return EVENT_LOG_COPY.panelMetaLab;
  }
  if (query.scope === 'patient') {
    return EVENT_LOG_COPY.panelMetaPatient;
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
  layout = 'standalone',
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

  const skipFetch = panelState.entityIdInputInvalid;

  const { resolved, isLoading, isError, error, refetch, hasMore, isFetchingMore, loadMore } =
    useEventLog(panelState.mergedQuery, {
      enabled: !skipFetch,
    });

  const panelMeta = useMemo(() => {
    if (hideMeta || layout === 'embedded') return undefined;
    if (meta) return meta;
    return metaForQuery(query, panelState.activeFilterCount > 0);
  }, [hideMeta, layout, meta, query, panelState.activeFilterCount]);

  const filters = showFilters ? (
    <EventLogFilters
      visibleFields={visibleFields}
      lockedFields={panelState.lockedFields}
      kinds={panelState.userFilters.kinds}
      onKindsChange={kinds => panelState.setUserFilters(prev => ({ ...prev, kinds }))}
      dateRange={panelState.userFilters.dateRange}
      onDateRangeChange={dateRange =>
        panelState.setUserFilters(prev => ({ ...prev, dateRange }))
      }
      entityIdInput={panelState.entityIdInput}
      onEntityIdInputChange={panelState.setEntityIdInput}
      entityIdInputInvalid={panelState.entityIdInputInvalid}
      includeAccess={panelState.userFilters.includeAccess}
      onIncludeAccessChange={includeAccess =>
        panelState.setUserFilters(prev => ({ ...prev, includeAccess }))
      }
      verbosity={panelState.userFilters.verbosity}
      onVerbosityChange={verbosity =>
        panelState.setUserFilters(prev => ({ ...prev, verbosity }))
      }
      actorRoles={panelState.userFilters.actorRoles}
      onActorRolesChange={actorRoles =>
        panelState.setUserFilters(prev => ({ ...prev, actorRoles }))
      }
      actorSearch={panelState.userFilters.actorSearch}
      onActorSearchChange={actorSearch =>
        panelState.setUserFilters(prev => ({ ...prev, actorSearch }))
      }
      search={panelState.userFilters.search}
      onSearchChange={search => panelState.setUserFilters(prev => ({ ...prev, search }))}
      activeFilterCount={panelState.activeFilterCount}
      onReset={panelState.resetUserFilters}
    />
  ) : null;

  const body = isLoading ? (
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
    <div className="flex min-h-0 flex-1 flex-col">
      <EventLogFeed items={resolved} />
      {hasMore ? (
        <div className="flex justify-center px-space-3 pb-space-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              void loadMore();
            }}
            isLoading={isFetchingMore}
            disabled={isFetchingMore}
          >
            {EVENT_LOG_COPY.loadMore}
          </Button>
        </div>
      ) : null}
    </div>
  );

  if (layout === 'embedded') {
    return (
      <div className={cn('flex min-h-0 flex-1 flex-col', className)}>
        {filters}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{body}</div>
      </div>
    );
  }

  return (
    <Panel
      title={EVENT_LOG_COPY.panelTitle}
      meta={panelMeta}
      scroll="auto"
      variant={panelVariant === 'lab' ? 'labEmbed' : 'pageEmbed'}
      className={className}
    >
      {filters}
      {body}
    </Panel>
  );
};

export const OrderEventLogPanel: React.FC<{ orderId: number; className?: string }> = props => (
  <EventLogPanel
    query={{ scope: 'order', orderId: props.orderId, limit: 500 }}
    filterUi={{ fields: ['kind', 'dateRange'] }}
    className={props.className}
  />
);

/**
 * Laboratory workflow timeline for a test (plus its sample) or a sample (plus its tests).
 *
 * Pass `testId` from result/validation/escalation modals so sibling tests on the
 * same tube are excluded. Pass `sampleId` from collection so every test on the
 * tube is included. The backend resolves the sample↔test graph.
 */
export const LabEventLogPanel: React.FC<{
  testId?: number;
  sampleId?: number;
  className?: string;
}> = props => {
  const hasTest = props.testId != null;
  const hasSample = props.sampleId != null;
  if (!hasTest && !hasSample) {
    return null;
  }

  return (
    <EventLogPanel
      query={{
        scope: 'lab',
        ...(hasTest ? { testId: props.testId } : { sampleId: props.sampleId }),
        limit: 200,
      }}
      filterUi={{ fields: [] }}
      panelVariant="lab"
      className={props.className}
    />
  );
};

export const PatientEventLogPanel: React.FC<{
  patientId: number;
  className?: string;
}> = props => (
  <EventLogPanel
    query={{ scope: 'patient', patientId: props.patientId, limit: 200 }}
    filterUi={{ fields: ['dateRange'] }}
    className={props.className}
  />
);

export const LabMonitorEventLogPanel: React.FC = () => (
  <EventLogPanel
    query={{ scope: 'stream', hours: 24, kinds: ['laboratory'], limit: 500 }}
    filterUi={{ fields: [] }}
    className="min-h-0 h-full"
  />
);

/**
 * Billing events for an order — payment and invoice rows on payment detail.
 */
export const BillingEventLogPanel: React.FC<{ orderId: number; className?: string }> = props => (
  <EventLogPanel
    query={{ scope: 'order', orderId: props.orderId, kinds: ['billing'], limit: 200 }}
    filterUi={{ fields: [] }}
    className={props.className}
  />
);

export { ALL_FILTER_FIELDS };
