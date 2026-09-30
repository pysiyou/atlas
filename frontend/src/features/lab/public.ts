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

export { useSampleLookup } from './api/samples';

export {
  useLabStageQueueCounts,
  getValidationTabCount,
  useLabWorkflowResponsiveCard,
} from './hooks';

export { getLabTabPath, getLaneVisual, getStageVisual, getKpiStageVisual, isLabWorkflowStageTab, LAB_TAB_LABELS, LAB_CONFIG } from './constants/labConstants';
export type { LabTabId, LabTimelineLane, LabWorkflowKpiStage, LabWorkflowStage } from './constants/labConstants';

export { ResultsParameterGrid } from './components/ResultsParameterGrid';

export { getLabQueueUrl, getLabQueueUrlForTest } from './utils/labSearchAndLinks';
export { formatRejectionCriteriaList } from './utils/catalogRejectionCriteria';
export { parseResultEntry, statusMapFromFlags } from './utils/labResult';

export { LaboratoryPage } from './pages/LaboratoryPage';

export { SampleCollectionQueue } from './collection/SampleCollectionQueue';
export { ResultEntryQueue } from './entry/ResultEntryQueue';
export { ResultValidationQueue } from './validation/ResultValidationQueue';
export { LabMonitorBoard } from './monitor/LabMonitorBoard';

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
