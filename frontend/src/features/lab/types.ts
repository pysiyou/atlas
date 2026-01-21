/**
 * Lab Feature Types
 * 
 * Consolidated type definitions for the lab feature.
 * Common types shared across collection, entry, and validation workflows.
 */

import type { Sample, Order, Patient, SampleType, ContainerType, ContainerTopColor } from '@/types';

/**
 * Sample requirement for collection workflow.
 * Defines what samples need to be collected for a set of tests.
 */
export interface SampleRequirement {
  /** The type of sample required */
  sampleType: SampleType;
  /** Test codes that require this sample */
  testCodes: string[];
  /** Total volume needed in mL */
  totalVolume: number;
  /** Acceptable container types */
  containerTypes: ContainerType[];
  /** Acceptable container top colors */
  containerTopColors: ContainerTopColor[];
  /** Priority level of the sample */
  priority: 'routine' | 'urgent' | 'stat';
  /** Associated order ID */
  orderId: string;
}

/**
 * Display object for sample collection workflow.
 * Combines sample data with its associated order, patient, and requirements.
 */
export interface SampleDisplay {
  /** The sample data (may be undefined for pending samples) */
  sample?: Sample;
  /** The associated order */
  order: Order;
  /** The patient this sample belongs to */
  patient: Patient;
  /** Priority level for display */
  priority: string;
  /** Collection requirements for this sample */
  requirement?: SampleRequirement;
}

// Re-export TestWithContext from @/types for convenience
export type { TestWithContext } from '@/types';
