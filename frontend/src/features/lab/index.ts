// Re-exports
export * from './hooks';
export * from './types';
export * from './constants';
export * from './utils';

// API re-exports
export { useSampleLookup } from './api/samples';
export { auditAPI } from './api/audit';
export type { TimelineEvent } from './api/labCommandCenter';

// Pages
export { LaboratoryPage } from './pages/LaboratoryPage';

// Views
export { SampleCollectionQueue } from './collection/SampleCollectionQueue';
export { ResultEntryQueue } from './entry/ResultEntryQueue';
export { ResultValidationQueue } from './validation/ResultValidationQueue';
export { LabCommandCenterBoard } from './commandCenter/LabCommandCenterBoard';

// Components (selectively exported)
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
export { useOpenHistoricalLabRecord } from './hooks/useOpenHistoricalLabRecord';
export { useLabWorkflowResponsiveCard } from './hooks/useLabWorkflowResponsiveCard';

export { SampleCollectionDetailModal } from './collection/SampleCollectionDetailModal';
export { ResultEntryDetailModal } from './entry/ResultEntryDetailModal';
export { ResultValidationDetailModal } from './validation/ResultValidationDetailModal';
export { EscalationResolutionModal } from './validation/EscalationResolutionModal';

// Critical Values
export { PendingCriticalValuesPanel } from './criticalValues/PendingCriticalValuesPanel';
