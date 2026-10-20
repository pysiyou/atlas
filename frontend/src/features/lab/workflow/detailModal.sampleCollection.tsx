/**
 * SampleCollectionDetailModal — loads a sample by id and owns collect mutations.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { sampleAPI, useCollectSample } from '../api/samples';
import type { ContainerType, Order, Patient, Sample } from '@/types';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { useOrder } from '@/features/orders';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { getTestNames } from '@/features/catalog/testLookup';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { deriveCollectionModalFields } from './detailModal.sampleCollection.derive';
import { Modal, ModalPageShell } from '@/components/overlays';
import { DetailPageSkeleton } from '@/components/loaders/DetailPageSkeleton';
import { SampleCollectionDetailModalView } from './detailModal.sampleCollection.view';
import { findCollectionQueueItem } from '../utils/findCollectionQueueItem';
import { useSubmitSampleCollection } from '../collection/useSubmitSampleCollection';
import { useAuthStore } from '@/app/authStore';
import type { SampleDetailModalProps } from '@/lib/context/modalTypes';

/**
 * When the collection worklist cache has no row for this sample, still allow collect
 * if the sample itself is pending (getById does not include queue extras).
 */
function fallbackPendingDisplay(
  sample: Sample,
  order: Order | undefined
): SampleCollectionQueueItem {
  const patient = {
    id: order?.patientId ?? 0,
    fullName: order?.patientName ?? '—',
  } as Patient;

  return {
    sample,
    order: order ?? ({
      orderId: sample.orderId,
      patientId: 0,
      patientName: '',
      orderDate: sample.createdAt,
      totalPrice: 0,
      paymentStatus: 'unpaid',
      overallStatus: 'ordered',
      priority: sample.priority,
      tests: [],
      createdBy: '',
      createdAt: sample.createdAt,
      updatedAt: sample.updatedAt,
    } as Order),
    patient,
    priority: sample.priority,
    requirement: {
      sampleType: sample.sampleType,
      testCodes: sample.testCodes ?? [],
      totalVolume: sample.requiredVolume ?? 0,
      containerTypes: sample.requiredContainerTypes ?? [],
      containerTopColors: sample.requiredContainerColors ?? [],
      priority: sample.priority,
      orderId: sample.orderId,
    },
    allowedActions: {
      collect: sample.status === 'pending',
      enterResults: false,
      validate: false,
      reject: false,
    },
  };
}

export const SampleCollectionDetailModal: React.FC<SampleDetailModalProps> = ({
  isOpen,
  onClose,
  isActive = true,
  sampleId,
  readOnly = false,
}) => {
  const { getUserName } = useUserLookup();
  const { tests = [] } = useTestCatalog();
  const { pushModal } = useModal();
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
  const orderId = cachedDisplay?.order ? undefined : sample?.orderId;
  const { order: fetchedOrder } = useOrder(orderId != null ? String(orderId) : undefined);
  const order = cachedDisplay?.order || fetchedOrder;

  const pendingSampleDisplay = useMemo(() => {
    if (!sample || sample.status !== 'pending') return cachedDisplay;
    return cachedDisplay ?? fallbackPendingDisplay(sample, order);
  }, [sample, cachedDisplay, order]);

  const testDetails = useMemo(() => {
    if (!sample?.testCodes) return [];
    const seen = new Set<string>();
    return sample.testCodes
      .map(code => tests.find(t => t.code === code))
      .filter((test): test is NonNullable<typeof test> => test !== undefined)
      .filter(test => {
        if (seen.has(test.code)) return false;
        seen.add(test.code);
        return true;
      });
  }, [sample, tests]);

  const openSampleDetail = useCallback(
    (id: string | number) => {
      pushModal({
        type: ModalType.SAMPLE_DETAIL,
        sampleId: String(id),
        readOnly,
      });
    },
    [pushModal, readOnly]
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
          <ModalPageShell>
            <DetailPageSkeleton variant="responsive-detail" />
          </ModalPageShell>
        </Modal>
      );
    }
    return null;
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
