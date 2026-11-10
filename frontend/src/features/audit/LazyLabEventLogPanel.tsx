/**
 * Code-split wrapper — loads LabEventLogPanel (and audit catalog) only when embedded in lab UI.
 */
import React, { lazy, Suspense } from 'react';
import { Panel } from '@/components/surfaces/Panel';

const LabEventLogPanelLazy = lazy(() =>
  import('./EventLogPanel').then(m => ({ default: m.LabEventLogPanel }))
);

export interface LazyLabEventLogPanelProps {
  testId?: number;
  sampleId?: number;
  className?: string;
}

export const LazyLabEventLogPanel: React.FC<LazyLabEventLogPanelProps> = props => (
  <Suspense
    fallback={
      <Panel preset="panel.compactEmbed.auto" title="Activity" loading loadingShape="list" loadingRows={4} />
    }
  >
    <LabEventLogPanelLazy {...props} />
  </Suspense>
);
