/**
 * Lab Utility Functions
 *
 * Shared utility functions for lab workflow components.
 */

import toast from 'react-hot-toast';
import { printCollectionLabel } from '../collection/CollectionLabel';
import type { SampleDisplay } from '../types';

/**
 * Handle printing collection label with error handling
 */
export const handlePrintCollectionLabel = (display: SampleDisplay, patientName: string): void => {
  try {
    printCollectionLabel(display, patientName);
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to print label');
    }
  }
};

/**
 * Format rejection reasons for display
 */
export const formatRejectionReasons = (reasons: string[] | undefined): string | null => {
  if (!reasons || reasons.length === 0) return null;
  return reasons.map(r => r.replace(/_/g, ' ')).join(', ');
};

/**
 * Determine effective container type based on sample type
 */
export const getEffectiveContainerType = (
  actualContainerType: string | undefined,
  sampleType: string
): 'cup' | 'tube' => {
  if (actualContainerType === 'cup' || actualContainerType === 'tube') {
    return actualContainerType;
  }
  return sampleType === 'urine' || sampleType === 'stool' ? 'cup' : 'tube';
};
