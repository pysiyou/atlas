/**
 * Code-split wrapper — loads LabEventLogPanel (and audit catalog) only when embedded in lab UI.
 */
import { lazy, Suspense } from 'react';
import { Panel } from '@/components/surfaces/Panel';
import { useModuleListTitles } from '@/strings';

const LabEventLogPanelLazy = lazy(() =>
  import('./EventLogPanel').then(m => ({ default: m.LabEventLogPanel }))
);

export interface LazyLabEventLogPanelProps {
  testId?: number;
  sampleId?: string;
  className?: string;
}

export function LazyLabEventLogPanel(props: LazyLabEventLogPanelProps) {
  const activityTitle = useModuleListTitles().activity;
  return (
  <Suspense
    fallback={
      <Panel preset="panel.compactEmbed.auto" title={activityTitle} loading />
    }
  >
    <LabEventLogPanelLazy {...props} />
  </Suspense>
  );
}
