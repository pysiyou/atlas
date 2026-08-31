/**
 * Lab Feature — public API
 *
 * Consolidated lab domain: collection, entry, validation, command-center, critical-values.
 */

export { Laboratory } from './pages/LaboratoryPage';

// Sub-domain views (for cross-feature imports)
export { CollectionView } from './collection/CollectionView';
export { EntryView } from './entry/EntryView';
export { ValidationView } from './validation/ValidationView';
export { EscalationView } from './validation/EscalationView';
export { CommandCenterView } from './command-center/CommandCenterView';
export { CriticalValuesPanel } from './critical-values/CriticalValuesPanel';

// Shared infrastructure
export * from './components';
export * from './hooks';
export * from './constants';
