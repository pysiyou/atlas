/**
 * Samples Provider Component
 * Manages sample collection and tracking using backend API with proper error handling
 */

import React, { useCallback, useState, useEffect, type ReactNode } from 'react';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
  RejectionReason,
} from '@/types';
import { SamplesContext, type SamplesContextType, type SampleError } from './SamplesContext';
import { sampleAPI } from '@/services/api';

interface SamplesProviderProps {
  children: ReactNode;
}

export const SamplesProvider: React.FC<SamplesProviderProps> = ({ children }) => {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SampleError | null>(null);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh samples from backend
   */
  const refreshSamples = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sampleAPI.getAll();
      setSamples(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load samples';
      console.error('Failed to load samples:', err);
      setError({
        message: errorMessage,
        operation: 'load',
      });
      setSamples([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load samples on mount
  useEffect(() => {
    refreshSamples();
  }, [refreshSamples]);

  /**
   * Get a sample by ID (local lookup)
   */
  const getSample = useCallback((sampleId: string) => {
    return samples.find((s) => s.sampleId === sampleId);
  }, [samples]);

  /**
   * Get samples by order ID (local filter)
   */
  const getSamplesByOrder = useCallback((orderId: string) => {
    return samples.filter((s) => s.orderId === orderId);
  }, [samples]);

  /**
   * Get samples by patient ID (local filter)
   */
  const getSamplesByPatient = useCallback((patientId: string, orders: Array<{ orderId: string; patientId: string }>) => {
    const orderIds = orders.filter((o) => o.patientId === patientId).map((o) => o.orderId);
    return samples.filter((s) => orderIds.includes(s.orderId));
  }, [samples]);

  /**
   * Get samples by status (local filter)
   */
  const getSamplesByStatus = useCallback((status: SampleStatus) => {
    return samples.filter((s) => s.status === status);
  }, [samples]);

  /**
   * Get pending samples from backend
   */
  const getPendingSamples = useCallback(async (): Promise<Sample[]> => {
    try {
      return await sampleAPI.getPending();
    } catch (err) {
      console.error('Failed to get pending samples:', err);
      return [];
    }
  }, []);

  /**
   * Collect a sample via backend API
   */
  const collectSample = useCallback(async (
    sampleId: string,
    collectedVolume: number,
    actualContainerType: ContainerType,
    actualContainerColor: ContainerTopColor,
    collectionNotes?: string
  ) => {
    try {
      await sampleAPI.collect(sampleId, {
        collectedVolume,
        actualContainerType,
        actualContainerColor,
        collectionNotes,
      });
      await refreshSamples();
    } catch (err) {
      console.error('Failed to collect sample:', err);
      throw err;
    }
  }, [refreshSamples]);

  /**
   * Reject a sample via backend API
   */
  const rejectSample = useCallback(async (
    sampleId: string,
    reasons: RejectionReason[],
    notes?: string,
    requireRecollection: boolean = true
  ) => {
    try {
      await sampleAPI.reject(sampleId, {
        rejectionReasons: reasons,
        rejectionNotes: notes,
        recollectionRequired: requireRecollection,
      });
      await refreshSamples();
    } catch (err) {
      console.error('Failed to reject sample:', err);
      throw err;
    }
  }, [refreshSamples]);

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
    clearError,
  };

  return <SamplesContext.Provider value={value}>{children}</SamplesContext.Provider>;
};
