/**
 * Aliquots Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext } from 'react';
import type { Aliquot, AliquotPlan, AliquotStatus, ContainerType } from '@/types';

/**
 * AliquotsContext type definition
 */
export interface AliquotsContextType {
  aliquots: Aliquot[];

  // CRUD operations
  getAliquot: (aliquotId: string) => Aliquot | undefined;
  getAliquotsBySample: (sampleId: string) => Aliquot[];
  getAliquotsByOrder: (orderId: string) => Aliquot[];
  getAliquotsByStatus: (status: AliquotStatus) => Aliquot[];

  // Creation
  createAliquot: (
    parentSampleId: string,
    orderId: string,
    patientId: string,
    aliquotNumber: number,
    volume: number,
    linkedTestCodes: string[],
    containerType: ContainerType,
    purpose: string,
    createdBy: string
  ) => Aliquot;

  createAliquotsFromPlan: (
    sampleId: string,
    orderId: string,
    patientId: string,
    plan: AliquotPlan,
    createdBy: string
  ) => Aliquot[];

  // Planning
  generateAliquotPlan: (
    sampleId: string,
    totalVolume: number,
    testGroups: {
      testCodes: string[];
      destination: string;
      requiredVolume: number;
      containerType: ContainerType;
    }[]
  ) => AliquotPlan;

  // Usage tracking
  markAliquotInUse: (aliquotId: string) => void;
  markAliquotConsumed: (aliquotId: string, consumedBy: string, usedForTests: string[]) => void;
  updateRemainingVolume: (aliquotId: string, remainingVolume: number) => void;

  // Location
  moveAliquot: (aliquotId: string, location: string) => void;

  // Disposal
  disposeAliquot: (aliquotId: string, disposedBy: string) => void;
}

/**
 * React Context for Aliquots
 */
export const AliquotsContext = createContext<AliquotsContextType | undefined>(undefined);
