/**
 * Global event log — all recent audit events with full filter bar.
 */

import React from 'react';
import { PageHeader } from '@/components';
import { PANEL, WORKSPACE } from '@/components/theme/recipes';
import { EventLogPanel, ALL_FILTER_FIELDS } from '../EventLogPanel';
import { EVENT_LOG_COPY } from '../types';

export const EventLogPage: React.FC = () => {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={WORKSPACE.page}>
        <PageHeader variant="bar" title={EVENT_LOG_COPY.panelTitle} />
        <div className={`${PANEL.raisedShadowSm} flex min-h-0 flex-1 flex-col overflow-hidden`}>
          <EventLogPanel
            layout="embedded"
            query={{ scope: 'stream', limit: 2000 }}
            filterUi={{ fields: ALL_FILTER_FIELDS }}
          />
        </div>
      </div>
    </div>
  );
};
