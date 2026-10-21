/**
 * Lab page stage body: lazy-loads the active queue/board so inactive tabs stay out of the bundle.
 */
import { lazy, Suspense } from 'react';
import type { UserRole } from '@/types';
import { ErrorAlert } from '@/components/loaders';
import { WORKSPACE } from '@/theme/recipes';
import { errorAlertMessage } from '@/utils/feedback';
import type { LabTabId } from '../constants/labConstants';
import { WORKLIST_SHELL } from '@/theme/recipes';
import { tabAllowed } from './laboratoryPageAccess';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';

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
const LabMonitorBoard = lazy(() =>
  import('../monitor/LabMonitorBoard').then(module => ({
    default: module.LabMonitorBoard,
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
  return <DetailPageSkeleton variant={isMonitor ? 'responsive-detail' : 'workflow-grid'} />;
}

export function LaboratoryPageStageContent({
  activeTab,
  hasRole,
  isError,
  error,
  onRetry,
}: LaboratoryPageStageContentProps) {
  return (
    <div
      className={
        activeTab === 'monitor'
          ? 'flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden'
          : WORKLIST_SHELL
      }
    >
      {isError && (
        <div className={`${WORKSPACE.contentInset} shrink-0 pb-0`}>
          <ErrorAlert
            error={{
              message: errorAlertMessage('lab.page.loadFailed', error),
            }}
            onRetry={onRetry}
          />
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
