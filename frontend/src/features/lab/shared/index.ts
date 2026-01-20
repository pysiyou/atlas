/**
 * Lab Shared Components Index
 * 
 * Exports all shared components for lab workflows.
 */

// Card components
export { LabCard, ProgressBadge, FlagsSection, TestList } from './LabCard';
export { LAB_CARD_TYPOGRAPHY, LAB_CARD_SPACING, LAB_CARD_CONTAINERS, LAB_CARD_LIST_ITEMS, LAB_CARD_CONTEXT, LAB_CARD_HEADER } from './labCardStyles';

// Popover form
export { PopoverForm, RadioCard, CheckboxCard } from './PopoverForm';

// Rejection dialog
export { RejectionDialog, RejectionDialogContent, RejectionHistoryBanner } from './RejectionDialog';

// Hooks
export { useRejectionManager } from './hooks';

// Workflow view
export { LabWorkflowView, createLabItemFilter } from './LabWorkflowView';

// Detail modal
export { LabDetailModal, DetailSection, DetailGrid, ModalFooter, StatusBadgeRow } from './LabDetailModal';

// Status badges
export {
  ContainerInfo,
  CollectionInfoLine,
  VolumeBadge,
  FlagBadge,
  RecollectionBadge,
  ParameterProgressBadge,
  ResultStatusBadge,
  EntryInfoLine,
} from './StatusBadges';

// Utilities
export {
  handlePrintSampleLabel,
  createSampleDisplayFilter,
  formatRejectionReasons,
  getContainerDisplayName,
  hasContainerInfo,
  getEffectiveContainerType,
  buildTestKey,
  buildSampleKey,
} from './labUtils';
