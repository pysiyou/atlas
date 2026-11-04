/**
 * Sample collection handler for SampleCollectionQueue.
 */

import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { getErrorDetails, isLikelyNetworkOrTimeout } from '@/utils/errors';
import { invalidateCollectionQueries } from '@/lib/query/invalidate';
import { notify } from '@/feedback';
import type { ContainerType, ContainerTopColor } from '@/types';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import type { UseMutationResult } from '@tanstack/react-query';

interface CollectSampleParams {
  sampleId: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
}

export function useSubmitSampleCollection({
  isAuthenticated,
  collectSampleMutation,
}: {
  isAuthenticated: boolean;
  collectSampleMutation: UseMutationResult<unknown, Error, CollectSampleParams>;
}) {
  const queryClient = useQueryClient();

  const handleCollect = async (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    selectedContainerType?: ContainerType
  ) => {
    if (!isAuthenticated) {
      notify.show('lab.collection.authRequired');
      return;
    }
    if (!display.sample || !display.requirement) {
      notify.show('lab.collection.invalidSample');
      return;
    }
    if (!selectedColor) {
      notify.show('lab.collection.colorRequired');
      return;
    }
    if (!selectedContainerType) {
      notify.show('lab.collection.containerRequired');
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
      notify.show('lab.collection.success');
    } catch (error) {
      logger.error('Error collecting sample', getErrorDetails(error));
      await invalidateCollectionQueries(queryClient);
      if (isLikelyNetworkOrTimeout(error)) {
        notify.show('lab.collection.networkAmbiguous');
      } else {
        notify.apiError('lab.collection.error', error);
      }
    }
  };

  return { handleCollect };
}
