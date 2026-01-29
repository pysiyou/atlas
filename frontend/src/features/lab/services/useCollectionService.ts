/**
 * useCollectionService Hook
 * 
 * Business logic for sample collection workflow
 */

import { useCollectSample, useRejectSample } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/keys';
import toast from 'react-hot-toast';
import type { ContainerType, ContainerTopColor } from '@/types';
import { printCollectionLabel } from '../collection/CollectionLabel';
import type { SampleDisplay } from '../types';

export function useCollectionService() {
  const queryClient = useQueryClient();
  const collectSampleMutation = useCollectSample();
  const rejectSampleMutation = useRejectSample();

  /**
   * Collect a sample
   */
  const collectSample = async (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    selectedContainerType?: ContainerType
  ) => {
    if (!display.sample || !display.requirement) {
      throw new Error('Invalid sample data');
    }
    if (!selectedColor) {
      throw new Error('Container color is required');
    }
    if (!selectedContainerType) {
      throw new Error('Container type is required');
    }

    try {
      await collectSampleMutation.mutateAsync({
        sampleId: display.sample.sampleId.toString(),
        collectedVolume: volume,
        actualContainerType: selectedContainerType,
        actualContainerColor: selectedColor as ContainerTopColor,
        collectionNotes: notes,
      });
      
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      
      toast.success({
        title: `${(display.sample.sampleType ?? 'sample').toString().toUpperCase()} sample collected`,
        subtitle: 'The sample has been recorded with the selected container and volume. The order has been updated.',
      });
    } catch (error) {
      toast.error({
        title: `Failed to collect sample: ${error instanceof Error ? error.message : 'Unknown error'}`,
        subtitle: 'The collection could not be saved. Check your connection and the sample details, then try again.',
      });
      throw error;
    }
  };

  /**
   * Reject a sample
   */
  const rejectSample = async (
    sampleId: string,
    rejectionReasons: string[],
    rejectionNotes?: string,
    recollectionRequired: boolean = false
  ) => {
    try {
      await rejectSampleMutation.mutateAsync({
        sampleId,
        reasons: rejectionReasons as any, // Type assertion needed - reasons are validated by API
        notes: rejectionNotes,
        requireRecollection: recollectionRequired,
      });
      
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      
      toast.success({
        title: 'Sample rejected',
        subtitle: 'The sample has been rejected and the order updated. Recollection may be required depending on your selection.',
      });
    } catch (error) {
      toast.error({
        title: `Failed to reject sample: ${error instanceof Error ? error.message : 'Unknown error'}`,
        subtitle: 'The rejection could not be saved. Please try again or check the sample status.',
      });
      throw error;
    }
  };

  /**
   * Print collection label
   */
  const printLabel = (display: SampleDisplay, patientName: string): void => {
    try {
      printCollectionLabel(display, patientName);
    } catch (error) {
      if (error instanceof Error) {
        toast.error({
          title: error.message,
          subtitle: 'The label could not be printed. Check your printer and try again.',
        });
      } else {
        toast.error({
          title: 'Failed to print label',
          subtitle: 'Ensure the printer is connected and the sample data is valid.',
        });
      }
    }
  };

  return {
    collectSample,
    rejectSample,
    printLabel,
    isCollecting: collectSampleMutation.isPending,
    isRejecting: rejectSampleMutation.isPending,
  };
}
