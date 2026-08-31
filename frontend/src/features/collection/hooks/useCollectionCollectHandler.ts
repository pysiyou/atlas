/**
 * Sample collection handler for CollectionView.
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import { getErrorMessage, getErrorDetails, isLikelyNetworkOrTimeout } from '@/utils/errors';
import { queryKeys } from '@/lib/query';
import type { ContainerType, ContainerTopColor } from '@/types';
import type { SampleDisplay } from '@/features/lab/types';
import type { UseMutationResult } from '@tanstack/react-query';

interface CollectSampleParams {
  sampleId: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
}

export function useCollectionCollectHandler({
  isAuthenticated,
  collectSampleMutation,
  refreshOrders,
}: {
  isAuthenticated: boolean;
  collectSampleMutation: UseMutationResult<unknown, Error, CollectSampleParams>;
  refreshOrders: () => Promise<unknown>;
}) {
  const queryClient = useQueryClient();

  const handleCollect = async (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    selectedContainerType?: ContainerType
  ) => {
    if (!isAuthenticated) {
      toast.error({
        title: 'You must be logged in to collect samples',
        subtitle: 'Please sign in to record sample collections, then try again.',
      });
      return;
    }
    if (!display.sample || !display.requirement) {
      toast.error({
        title: 'Invalid sample data',
        subtitle:
          'The sample or requirement data is missing or invalid. Refresh the page and try again.',
      });
      return;
    }
    if (!selectedColor) {
      toast.error({
        title: 'Container color is required',
        subtitle: 'Select the container cap color before confirming the collection.',
      });
      return;
    }
    if (!selectedContainerType) {
      toast.error({
        title: 'Container type is required',
        subtitle: 'Select the container type (e.g. cup or tube) before confirming the collection.',
      });
      return;
    }

    try {
      await collectSampleMutation.mutateAsync({
        sampleId: display.sample.sampleId.toString(),
        collectedVolume: volume,
        actualContainerType: selectedContainerType,
        actualContainerColor: selectedColor as ContainerTopColor,
        collectionNotes: notes,
      });
      toast.success({
        title: `${(display.sample.sampleType ?? 'sample').toString().toUpperCase()} sample collected`,
        subtitle:
          'The sample has been recorded and the order has been updated. You can continue with the next sample.',
      });
      try {
        await refreshOrders();
      } catch (refetchError) {
        const err = refetchError as Error & { name?: string };
        if (err?.name !== 'AbortError') {
          logger.error('Error refreshing orders after collection', getErrorDetails(refetchError));
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      }
    } catch (error) {
      logger.error('Error collecting sample', getErrorDetails(error));
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      if (isLikelyNetworkOrTimeout(error)) {
        toast.error({
          title: 'Action may have completed',
          subtitle:
            'The request did not complete. Please refresh the page to see the latest status.',
        });
      } else {
        const message = getErrorMessage(
          error,
          'The collection could not be saved. Check your connection and try again.'
        );
        toast.error({
          title: 'Failed to collect sample',
          subtitle: message,
        });
      }
    }
  };

  return { handleCollect };
}
