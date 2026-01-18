/**
 * Samples Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext } from 'react';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
  RejectionReason,
} from '@/types';

/**
 * SamplesContext type definition
 */
export interface SamplesContextType {
  samples: Sample[];
  loading: boolean;
  error: string | null;
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
}

/**
 * React Context for Samples
 */
export const SamplesContext = createContext<SamplesContextType | undefined>(undefined);
