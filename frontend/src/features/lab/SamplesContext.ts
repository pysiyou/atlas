/**
 * Samples Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext, useContext } from 'react';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
  RejectionReason,
} from '@/types';

/**
 * Error state for sample operations
 */
export interface SampleError {
  message: string;
  code?: string;
  operation?: 'load' | 'collect' | 'reject' | 'update';
}

/**
 * SamplesContext type definition
 */
export interface SamplesContextType {
  /** List of all samples */
  samples: Sample[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: SampleError | null;
  /** Refresh samples from backend */
  refreshSamples: () => Promise<void>;

  // Query operations
  getSample: (sampleId: string) => Sample | undefined;
  getSamplesByOrder: (orderId: string) => Sample[];
  getSamplesByPatient: (patientId: string, orders: Array<{ orderId: string; patientId: string }>) => Sample[];
  getSamplesByStatus: (status: SampleStatus) => Sample[];
  getPendingSamples: () => Promise<Sample[]>;

  // Collection operations (async - call backend API)
  collectSample: (
    sampleId: string,
    collectedVolume: number,
    actualContainerType: ContainerType,
    actualContainerColor: ContainerTopColor,
    collectionNotes?: string
  ) => Promise<void>;

  rejectSample: (
    sampleId: string,
    reasons: RejectionReason[],
    notes?: string,
    requireRecollection?: boolean
  ) => Promise<void>;

  /** Clear any error state */
  clearError: () => void;
}

/**
 * React Context for Samples
 */
export const SamplesContext = createContext<SamplesContextType | undefined>(undefined);

/**
 * Hook to access the Samples context
 * @throws Error if used outside of SamplesProvider
 */
export function useSamples(): SamplesContextType {
  const context = useContext(SamplesContext);
  if (!context) {
    throw new Error('useSamples must be used within a SamplesProvider');
  }
  return context;
}
