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
  RejectedSample,
} from '@/types';

/**
 * SamplesContext type definition
 */
export interface SamplesContextType {
  samples: Sample[];

  // CRUD operations
  getSample: (sampleId: string) => Sample | undefined;
  getSamplesByOrder: (orderId: string) => Sample[];
  getSamplesByPatient: (patientId: string, orders: Array<{ orderId: string; patientId: string }>) => Sample[];
  getSamplesByStatus: (status: SampleStatus) => Sample[];

  // Collection
  createSample: (
    orderId: string,
    sampleType: Sample['sampleType'],
    requiredVolume: number,
    testCodes: string[],
    requiredContainerTypes: ContainerType[],
    requiredContainerColors: ContainerTopColor[],
    priority: 'routine' | 'urgent' | 'stat',
    initialCollection?: {
      collectedBy: string;
      collectedVolume: number;
      actualContainerType: ContainerType;
      actualContainerColor: ContainerTopColor;
      collectionNotes?: string;
    }
  ) => Sample;

  collectSample: (
    sampleId: string,
    collectedBy: string,
    collectedVolume: number,
    actualContainerType: ContainerType,
    actualContainerColor: ContainerTopColor,
    collectionNotes?: string
  ) => void;

  rejectSample: (
    sampleId: string,
    reasons: RejectionReason[],
    rejectedBy: string,
    notes?: string,
    requireRecollection?: boolean
  ) => RejectedSample | undefined;

  // Volume management
  updateRemainingVolume: (sampleId: string, remainingVolume: number) => void;
}

/**
 * React Context for Samples
 */
export const SamplesContext = createContext<SamplesContextType | undefined>(undefined);
