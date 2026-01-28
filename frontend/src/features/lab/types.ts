/**
 * Lab Feature Types
 *
 * Consolidated type definitions for the lab feature.
 * Common types shared across collection, entry, and validation workflows.
 */

import type { Sample, Order, Patient } from '@/types';

// Import SampleRequirement from utils (single source of truth)
import type { SampleRequirement } from '@/utils';
export type { SampleRequirement };

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
