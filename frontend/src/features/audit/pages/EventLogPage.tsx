/**
 * Global event log — all recent audit events with full filter bar.
 */

import React from 'react';
import { PageHeader } from '@/components';
import { WORKSPACE } from '@/components/theme/recipes';
import { EventLogPanel, ALL_FILTER_FIELDS } from '../EventLogPanel';
import { EVENT_LOG_COPY } from '../types';

export const EventLogPage: React.FC = () => {
  return (
    <div className={WORKSPACE.page}>
      <PageHeader variant="bar" title={EVENT_LOG_COPY.panelTitle} />
      <EventLogPanel
        query={{ limit: 2000 }}
        filterUi={{ fields: ALL_FILTER_FIELDS }}
        className="min-h-0 flex-1"
      />
    </div>
  );
};
