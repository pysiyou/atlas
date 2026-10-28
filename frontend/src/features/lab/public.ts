/**
 * @/features/lab public API — re-exports cross-feature surface plus app shell / workflow.
 */

export * from './cross';

export { LaboratoryPage } from './pages/LaboratoryPage';
export { LabAllTestsPage } from './pages/LabAllTestsPage';
export { LabWorkflowQueueLayout } from './components/LabWorkflowQueueLayout';
export { QueueCard } from './workflow';
export { LabQueueFilters } from './components/LabQueueFilters';

export {
  SampleCollectionDetailModal,
  ResultEntryDetailModal,
  TestDetailModal,
  EscalationResolutionModal,
  QueueModalShell,
  ModalFooter,
  labModalHeaderContext,
  type LabModalStage,
} from './workflow';
export { TestWorkflowCardLeftColumn } from './workflow/shared/queueCardLeftColumn';
