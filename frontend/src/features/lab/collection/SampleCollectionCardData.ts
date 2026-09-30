/**
 * Shared data hook for SampleCollectionCard (mobile + desktop layouts).
 */
import React, { useMemo } from 'react';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { getTestNames } from '@/features/catalog/testLookup';
import { useLabWorkflowCardClickGuard } from '../hooks';
import type { Sample } from '@/types';
import type { SampleCollectionQueueItem, SampleRequirement } from '@/types/lab-operations';
import type { CollectionCardProps } from './SampleCollectionCard';

export interface CollectionCardSharedData {
  display: SampleCollectionQueueItem;
  sample: Sample;
  requirement: SampleRequirement;
  onCollect: CollectionCardProps['onCollect'];
  patientName: string;
  testNames: string[];
  handleCardClick: (e?: React.MouseEvent) => void;
  isCollecting: boolean;
}

export function useCollectionCardData(props: CollectionCardProps): CollectionCardSharedData | null {
  const { display, onCollect, isCollecting = false } = props;
  const { getPatientName } = usePatientNameLookup();
  const { tests } = useTestCatalog();
  const { openModal } = useModal();

  const { sample, requirement } = display;

  const openSampleModal = useMemo(() => {
    return () => {
      const isPending = sample?.status === 'pending';
      const isCollected = sample?.status === 'collected';
      const isRejected = sample?.status === 'rejected';

      if ((isCollected || isRejected) && sample?.sampleId) {
        openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId.toString() });
      } else if (isPending) {
        openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
      }
    };
  }, [sample, display, onCollect, openModal]);

  const handleCardClick = useLabWorkflowCardClickGuard(openSampleModal);

  if (!sample || !requirement) return null;

  const patientName = getPatientName(display.order.patientId);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];

  return {
    display,
    sample,
    requirement,
    onCollect,
    patientName,
    testNames,
    handleCardClick,
    isCollecting,
  };
}
