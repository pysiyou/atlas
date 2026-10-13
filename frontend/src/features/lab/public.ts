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

export { sampleAPI, useSampleLookup } from './api/samples';

export {
  useLabStageQueueCounts,
  getValidationTabCount,
  useLabWorkflowResponsiveCard,
} from './hooks';

export { getLabTabPath, getLaneVisual, getStageVisual, getKpiStageVisual, isLabWorkflowStageTab, LAB_TAB_LABELS, LAB_CONFIG } from './constants/labConstants';
export type { LabTabId, LabTimelineLane, LabWorkflowKpiStage, LabWorkflowStage } from './constants/labConstants';

export { ResultsParameterGrid } from './components/ResultsParameterGrid';

export { getLabQueueUrl, getLabQueueUrlForTest, getLabQueueUrlForSample, getLabQueueUrlForOrder, hasTestResults } from './utils/labSearchAndLinks';
export { formatVolume } from './utils/labSample';
export { formatRejectionCriteriaList } from './utils/catalogRejectionCriteria';
export { parseResultEntry, statusMapFromFlags } from './utils/labResult';

export { LaboratoryPage } from './pages/LaboratoryPage';

export { SampleCollectionQueue } from './collection/SampleCollectionQueue';
export { ResultEntryQueue } from './entry/ResultEntryQueue';
export { ResultValidationQueue } from './validation/ResultValidationQueue';
export { LabMonitorBoard } from './monitor/LabMonitorBoard';

export { LabWorkflowQueueLayout } from './components/LabWorkflowQueueLayout';
export { QueueCard } from './workflow';
export { LabQueueFilters } from './components/LabQueueFilters';

export {
  AttentionReasonBadge,
  SupervisorApprovalBadge,
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

export {
  SampleCollectionDetailModal,
  ResultEntryDetailModal,
  TestDetailModal,
  EscalationResolutionModal,
  QueueModalShell,
  ModalFooter,
  labModalSubtitle,
  type LabModalStage,
} from './workflow';
export { ResultValidationForm } from './validation/ResultValidationForm';
export { TestHeaderBadges } from './components/LabWorkflowBadges';
export { TestWorkflowCardLeftColumn } from './workflow/queueCard.testWorkflowLeftColumn';
export { useSampleRejectionDisplay } from './hooks/useSampleRejectionDisplay';
export { SampleRejectedBanner } from './components/SampleRejectedBanner';

export { PendingCriticalValuesPanel } from './criticalValues/PendingCriticalValuesPanel';
