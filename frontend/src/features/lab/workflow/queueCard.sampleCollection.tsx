/**
 * Sample collection queue card — desktop/mobile shells, left header column, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { getTestNames } from '@/features/catalog/testLookup';
import type { ContainerType, Test } from '@/types';
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
  /** Catalog tests hoisted from the queue to avoid per-card fetches. */
  tests: Test[];
}

export function useSampleCollectionCardData(
  props: SampleCollectionCardProps
): SampleCollectionCardSharedData | null {
  const { display, onCollect, isCollecting = false } = props;
  const { tests } = props;
  const { openModal } = useModal();

  const { sample, requirement } = display;

  const openSampleModal = useMemo(() => {
    return () => {
      if (sample?.sampleId == null) return;
      openModal({
        type: ModalType.SAMPLE_DETAIL,
        sampleId: sample.sampleId.toString(),
      });
    };
  }, [sample, openModal]);

  const handleCardClick = useLabWorkflowCardClickGuard(openSampleModal);

  if (!sample || !requirement) return null;

  const patientName = display.patient?.fullName || display.order.patientName || '—';
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

function passThroughSharedData(
  data: SampleCollectionCardSharedData | null
): SampleCollectionCardSharedData {
  return data as SampleCollectionCardSharedData;
}

export const SampleCollectionCard: FC<SampleCollectionCardProps> = props => {
  const sharedData = useSampleCollectionCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: sharedData,
    deriveSharedData: passThroughSharedData,
    renderMobile: SampleCollectionCardMobile,
    renderDesktop: SampleCollectionCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
