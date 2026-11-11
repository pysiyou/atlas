/**
 * SampleCollectionDetailModal — loads a sample by id and owns collect mutations.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { sampleAPI, useCollectSample, useSampleWorkContext } from '../../api/samples';
import type { ContainerType } from '@/types';
import { uniqueSortedTestCodes, useTestCatalog, useTestsByCodes } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { useOrder } from '@/features/orders';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { getTestNames } from '@/features/catalog/testLookup';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { deriveCollectionModalFields } from '@/utils/presentation';
import { actionButtonPreset, Button } from '@/components/primitives';
import { Modal, ModalPageShell } from '@/components/overlays';
import { QueueModalShell } from '../shared/detailModalLayout';
import { LabModalPlaceholder } from '../shared/labModalPlaceholders';
import { useListLoadErrorToast } from '@/hooks/listPage/useListLoadErrorToast';
import { SampleCollectionDetailModalView } from './detailModal.sampleCollection.view';
import { findCollectionQueueItem } from '../../utils/findCollectionQueueItem';
import { useSubmitSampleCollection } from '../../collection/useSubmitSampleCollection';
import { useAuthStore } from '@/app/authStore';
import type { SampleDetailModalProps } from '@/lib/context/modalTypes';
import { worklistItemToQueueRow } from '../../utils/worklistMappers';

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
  const workContextDisplay = workContext ? worklistItemToQueueRow(workContext) : undefined;
  const displayRow = cachedDisplay ?? workContextDisplay;
  const resolvedOrderId = displayRow?.orderId ?? sample?.orderId;
  const shouldFetchOrder =
    resolvedOrderId != null && !displayRow?.orderDate && !displayRow?.referentDoctorName;
  const { order: fetchedOrder } = useOrder(
    shouldFetchOrder ? String(resolvedOrderId) : undefined
  );
  const order = useMemo(() => {
    if (fetchedOrder) return fetchedOrder;
    if (!displayRow) return undefined;
    return {
      orderId: displayRow.orderId,
      orderDate: displayRow.orderDate,
      referentDoctorName: displayRow.referentDoctorName ?? undefined,
      paymentStatus: displayRow.paymentStatus,
      priority: displayRow.priority,
    } as import('@/types').Order;
  }, [fetchedOrder, displayRow]);

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

  const workContextLoadFailed =
    Boolean(sample) &&
    isOpen &&
    sample!.status === 'pending' &&
    needsWorkContext &&
    workContextError &&
    !pendingSampleDisplay;

  useListLoadErrorToast(
    'lab.collection.workContext.loadFailed',
    workContextLoadFailed,
    workContextQueryError,
    () => {
      void refetchWorkContext();
    }
  );

  if (!sample) {
    if (isOpen && sampleId && isFetchingSample) {
      return (
        <QueueModalShell
          isOpen={isOpen}
          onClose={onClose}
          isActive={isActive}
          title="Sample"
          subtitle=""
        >
          <LabModalPlaceholder variant="sampleCollection" />
        </QueueModalShell>
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
      <QueueModalShell
        isOpen={isOpen}
        onClose={onClose}
        isActive={isActive}
        title="Sample"
        subtitle=""
      >
        <LabModalPlaceholder variant="sampleCollection" />
      </QueueModalShell>
    );
  }

  if (workContextLoadFailed) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Sample" size="3xl" isActive={isActive}>
        <ModalPageShell>
          <div className="flex justify-center p-panel">
            <Button
              {...actionButtonPreset('retry')}
              size="sm"
              onClick={() => {
                void refetchWorkContext();
              }}
            >
              Retry
            </Button>
          </div>
        </ModalPageShell>
      </Modal>
    );
  }

  const fields = deriveCollectionModalFields(
    sample,
    order,
    pendingSampleDisplay?.patientName
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
