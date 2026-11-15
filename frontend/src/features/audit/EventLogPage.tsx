/**
 * Global event log — all recent audit events with full filter bar.
 */

import { PageHeader } from '@/components/layout';
import { PANEL, WORKSPACE } from '@/theme/recipes';
import { EventLogPanel } from './EventLogPanel';
import { GLOBAL_EVENT_LOG_FILTER_FIELDS } from './eventLogFilterConfig';
import { useEventLogCopy } from '@/strings';
import { useEventLogUrlPageFilters } from './eventLogPanelState';

const STREAM_QUERY = { scope: 'stream' as const, limit: 2000 };

export function EventLogPage() {
  const copy = useEventLogCopy();
  const filterPanelState = useEventLogUrlPageFilters({
    query: STREAM_QUERY,
    visibleFields: GLOBAL_EVENT_LOG_FILTER_FIELDS,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={WORKSPACE.page}>
        <PageHeader variant="bar" title={copy.panelTitle} />
        <div className={`${PANEL.raisedShadowSm} flex min-h-0 flex-1 flex-col overflow-hidden`}>
          <EventLogPanel
            layout="embedded"
            query={STREAM_QUERY}
            filterUi={{ fields: GLOBAL_EVENT_LOG_FILTER_FIELDS }}
            filterPanelState={filterPanelState}
          />
        </div>
      </div>
    </div>
  );
}
