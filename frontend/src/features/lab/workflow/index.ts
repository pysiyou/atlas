/**
 * Lab workflow UI — queue list cards and detail modals.
 */

export {
  QueueCard,
  QueueCardMobile,
  QueueCardHeader,
  QueueCardPanel,
  QueueCardTestList,
  QueueCardProgressMeta,
  type QueueCardProps,
  type QueueCardMobileProps,
  type QueueCardHeaderProps,
  type QueueCardPanelProps,
} from './shared/queueCardLayout';

export {
  SampleCollectionCard,
  SampleCollectionCardLeftColumn,
  useSampleCollectionCardData,
  type SampleCollectionCardProps,
  type SampleCollectionCardSharedData,
  type SampleCollectionCardLeftColumnProps,
} from './cards/queueCard.sampleCollection';

export { ResultEntryCard, type ResultEntryCardProps } from './cards/queueCard.resultEntry';
export { ResultValidationCard, type ResultValidationCardProps } from './cards/queueCard.resultValidation';
export { EscalationCard, type EscalationCardProps } from './cards/queueCard.escalation';
export { SampleRecollectionRequestCard } from './cards/queueCard.recollectionApproval';

export {
  QueueModalShell,
  DetailGrid,
  ModalFooter,
  labModalHeaderContext,
  type LabModalStage,
  type QueueModalShellProps,
  type DetailGridSectionConfig,
} from './shared/detailModalLayout';

export { SampleCollectionDetailModal } from './modals/detailModal.sampleCollection';
export { ResultEntryDetailModal } from './modals/detailModal.resultEntry';
export { TestDetailModal } from './modals/detailModal.test';
export { EscalationResolutionModal } from './modals/detailModal.escalation';
