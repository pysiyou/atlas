/**
 * SampleCollectionDetailModal — loads a sample by id and owns collect mutations.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { sampleAPI, useCollectSample, useSampleWorkContext } from '../api/samples';
import type { ContainerType } from '@/types';
import { uniqueSortedTestCodes, useTestCatalog, useTestsByCodes } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { useOrder } from '@/features/orders';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { getTestNames } from '@/features/catalog/testLookup';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { deriveCollectionModalFields } from './detailModal.sampleCollection.derive';
import { Modal, ModalPageShell } from '@/components/overlays';
import { ErrorAlert } from '@/components/loaders';
import { SampleCollectionDetailModalView } from './detailModal.sampleCollection.view';
import { findCollectionQueueItem } from '../utils/findCollectionQueueItem';
import { useSubmitSampleCollection } from '../collection/useSubmitSampleCollection';
import { useAuthStore } from '@/app/authStore';
import type { SampleDetailModalProps } from '@/lib/context/modalTypes';
import { mapCollectionWorklistToSampleDisplay } from '../utils/labQueue';
import { errorAlertMessage } from '@/utils/feedback';

export const SampleCollectionDetailModal: React.FC<SampleDetailModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  sampleId,
  readOnly = false,
}) => {
  const { getUserName } = useUserLookup();
  const { tests = [] } = useTestCatalog();
  const { openModal } = useModal();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();
  const collectSampleMutation = useCollectSample();
  const { handleCollect } = useSubmitSampleCollection({
    isAuthenticated,
    collectSampleMutation,
  });
  const [isPopoverSubmitting, setIsPopoverSubmitting] = useState(false);

  const numericSampleId = Number(sampleId);
  const cachedDisplay = Number.isFinite(numericSampleId)
    ? findCollectionQueueItem(queryClient, numericSampleId)
    : undefined;

  const { data: fetchedSample, isLoading: isFetchingSample } = useQuery({
    queryKey: queryKeys.samples.byId(sampleId),
    queryFn: () => sampleAPI.getById(sampleId),
    enabled: isOpen && Boolean(sampleId),
  });
  const sample = fetchedSample ?? cachedDisplay?.sample;
  const needsWorkContext = isOpen && Boolean(sampleId) && !cachedDisplay;
  const {
    workContext,
    isLoading: isLoadingWorkContext,
    isError: workContextError,
    error: workContextQueryError,
    refetch: refetchWorkContext,
  } = useSampleWorkContext(needsWorkContext ? sampleId : undefined, needsWorkContext);
  const workContextDisplay = workContext
    ? mapCollectionWorklistToSampleDisplay(workContext)
    : undefined;
  const orderId = cachedDisplay?.order || workContextDisplay?.order ? undefined : sample?.orderId;
  const { order: fetchedOrder } = useOrder(orderId != null ? String(orderId) : undefined);
  const order = cachedDisplay?.order || workContextDisplay?.order || fetchedOrder;

  const pendingSampleDisplay = useMemo(() => {
    if (!sample || sample.status !== 'pending') return cachedDisplay ?? workContextDisplay;
    return cachedDisplay ?? workContextDisplay;
  }, [sample, cachedDisplay, workContextDisplay]);

  const sampleTestCodes = useMemo(
    () => uniqueSortedTestCodes(sample?.testCodes ?? []),
    [sample?.testCodes]
  );
  const { byCode: fullByCode } = useTestsByCodes(isOpen ? sampleTestCodes : []);

  const testDetails = useMemo(() => {
    if (!sample?.testCodes) return [];
    const seen = new Set<string>();
    return sample.testCodes
      .map(code => fullByCode.get(code))
      .filter((test): test is NonNullable<typeof test> => test !== undefined)
      .filter(test => {
        if (seen.has(test.code)) return false;
        seen.add(test.code);
        return true;
      });
  }, [sample, fullByCode]);

  const openSampleDetail = useCallback(
    (id: string | number) => {
      openModal({
        type: ModalType.SAMPLE_DETAIL,
        sampleId: String(id),
        readOnly,
      });
    },
    [openModal, readOnly]
  );

  const onCollect = useCallback(
    async (
      display: SampleCollectionQueueItem,
      volume: number,
      notes?: string,
      selectedColor?: string,
      containerType?: ContainerType
    ) => {
      await handleCollect(display, volume, notes, selectedColor, containerType);
    },
    [handleCollect]
  );

  if (!sample) {
    if (isOpen && sampleId && isFetchingSample) {
      return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sample" size="3xl" isActive={isActive}>
          <ModalPageShell loading />
        </Modal>
      );
    }
    return null;
  }

  if (
    isOpen &&
    sample.status === 'pending' &&
    needsWorkContext &&
    isLoadingWorkContext &&
    !pendingSampleDisplay
  ) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Sample" size="3xl" isActive={isActive}>
        <ModalPageShell loading />
      </Modal>
    );
  }

  if (
    isOpen &&
    sample.status === 'pending' &&
    needsWorkContext &&
    workContextError &&
    !pendingSampleDisplay
  ) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Sample" size="3xl" isActive={isActive}>
        <ModalPageShell>
          <ErrorAlert
            error={{
              message: errorAlertMessage(
                'lab.collection.workContext.loadFailed',
                workContextQueryError
              ),
            }}
            onRetry={() => {
              void refetchWorkContext();
            }}
          />
        </ModalPageShell>
      </Modal>
    );
  }

  const fields = deriveCollectionModalFields(
    sample,
    order,
    pendingSampleDisplay?.patient?.fullName
  );
  const testNames = sample.testCodes ? getTestNames(sample.testCodes, tests) : [];

  return (
    <SampleCollectionDetailModalView
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      sample={sample}
      order={order}
      requirement={pendingSampleDisplay?.requirement}
      pendingSampleDisplay={pendingSampleDisplay}
      onCollect={readOnly ? undefined : onCollect}
      readOnly={readOnly}
      isPopoverSubmitting={isPopoverSubmitting}
      onPopoverSubmittingChange={setIsPopoverSubmitting}
      testDetails={testDetails}
      testNames={testNames}
      fields={fields}
      getUserName={getUserName}
      openSampleDetail={openSampleDetail}
    />
  );
};
