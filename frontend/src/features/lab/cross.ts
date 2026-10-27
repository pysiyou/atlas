/**
 * Lean lab surface for cross-feature imports (no workflow modals / lab page shells).
 */

export type {
  SampleCollectionQueueItem,
  SampleCollectionRequirement,
  SampleRequirement,
  TestWithContext,
} from './types';

export { sampleAPI, useSampleLookup, createSampleLookupForOrder } from './api/samples';

export {
  useLabStageQueueCounts,
  getValidationTabCount,
  useLabWorkflowResponsiveCard,
} from './hooks';

export {
  getLabTabPath,
  getStageVisual,
  getKpiStageVisual,
  LAB_TAB_LABELS,
  LAB_CONFIG,
} from './constants/labConstants';
export type { LabTabId, LabWorkflowKpiStage, LabWorkflowStage } from './constants/labConstants';

export { ResultsParameterGrid } from './components/ResultsParameterGrid';
export type { ResultsGridLayout } from './components/ResultsParameterGrid';
export { ResultValueAnnotations } from './components/ResultValueAnnotations';

export {
  getLabQueueUrl,
  getLabQueueUrlForTest,
  getLabQueueUrlForSample,
  getLabQueueUrlForOrder,
  hasTestResults,
} from './utils/labSearchAndLinks';
export { formatVolume } from './utils/labSample';
export { formatRejectionCriteriaList } from './utils/catalogRejectionCriteria';
export {
  getParameterReferenceIntervalLines,
  parseResultEntry,
  statusMapFromFlags,
} from './utils/labResult';

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
  ResultValidationForm,
  ResultValidationPanel,
  ResultValidationResultsBody,
  ResultValidationNotesSection,
} from './validation/ResultValidationForm';
export { TestHeaderBadges } from './components/LabWorkflowBadges';
export { useSampleRejectionDisplay } from './hooks/useSampleRejectionDisplay';
export { SampleRejectedBanner } from './components/SampleRejectedBanner';
export { PendingCriticalValuesPanel } from './criticalValues/PendingCriticalValuesPanel';
