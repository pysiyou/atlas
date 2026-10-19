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
} from './queueCardLayout';

export {
  SampleCollectionCard,
  SampleCollectionCardLeftColumn,
  useSampleCollectionCardData,
  type SampleCollectionCardProps,
  type SampleCollectionCardSharedData,
  type SampleCollectionCardLeftColumnProps,
} from './queueCard.sampleCollection';

export { ResultEntryCard, type ResultEntryCardProps } from './queueCard.resultEntry';
export { ResultValidationCard, type ResultValidationCardProps } from './queueCard.resultValidation';
export { EscalationCard, type EscalationCardProps } from './queueCard.escalation';
export { SampleRecollectionRequestCard } from './queueCard.recollectionApproval';

export {
  QueueModalShell,
  DetailGrid,
  ModalFooter,
  labModalSubtitle,
  labModalHeaderContext,
  type LabModalStage,
  type QueueModalShellProps,
  type DetailGridSectionConfig,
} from './detailModalLayout';

export { SampleCollectionDetailModal } from './detailModal.sampleCollection';
export { ResultEntryDetailModal } from './detailModal.resultEntry';
export { TestDetailModal } from './detailModal.test';
export { EscalationResolutionModal } from './detailModal.escalation';
