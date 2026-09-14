/**
 * useLabPipelineCounts - Shared tab badge counts for the laboratory page.
 * Delegates to useLabDataProvider for a single derivation path.
 */

import { useLabDataProvider, type LabPipelineCounts, getValidationTabCount } from './useLabDataProvider';

export type { LabPipelineCounts };
export { getValidationTabCount };

export function useLabPipelineCounts() {
  const { pipelineCounts: counts, isError, error, refetch } = useLabDataProvider();
  return { counts, isError, error, refetch };
}
