/**
 * Lab workflow UI — queue list cards and detail modals (shells).
 * Stage queues and business actions live in collection/entry/validation.
 * See ARCHITECTURE.md in the lab feature root.
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
export { TestDetailModal } from './modals/detailModal.testDetail';
export { EscalationResolutionModal } from './modals/detailModal.escalation';
