/**
 * Central export for all hooks
 */

// Re-export filtering hooks from consolidated module
export { useFiltering, useSearch, useMultiSelect } from '@/utils/filtering';

// Re-export from features for convenience
export { useAuth } from '@/features/auth/useAuth';
export { useSamples } from '@/features/lab/SamplesContext';
export { useAliquots } from '@/features/lab/AliquotsContext';
export { useUserDisplay } from '@/features/lab/useUserDisplay';

// Re-export feature hooks for convenience
export { useOrders } from '@/features/order/OrderContext';
export { useTests } from '@/features/test/TestsContext';
export { usePatients } from '@/features/patient/PatientContext';
