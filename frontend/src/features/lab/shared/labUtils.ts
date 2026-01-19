/**
 * Lab Utility Functions
 * 
 * Shared utility functions for lab workflow components.
 */

import toast from 'react-hot-toast';
import { printSampleLabel } from '../sample-collection/SampleLabel';
import type { SampleDisplay } from '../sample-collection/types';
import type { Patient, Test } from '@/types';
import { getPatientName, getTestNames } from '@/utils/typeHelpers';
import { getCollectionRequirements } from '@/utils';

/**
 * Handle printing sample label with error handling
 */
export const handlePrintSampleLabel = (display: SampleDisplay, patientName: string): void => {
  try {
    printSampleLabel(display, patientName);
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to print label');
    }
  }
};

/**
 * Create a sample display filter function
 * Searches across multiple fields including patient name, sample ID, order ID, etc.
 */
export const createSampleDisplayFilter = (patients: Patient[], tests: Test[]) =>
  (display: SampleDisplay, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const sample = display.sample;
    const sampleType = sample?.sampleType;
    const collectionType = sampleType ? getCollectionRequirements(sampleType).collectionType : '';
    const patientName = getPatientName(display.order.patientId, patients);
    const testNames = sample?.testCodes ? getTestNames(sample.testCodes, tests) : [];

    // Search in rejection data for rejected samples
    const rejectionReasons = sample?.status === 'rejected' && 'rejectionReasons' in sample
      ? (sample.rejectionReasons || []).join(' ').toLowerCase()
      : '';
    const rejectionNotes = sample?.status === 'rejected' && 'rejectionNotes' in sample
      ? (sample.rejectionNotes || '').toLowerCase()
      : '';

    // Search in collection notes
    const collectionNotes = (sample?.status === 'collected' || sample?.status === 'rejected') && 'collectionNotes' in sample
      ? (sample.collectionNotes || '').toLowerCase()
      : '';

    return (
      display.order.orderId.toLowerCase().includes(lowerQuery) ||
      sample?.sampleId?.toLowerCase().includes(lowerQuery) ||
      patientName.toLowerCase().includes(lowerQuery) ||
      sampleType?.toLowerCase()?.includes(lowerQuery) ||
      (collectionType.toLowerCase().includes(lowerQuery) && collectionType !== sampleType) ||
      testNames.some((name: string) => name.toLowerCase().includes(lowerQuery)) ||
      rejectionReasons.includes(lowerQuery) ||
      rejectionNotes.includes(lowerQuery) ||
      collectionNotes.includes(lowerQuery)
    );
  };

/**
 * Format rejection reasons for display
 */
export const formatRejectionReasons = (reasons: string[] | undefined): string | null => {
  if (!reasons || reasons.length === 0) return null;
  return reasons.map(r => r.replace(/_/g, ' ')).join(', ');
};

/**
 * Get container display name
 */
export const getContainerDisplayName = (
  containerColors: Array<{ value: string; name: string }>,
  colorValue?: string
): string => {
  if (!colorValue) return 'N/A';
  return containerColors.find(opt => opt.value === colorValue)?.name || 'N/A';
};

/**
 * Check if a sample has container info (is collected or rejected)
 */
export const hasContainerInfo = (sample: { status: string } & Record<string, unknown>): boolean => {
  return (sample.status === 'collected' || sample.status === 'rejected') && 'actualContainerColor' in sample;
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

/**
 * Build a unique key for test items in lists
 */
export const buildTestKey = (orderId: string, testCode: string, index: number): string => {
  return `${orderId}-${testCode}-${index}`;
};

/**
 * Build a unique key for sample items in lists
 */
export const buildSampleKey = (
  orderId: string,
  sampleType: string | undefined,
  sampleId: string | undefined,
  index: number
): string => {
  return `${orderId}-${sampleType || 'unknown'}-${sampleId || index}-${index}`;
};
