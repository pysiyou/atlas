/**
 * Lab page stage body: lazy-loads the active queue/board so inactive tabs stay out of the bundle.
 */
import { lazy, Suspense } from 'react';
import { useClientListChrome } from '@/hooks';
import type { UserRole } from '@/types';
import { ErrorAlert } from '@/components/feedback';
import { Card } from '@/components/surfaces';
import { WORKSPACE, SPACING } from '@/theme/recipes';
import type { LabTabId } from '../constants/labConstants';
import { WORKLIST_SHELL } from '@/theme/recipes';
import { tabAllowed } from './laboratoryPageAccess';
import { LabMonitorBoard } from '../monitor/LabMonitorBoard';

const SampleCollectionQueue = lazy(() =>
  import('../collection/SampleCollectionQueue').then(module => ({
    default: module.SampleCollectionQueue,
  }))
);
const ResultEntryQueue = lazy(() =>
  import('../entry/ResultEntryQueue').then(module => ({
    default: module.ResultEntryQueue,
  }))
);
const ResultValidationQueue = lazy(() =>
  import('../validation/ResultValidationQueue').then(module => ({
    default: module.ResultValidationQueue,
  }))
);

export interface LaboratoryPageStageContentProps {
  activeTab: LabTabId;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
}

function StageFallback({ isMonitor }: { isMonitor: boolean }) {
  if (isMonitor) {
    return <LabMonitorBoard loading />;
  }
  return (
    <div className={`${WORKSPACE.contentInset} flex flex-col ${SPACING.gapSection}`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} padding="md" loading className="min-h-[140px]" />
      ))}
    </div>
  );
}

export function LaboratoryPageStageContent({
  activeTab,
  hasRole,
  isError,
  error,
  onRetry,
}: LaboratoryPageStageContentProps) {
  const chrome = useClientListChrome({
    loadFailedKey: 'lab.page.loadFailed',
    isLoading: false,
    isError,
    error,
    refetch: onRetry,
  });

  return (
    <div
      className={
        activeTab === 'monitor'
          ? 'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden'
          : WORKLIST_SHELL
      }
    >
      {chrome.error && (
        <div className={`${WORKSPACE.contentInset} shrink-0 pb-0`}>
          <ErrorAlert error={chrome.error} onRetry={chrome.onRetry} />
        </div>
      )}
      <div
        className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
          activeTab === 'monitor' ? '' : 'bg-surface-page'
        }`}
      >
        <Suspense fallback={<StageFallback isMonitor={activeTab === 'monitor'} />}>
          {activeTab === 'collection' && tabAllowed('collection', hasRole) && (
            <SampleCollectionQueue />
          )}
          {activeTab === 'entry' && tabAllowed('entry', hasRole) && <ResultEntryQueue />}
          {activeTab === 'validation' && tabAllowed('validation', hasRole) && (
            <ResultValidationQueue />
          )}
          {activeTab === 'monitor' && tabAllowed('monitor', hasRole) && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <LabMonitorBoard />
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
