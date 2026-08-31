/**
 * Lab Feature - Main Exports
 *
 * Core lab infrastructure shared across workflow features.
 * Sub-features have been promoted to top-level features:
 *   - @/features/lab-collection
 *   - @/features/lab-command-center
 *   - @/features/lab-validation
 *   - @/features/lab-entry
 *   - @/features/reports
 */

// Shared lab components (LabCard, LabFilters, LabWorkflowView, etc.)
export * from './components';

// Pages (LaboratoryPage router)
export * from './pages';

// Hooks (useLabWorkflowFilters, useRejectionManager, etc.)
export * from './hooks';

// Utils
export * from './utils';

// Types (SampleDisplay, LabOperationType, etc.)
export * from './types';

// Constants
export * from './constants';
