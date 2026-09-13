// Re-exports
export * from './hooks';
export * from './types';
export * from './constants';
export * from './utils';

// API re-exports
export { useSampleLookup } from './api/samples.api';

// Pages
export { Laboratory as LaboratoryPage } from './pages/LaboratoryPage';

// Views
export { CollectionView } from './collection/CollectionView';
export { EntryView } from './entry/EntryView';
export { ValidationView } from './validation/ValidationView';
export { LabTechBoard } from './command-center';

// Components (selectively exported)
export { LabWorkflowView } from './components/LabWorkflowView';
export { LabCard } from './components/LabCard';
export { LabDetailModal } from './components/LabDetailModal';
export { LabFilters } from './components/LabFilters';
export { PopoverForm } from './components/PopoverForm';
export { useResponsiveCard } from './components/ResponsiveCard';

// Critical Values
export { CriticalValuesPanel } from './critical-values/CriticalValuesPanel';
