import type { UserRole } from '@/types';
import { ErrorAlert } from '@/components';
import { WORKSPACE } from '@/components/theme/recipes';
import { errorAlertMessage } from '@/utils/feedback';
import { SampleCollectionQueue } from '../collection/SampleCollectionQueue';
import { ResultEntryQueue } from '../entry/ResultEntryQueue';
import { ResultValidationQueue } from '../validation/ResultValidationQueue';
import { LabMonitorBoard } from '../monitor/LabMonitorBoard';
import type { LabTabId } from '../constants/labConstants';
import { LAB_WORKFLOW_QUEUE_SHELL } from '../utils/labStyles';
import { tabAllowed } from './laboratoryPageAccess';

export interface LaboratoryPageStageContentProps {
  activeTab: LabTabId;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
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
          : LAB_WORKFLOW_QUEUE_SHELL
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
      </div>
    </div>
  );
}
