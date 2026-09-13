/**
 * CollectionCard hooks - shared data derivation for mobile/desktop variants
 */

import { useMemo } from 'react';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { getTestNames } from '@/features/catalog/utils';
import { useLabCardClickGuard } from '@/features/lab/hooks';
import type { ContainerType, Sample } from '@/types';
import type { SampleDisplay, SampleRequirement } from '@/features/lab/types';

export interface CollectionCardProps {
  display: SampleDisplay;
  onCollect: (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  isCollecting?: boolean;
  isMobile?: boolean;
}

export interface CollectionCardSharedData {
  display: SampleDisplay;
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
  
  const handleCardClick = useLabCardClickGuard(openSampleModal);
  
  // Early return if missing data
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
