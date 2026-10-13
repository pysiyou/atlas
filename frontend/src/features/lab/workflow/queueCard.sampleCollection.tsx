/**
 * Sample collection queue card — desktop/mobile shells, left header column, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { getTestNames } from '@/features/catalog/testLookup';
import type { ContainerType } from '@/types';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { useLabWorkflowCardClickGuard } from '../hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import {
  SampleCollectionCardDesktop,
  SampleCollectionCardMobile,
} from './queueCard.sampleCollection.helpers';
import {
  SampleCollectionCardLeftColumn,
  type SampleCollectionCardLeftColumnProps,
  type SampleCollectionCardSharedData,
} from './queueCard.sampleCollection.leftColumn.helpers';

export type { SampleCollectionCardLeftColumnProps, SampleCollectionCardSharedData };

export { SampleCollectionCardLeftColumn };

export interface SampleCollectionCardProps {
  display: SampleCollectionQueueItem;
  onCollect: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  isCollecting?: boolean;
  isMobile?: boolean;
}

export function useSampleCollectionCardData(
  props: SampleCollectionCardProps
): SampleCollectionCardSharedData | null {
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

export const SampleCollectionCard: FC<SampleCollectionCardProps> = props => {
  const sharedData = useSampleCollectionCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as SampleCollectionCardSharedData,
    renderMobile: SampleCollectionCardMobile,
    renderDesktop: SampleCollectionCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
