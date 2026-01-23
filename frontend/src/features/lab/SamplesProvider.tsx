/**
 * Samples Provider Component
 *
 * @deprecated This provider delegates to TanStack Query hooks and is kept for backward compatibility.
 * New components should use TanStack Query hooks directly from @/hooks/queries:
 * - useSamplesList() for fetching samples
 * - useSample(id) for single sample
 * - usePendingSamples() for pending samples
 * - useCollectSample() for collecting
 * - useRejectSample() for rejecting
 *
 * This provider will be removed once all consumers are migrated to TanStack Query hooks.
 */

import React, { useCallback, useMemo, type ReactNode } from 'react';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
  RejectionReason,
} from '@/types';
import { SamplesContext, type SamplesContextType, type SampleError } from './SamplesContext';
import {
  useSamplesList,
  usePendingSamples,
  useCollectSample,
  useRejectSample,
  useRequestRecollection,
  useInvalidateSamples,
} from '@/hooks/queries';
import { logger } from '@/utils/logger';

interface SamplesProviderProps {
  children: ReactNode;
}

/**
 * SamplesProvider - Backward compatible wrapper around TanStack Query
 *
 * Delegates data fetching to useSamplesList() hook which provides:
 * - 30 second stale time (dynamic data)
 * - Request deduplication
 * - Automatic cache invalidation on mutations
 */
export const SamplesProvider: React.FC<SamplesProviderProps> = ({ children }) => {
  // Delegate to TanStack Query hooks for data fetching
  const { samples, isLoading: loading, isError, error: queryError, refetch } = useSamplesList();
  const { invalidateAll } = useInvalidateSamples();

  // Mutation hooks
  const collectSampleMutation = useCollectSample();
  const rejectSampleMutation = useRejectSample();
  const requestRecollectionMutation = useRequestRecollection();

  // Pending samples query
  const { samples: pendingSamplesData } = usePendingSamples();

  // Format error for backward compatibility
  const error: SampleError | null = useMemo(() => {
    if (!isError) return null;
    return {
      message: queryError instanceof Error ? queryError.message : 'Failed to load samples',
      operation: 'load',
    };
  }, [isError, queryError]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    // With TanStack Query, errors are cleared on successful refetch
  }, []);

  /**
   * Refresh samples from backend
   */
  const refreshSamples = useCallback(async () => {
    await invalidateAll();
    await refetch();
  }, [invalidateAll, refetch]);

  /**
   * Get a sample by ID (local lookup)
   */
  const getSample = useCallback(
    (sampleId: number | string) => {
      const numericId = typeof sampleId === 'string' ? parseInt(sampleId, 10) : sampleId;
      if (isNaN(numericId)) return undefined;
      return samples.find(s => s.sampleId === numericId);
    },
    [samples]
  );

  /**
   * Get samples by order ID (local filter)
   */
  const getSamplesByOrder = useCallback(
    (orderId: number | string) => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      if (isNaN(numericId)) return [];
      return samples.filter(s => s.orderId === numericId);
    },
    [samples]
  );

  /**
   * Get samples by patient ID (local filter)
   */
  const getSamplesByPatient = useCallback(
    (patientId: number | string, orders: Array<{ orderId: number; patientId: number }>) => {
      const numericPatientId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
      if (isNaN(numericPatientId)) return [];
      const orderIds = orders.filter(o => o.patientId === numericPatientId).map(o => o.orderId);
      return samples.filter(s => orderIds.includes(s.orderId));
    },
    [samples]
  );

  /**
   * Get samples by status (local filter)
   */
  const getSamplesByStatus = useCallback(
    (status: SampleStatus) => {
      return samples.filter(s => s.status === status);
    },
    [samples]
  );

  /**
   * Get pending samples from backend
   */
  const getPendingSamples = useCallback(async (): Promise<Sample[]> => {
    return pendingSamplesData;
  }, [pendingSamplesData]);

  /**
   * Collect a sample via backend API
   */
  const collectSample = useCallback(
    async (
      sampleId: number | string,
      collectedVolume: number,
      actualContainerType: ContainerType,
      actualContainerColor: ContainerTopColor,
      collectionNotes?: string
    ) => {
      try {
        const sampleIdStr = typeof sampleId === 'string' ? sampleId : sampleId.toString();
        await collectSampleMutation.mutateAsync({
          sampleId: sampleIdStr,
          collectedVolume,
          actualContainerType,
          actualContainerColor,
          collectionNotes,
        });
      } catch (err) {
        logger.error('Failed to collect sample', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [collectSampleMutation]
  );

  /**
   * Reject a sample via backend API
   */
  const rejectSample = useCallback(
    async (
      sampleId: number | string,
      reasons: RejectionReason[],
      notes?: string,
      requireRecollection: boolean = true
    ) => {
      try {
        const sampleIdStr = typeof sampleId === 'string' ? sampleId : sampleId.toString();
        await rejectSampleMutation.mutateAsync({
          sampleId: sampleIdStr,
          reasons,
          notes,
          requireRecollection,
        });
      } catch (err) {
        logger.error('Failed to reject sample', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [rejectSampleMutation]
  );

  /**
   * Request recollection for a rejected sample
   */
  const requestRecollection = useCallback(
    async (sampleId: number | string, reason: string) => {
      try {
        const sampleIdStr = typeof sampleId === 'string' ? sampleId : sampleId.toString();
        await requestRecollectionMutation.mutateAsync({ sampleId: sampleIdStr, reason });
      } catch (err) {
        logger.error('Failed to request recollection', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [requestRecollectionMutation]
  );

  const value: SamplesContextType = {
    samples,
    loading,
    error,
    refreshSamples,
    getSample,
    getSamplesByOrder,
    getSamplesByPatient,
    getSamplesByStatus,
    getPendingSamples,
    collectSample,
    rejectSample,
    requestRecollection,
    clearError,
  };

  return <SamplesContext.Provider value={value}>{children}</SamplesContext.Provider>;
};
