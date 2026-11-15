/**
 * Lab workflow UI — queue list cards and detail modals (shells).
 * Stage queues and business actions live in collection/entry/validation.
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
} from './shared/QueueCardLayout';

export {
  SampleCollectionCard,
  SampleCollectionCardLeftColumn,
  useSampleCollectionCardData,
  type SampleCollectionCardProps,
  type SampleCollectionCardSharedData,
  type SampleCollectionCardLeftColumnProps,
} from './cards/QueueCard.SampleCollection';

export { ResultEntryCard, type ResultEntryCardProps } from './cards/QueueCard.ResultEntry';
export { ResultValidationCard, type ResultValidationCardProps } from './cards/QueueCard.ResultValidation';
export { EscalationCard, type EscalationCardProps } from './cards/QueueCard.Escalation';

export {
  QueueModalShell,
  DetailGrid,
  ModalFooter,
  labModalHeaderContext,
  type LabModalStage,
  type QueueModalShellProps,
  type DetailGridSectionConfig,
} from './shared/DetailModalLayout';

export { SampleCollectionDetailModal } from './modals/DetailModal.SampleCollection';
export { ResultEntryDetailModal } from './modals/DetailModal.ResultEntry';
export { TestDetailModal } from './modals/DetailModal.TestDetail';
export { EscalationResolutionModal } from './modals/DetailModal.Escalation';
