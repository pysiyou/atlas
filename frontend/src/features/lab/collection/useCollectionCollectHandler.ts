/**
 * Sample collection handler for CollectionView.
 */

import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { getErrorMessage, getErrorDetails, isLikelyNetworkOrTimeout } from '@/utils/errors';
import { invalidateCollectionQueries } from '@/lib/query/invalidate';
import { getFeedback, notify } from '@/utils/feedback';
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
}: {
  isAuthenticated: boolean;
  collectSampleMutation: UseMutationResult<unknown, Error, CollectSampleParams>;
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
      notify.toast('lab.collection.authRequired');
      return;
    }
    if (!display.sample || !display.requirement) {
      notify.toast('lab.collection.invalidSample');
      return;
    }
    if (!selectedColor) {
      notify.toast('lab.collection.colorRequired');
      return;
    }
    if (!selectedContainerType) {
      notify.toast('lab.collection.containerRequired');
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
      const sampleLabel = (display.sample.sampleType ?? 'sample').toString().toUpperCase();
      notify.toast('lab.collection.success', {
        title: `${sampleLabel} sample collected`,
      });
    } catch (error) {
      logger.error('Error collecting sample', getErrorDetails(error));
      await invalidateCollectionQueries(queryClient);
      if (isLikelyNetworkOrTimeout(error)) {
        notify.toast('lab.collection.networkAmbiguous');
      } else {
        const message = getErrorMessage(
          error,
          getFeedback('lab.collection.error').subtitle ??
            'The collection could not be saved. Check your connection and try again.'
        );
        notify.toast('lab.collection.error', { subtitle: message });
      }
    }
  };

  return { handleCollect };
}
