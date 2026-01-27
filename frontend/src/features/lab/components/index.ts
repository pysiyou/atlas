/**
 * Lab Shared Components Index
 *
 * Exports all shared components for lab workflows.
 */

// Card components
export { LabCard, ProgressBadge, FlagsSection, TestList } from './LabCard';

// Popover form
export { PopoverForm, RadioCard, CheckboxCard } from './PopoverForm';

// Rejection dialog
export { RejectionDialog, RejectionDialogContent, RejectionHistoryBanner } from './RejectionDialog';

// Hooks
export { useRejectionManager } from '../hooks/useRejectionManager';

// Workflow view
export { LabWorkflowView, createLabItemFilter } from './LabWorkflowView';

// Detail modal
export { LabDetailModal, DetailGrid, ModalFooter, StatusBadgeRow } from './LabDetailModal';
export type { DetailGridSectionConfig } from './LabDetailModal';

// Status badges
export {
  CollectionInfoLine,
  ResultStatusBadge,
  EntryInfoLine,
  RetestBadge,
  RecollectionAttemptBadge,
  FlagCountBadge,
  ReviewRequiredBadge,
} from './StatusBadges';

// Utilities
export {
  handlePrintCollectionLabel,
  formatRejectionReasons,
  getEffectiveContainerType,
} from './labUtils';
