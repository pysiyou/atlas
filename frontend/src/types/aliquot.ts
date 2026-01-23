// Aliquot Types - Portions of a sample for different tests/workstations

import type { ContainerType } from './sample';

export type AliquotStatus =
  | 'available'      // Ready for use
  | 'in-use'         // Currently being tested
  | 'consumed'       // Fully used up
  | 'stored'         // Archived for potential retest
  | 'disposed';      // Properly disposed

export interface Aliquot {
  aliquotId: number;               // Integer ID, displayed as ALQ{id}
  parentSampleId: number;          // Links to parent sample
  orderId: number;
  patientId: number;

  // Aliquot details
  aliquotNumber: number;           // 1, 2, 3, etc. (Aliquot 1 of 3)
  volume: number;                  // mL in this aliquot
  remainingVolume: number;         // mL remaining after testing

  // Purpose
  linkedTestCodes: string[];       // Tests assigned to this aliquot
  purpose?: string;                // e.g., "Sendout tests", "Chemistry panel"

  // Container
  containerType: ContainerType;
  barcode: string;

  // Status and location
  status: AliquotStatus;
  currentLocation: string;

  // Creation tracking
  createdAt: string;
  createdBy: string;

  // Usage tracking
  usedForTests: string[];          // Tests that have consumed this aliquot
  consumedAt: string | null;
  consumedBy: string | null;

  // Storage
  storageLocation?: string;
  storageConditions?: string;

  // Disposal
  disposedAt: string | null;
  disposedBy: string | null;
}

// Aliquoting plan before creating aliquots
export interface AliquotPlan {
  sampleId: number;
  totalVolume: number;
  aliquots: {
    aliquotNumber: number;
    volume: number;
    testCodes: string[];
    destination: string;           // Workstation or sendout lab
    containerType: ContainerType;
  }[];
  deadVolume: number;              // Volume lost in transfer
  totalAliquotVolume: number;      // Sum of all aliquots + dead volume
  isFeasible: boolean;             // Can we create these aliquots?
  warnings: string[];
}
