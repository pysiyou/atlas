/**
 * Lab feature utils — explicit exports (no export *).
 */

export {
  WORKLIST_CARD_ALERT,
  WORKLIST_CARD_BADGE_SIZE,
  WORKLIST_CARD_SURFACE,
  IDENTITY_INLINE,
  CARD_ACTIONS_ROW,
  CARD_HEADER_GRID,
  WORKLIST_CARD_LIST_ITEM,
  IDENTITY_STACK,
  WORKLIST_CARD_SPACING,
  WORKLIST_EMPHASIZED_INLINE,
  WORKLIST_HEADER,
  MOBILE_LIST_CARD,
  MODAL_DETAIL_LAYOUT,
  MODAL_HEADER_LAYOUT,
  SEGMENTED_CONTROL,
  WORKLIST_SHELL,
} from '@/theme/recipes';

export { formatRejectionReasons, getSampleRejectionReasonLabel } from './labFormatters';
export { deriveRetestContext, type TestRetestContext } from './deriveRetestContext';
export { buildLabFilterConfig, type BuildLabFilterConfigOptions } from './buildLabFilterConfig';
export { formatRejectionCriteriaList } from './catalogRejectionCriteria';
export {
  getSampleDefinition,
  getCollectionRequirements,
  groupTestsBySample,
  calculateTotalVolume,
  formatVolume,
  getContainerIconColor,
  isBloodDerivedSampleType,
  getEffectiveContainerType,
  getCollectionTopColorBg,
  getDefaultCollectionTopColor,
  printSampleCollectionLabel,
  type SampleDefinition,
  type CollectionPopoverTopColor,
  type SampleRequirement,
} from './labSample';
export {
  isCritical,
  statusMapFromFlags,
  parseResultEntry,
  checkReferenceRange,
  getPatientSpecificRange,
  isCriticalValue,
  checkReferenceRangeWithDemographics,
  normalizeReferenceRangeDisplay,
  getParameterReferenceIntervalLines,
  formatReferenceRange,
  getPhysiologicLimit,
  validatePhysiologicValue,
  resultTileStatusClass,
  resultValueClass,
  resultStatusLabel,
  PHYSIOLOGIC_LIMITS,
  type ResultStatus,
  type PhysiologicLimit,
  type ReferenceRangeDisplay,
  type ReferenceIntervalLine,
  type ValidationResult,
} from './labResult';
export {
  compareQueuePriority,
  getQueueAgeInfo,
  isLabActionAllowed,
  deriveOrderTestQueueState,
  ATTENTION_LABELS,
  type LabAttentionReason,
  type QueueAgeInfo,
  type OrderTestQueueStage,
  type LabWorkItemProjectionLike,
  type OrderTestQueueContext,
  type OrderTestQueueState,
} from './queueDisplay';
export {
  mapCollectionWorklistToSampleDisplay,
  mapEntryWorklistToOrderTestContext,
  mapValidationWorklistToOrderTestContext,
} from './worklistMappers';
export {
  hasActiveRecordUrlFilters,
  getLabQueueSearchFromUrlFilters,
  orderTestKey,
  worklistServerFilters,
  hasTestResults,
  resolveCollectionStatusFilters,
  getLabQueueUrlForTest,
  getLabQueueUrlForSample,
  getLabQueueUrlForOrder,
  getLabTabForTestStatus,
  getLabQueueUrl,
  type LabTabId,
} from './labSearchAndLinks';
export { findCollectionQueueItem } from './findCollectionQueueItem';
export {
  buildCollectionOperationalMetaItems,
  type CollectionOperationalMetaItem,
  type BuildCollectionOperationalMetaItemsInput,
} from './collectionOperationalMetaItems';
export {
  parseAnalyticalFlags,
  analyticalFlagLabel,
  analyticalFlagDetail,
  formatAnalyticalFlag,
  type AnalyticalFlag,
} from './analyticalFlags';
export {
  decodeLabQueueBarFilters,
  writeLabQueueBarFilters,
  LAB_QUEUE_BAR_URL_KEYS,
  type LabQueueBarUrlKey,
  type LabQueueBarFilters,
} from './labQueueUrlCodec';
export {
  getLabQueueStageConfig,
  LAB_QUEUE_STAGE_FILTER_CONFIGS,
  type LabQueueWorkflowType,
  type LabQueueItemByStage,
  type LabQueueStageFilterConfig,
} from './labQueueStageFilterConfig';
export {
  VALIDATION_REVIEW_ESCALATION_PROFILE,
  VALIDATION_REVIEW_RECOLLECTION_PROFILE,
  type LabQueueSecondaryFilterProfile,
} from './labQueueSecondaryProfiles';
