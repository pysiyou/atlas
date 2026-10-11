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

export { SampleCollectionCard, type SampleCollectionCardProps } from './queueCard.sampleCollection';
export {
  useSampleCollectionCardData,
  type SampleCollectionCardSharedData,
} from './queueCard.sampleCollection.data';

export { ResultEntryCard, type ResultEntryCardProps } from './queueCard.resultEntry';
export { ResultValidationCard, type ResultValidationCardProps } from './queueCard.resultValidation';
export { EscalationCard, type EscalationCardProps } from './queueCard.escalation';
export { SampleRecollectionRequestCard } from './queueCard.recollectionApproval';

export {
  QueueModalShell,
  DetailGrid,
  ModalFooter,
  labModalSubtitle,
  type QueueModalShellProps,
  type DetailGridSectionConfig,
} from './detailModalLayout';

export { SampleCollectionDetailModal } from './detailModal.sampleCollection';
export { ResultEntryDetailModal } from './detailModal.resultEntry';
export { ResultValidationDetailModal } from './detailModal.resultValidation';
export { EscalationResolutionModal } from './detailModal.escalation';
