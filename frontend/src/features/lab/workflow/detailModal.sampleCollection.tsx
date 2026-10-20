/**
 * SampleCollectionDetailModal - Extended view for sample details
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { sampleAPI } from '../api/samples';
import type { ContainerType } from '@/types';
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

interface CollectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  pendingSampleDisplay?: SampleCollectionQueueItem;
  onCollect?: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  readOnly?: boolean;
}

export const SampleCollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  isOpen,
  onClose,
  sampleId,
  pendingSampleDisplay,
  onCollect,
  readOnly = false,
}) => {
  const { getUserName } = useUserLookup();
  const { tests = [] } = useTestCatalog();
  const { openModal } = useModal();
  const [isPopoverSubmitting, setIsPopoverSubmitting] = useState(false);

  const { data: fetchedSample, isLoading: isFetchingSample } = useQuery({
    queryKey: queryKeys.samples.byId(sampleId ?? ''),
    queryFn: () => sampleAPI.getById(sampleId!),
    enabled: isOpen && !!sampleId,
  });
  const sample = fetchedSample ?? pendingSampleDisplay?.sample;
  const orderId = pendingSampleDisplay?.order ? undefined : sample?.orderId;
  const { order: fetchedOrder } = useOrder(orderId != null ? String(orderId) : undefined);
  const order = pendingSampleDisplay?.order || fetchedOrder;
  const requirement = pendingSampleDisplay?.requirement;

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
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: String(id), readOnly });
    },
    [openModal, readOnly]
  );

  if (!sample) {
    if (isOpen && sampleId && isFetchingSample) {
      return (
        <Modal isOpen={isOpen} onClose={onClose} title="Sample" size="3xl">
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
      sample={sample}
      order={order}
      requirement={requirement}
      pendingSampleDisplay={pendingSampleDisplay}
      onCollect={onCollect}
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
