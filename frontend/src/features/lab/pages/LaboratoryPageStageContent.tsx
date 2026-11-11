/**
 * Lab page stage body: the active queue/board. Chrome (filters, table headers) is local;
 * one body fill stays up until that tab’s data is ready.
 */

import { useClientListChrome } from '@/hooks';
import type { UserRole } from '@/types';
import type { LabTabId } from '../constants/labConstants';
import { WORKLIST_SHELL } from '@/theme/recipes';
import { tabAllowed } from './laboratoryPageAccess';
import { SampleCollectionQueue } from '../collection/SampleCollectionQueue';
import { ResultEntryQueue } from '../entry/ResultEntryQueue';
import { ResultValidationQueue } from '../validation/ResultValidationQueue';
import { LabMonitorBoard } from '../monitor/LabMonitorBoard';

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
  useClientListChrome({
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
            <LabMonitorBoard monitorActive />
          </div>
        )}
      </div>
    </div>
  );
}
