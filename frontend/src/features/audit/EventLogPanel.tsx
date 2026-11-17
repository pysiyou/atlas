/**
 * Event log panel — fetch by named scope and optional kind / date / record filters.
 * Placeholders belong on the wrapping Panel/table/modal, not on this feed.
 */
import { useMemo } from 'react';
import { Button } from '@/components/primitives';
import { Panel } from '@/components/surfaces/Panel';
import type { PanelPresetId } from '@/theme/panelPresets';
import { cn } from '@/utils';
import { useClientListChrome } from '@/hooks';
import { useEventLogCopy, type EventLogCopy } from '@/strings';
import { EventLogFeed } from './EventLogFeed';
import { EventLogFilters } from './EventLogFilters';
import { useEventLog } from './useEventLog';
import { useEventLogPanelState, type EventLogPanelFilterState } from './eventLogPanelState';
import type {
  EventLogFilterUiConfig,
  EventLogQuery,
  EventLogUserFilters,
} from './types';
export type EventLogPanelLayout = 'standalone' | 'embedded';

const EVENT_LOG_PRESET: Record<'default' | 'compact' | 'monitor', PanelPresetId> = {
  default: 'panel.pageEmbed.auto',
  compact: 'panel.compactEmbed.auto',
  /**
   * Same stretch-and-fill body as the Today panel so EmptyState can center
   * in the monitor column. Feed scrolling moves onto the inner wrapper.
   */
  monitor: 'panel.pageEmbed.flexColumnFill',
};

function eventLogPreset(panelVariant: 'default' | 'compact' | 'monitor'): PanelPresetId {
  return EVENT_LOG_PRESET[panelVariant];
}

export interface EventLogPanelProps {
  query: EventLogQuery;
  filterUi?: EventLogFilterUiConfig;
  filterDefaults?: Partial<EventLogUserFilters>;
  className?: string;
  panelVariant?: 'default' | 'compact' | 'monitor';
  /** `embedded` matches list pages (Patients, Orders): no inner panel title, fills raised shell. */
  layout?: EventLogPanelLayout;
  meta?: string;
  hideMeta?: boolean;
  /** When set (e.g. global event log page), skips local filter state in favor of URL-synced state. */
  filterPanelState?: EventLogPanelFilterState;
  /** Parent Panel loading (container chrome only — never a feed skeleton). */
  loading?: boolean;
}

function metaForQuery(query: EventLogQuery, hasUserFilters: boolean, copy: EventLogCopy): string {
  if (hasUserFilters) {
    return 'Newest first';
  }
  if (query.scope === 'stream' && query.kinds?.includes('laboratory') && query.hours === 24) {
    return copy.panelMetaMonitor;
  }
  if (query.scope === 'order') {
    return copy.panelMetaOrder;
  }
  if (query.scope === 'lab') {
    return copy.panelMetaLab;
  }
  if (query.scope === 'patient') {
    return copy.panelMetaPatient;
  }
  if (query.limit === 2000 && !query.hours) {
    return copy.panelMetaAll;
  }
  if (query.hours != null) {
    return copy.panelMetaMonitor;
  }
  return copy.panelMetaAll;
}

export function EventLogPanel({
  query,
  filterUi,
  filterDefaults,
  className,
  panelVariant = 'default',
  layout = 'standalone',
  meta,
  hideMeta = false,
  filterPanelState,
  loading: loadingProp,
}: EventLogPanelProps) {
  const copy = useEventLogCopy();
  const visibleFields = filterUi?.fields ?? [];
  const showFilters = visibleFields.length > 0;

  const localPanelState = useEventLogPanelState({
    query,
    filterDefaults,
    visibleFields,
  });
  const panelState = filterPanelState ?? localPanelState;

  const skipFetch = panelState.recordIdInputInvalid;

  const { resolved, isLoading, isError, error, refetch, hasMore, isFetchingMore, loadMore } =
    useEventLog(panelState.mergedQuery, {
      enabled: !skipFetch,
    });

  useClientListChrome({
    loadFailedKey: 'lab.page.loadFailed',
    isLoading,
    isError,
    error,
    refetch,
  });

  const panelMeta = useMemo(() => {
    if (hideMeta || layout === 'embedded') return undefined;
    if (meta) return meta;
    return metaForQuery(query, panelState.activeFilterCount > 0, copy);
  }, [hideMeta, layout, meta, query, panelState.activeFilterCount, copy]);

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
      recordIdInput={panelState.recordIdInput}
      onRecordIdInputChange={panelState.setRecordIdInput}
      recordIdInputInvalid={panelState.recordIdInputInvalid}
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

  const body = (
    <div
      className={cn(
        'flex h-full min-h-0 flex-1 flex-col',
        panelVariant === 'monitor' && 'overflow-y-auto',
      )}
    >
      {isLoading && resolved.length === 0 ? null : (
        <>
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
                {copy.loadMore}
              </Button>
            </div>
          ) : null}
        </>
      )}
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
      preset={eventLogPreset(panelVariant)}
      title={copy.panelTitle}
      meta={loadingProp ? undefined : panelMeta}
      loading={loadingProp === true}
    >
      {filters}
      {body}
    </Panel>
  );
}

export function OrderEventLogPanel(props: {
  orderId: string;
  className?: string;
  layout?: EventLogPanelLayout;
}) { return (
  <EventLogPanel
    query={{ scope: 'order', orderId: props.orderId, limit: 500 }}
    className={props.className}
    layout={props.layout ?? 'standalone'}
  />
); }

/**
 * Laboratory workflow timeline for a test (plus its sample) or a sample (plus its tests).
 *
 * Pass `testId` from result/validation/escalation modals so sibling tests on the
 * same tube are excluded. Pass `sampleId` from collection so every test on the
 * tube is included. The backend resolves the sample↔test graph.
 */
export function LabEventLogPanel(props: {
  testId?: number;
  sampleId?: string;
  className?: string;
}) {
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
      panelVariant="compact"
      className={props.className}
    />
  );
}

export function PatientEventLogPanel(props: {
  patientId: string;
  className?: string;
}) { return (
  <EventLogPanel
    query={{ scope: 'patient', patientId: props.patientId, limit: 200 }}
    filterUi={{ fields: ['dateRange'] }}
    className={props.className}
  />
); }

export function LabMonitorEventLogPanel({ loading }: {
  /** Parent board Panel loading — not the event feed. */
  loading?: boolean;
}) { return (
  <EventLogPanel
    query={{ scope: 'stream', hours: 24, kinds: ['laboratory'], limit: 500 }}
    filterUi={{ fields: [] }}
    panelVariant="monitor"
    loading={loading}
  />
); }

/**
 * Billing events for an order — payment and invoice rows on payment detail.
 */
export function BillingEventLogPanel(props: { orderId: string; className?: string }) { return (
  <EventLogPanel
    query={{ scope: 'order', orderId: props.orderId, kinds: ['billing'], limit: 200 }}
    filterUi={{ fields: [] }}
    className={props.className}
  />
); }

