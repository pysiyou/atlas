/**
 * @/features/lab public API — cross-feature and app-shell imports only.
 * Inside features/lab, use relative imports between subfolders.
 */

export type {
  SampleCollectionQueueItem,
  SampleCollectionRequirement,
  SampleRequirement,
  TestWithContext,
} from './types';

export type { TimelineEvent } from './api/labCommandCenter';

export { useSampleLookup } from './api/samples';
export { auditAPI } from './api/audit';

export {
  useLabStageQueueCounts,
  getValidationTabCount,
  useOpenHistoricalLabRecord,
  useLabWorkflowResponsiveCard,
} from './hooks';

export {
  getLabTabPath,
  LAB_TAB_LABELS,
  LAB_CONFIG,
} from './constants/labConstants';
export type { LabTabId } from './constants/labConstants';

export { getLabQueueUrl, getLabQueueUrlForTest } from './utils/labSearchAndLinks';
export { formatRejectionCriteriaList } from './utils/catalogRejectionCriteria';

export { LaboratoryPage } from './pages/LaboratoryPage';

export { SampleCollectionQueue } from './collection/SampleCollectionQueue';
export { ResultEntryQueue } from './entry/ResultEntryQueue';
export { ResultValidationQueue } from './validation/ResultValidationQueue';
export { LabCommandCenterBoard } from './commandCenter/LabCommandCenterBoard';

export { LabWorkflowQueueLayout } from './components/LabWorkflowQueueLayout';
export { LabWorkflowCardShell } from './components/LabWorkflowCardShell';
export { LabWorkflowDetailModal } from './components/LabWorkflowDetailModal';
export { LabQueueFilters } from './components/LabQueueFilters';

export {
  BlockedReasonBadge,
  ReviewRequiredBadge,
  FlagCountBadge,
  RetestBadge,
  RecollectionAttemptBadge,
} from './components/LabResultStatusBadges';

export {
  LabDepartmentBadge,
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from './components/LabDomainBadges';

export { SampleCollectionDetailModal } from './collection/SampleCollectionDetailModal';
export { ResultEntryDetailModal } from './entry/ResultEntryDetailModal';
export { ResultValidationDetailModal } from './validation/ResultValidationDetailModal';
export { EscalationResolutionModal } from './validation/EscalationResolutionModal';

export { PendingCriticalValuesPanel } from './criticalValues/PendingCriticalValuesPanel';
