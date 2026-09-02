/**
 * CollectionDetailFooter Component
 */
import React from 'react';
import { Button, Icon } from '@/components';
import type { ContainerType, Sample, RejectedSample, Order } from '@/types';
import { CollectionPopover } from './CollectionPopover';
import { CollectionRejectionPopover } from './CollectionRejectionPopover';
import { ModalFooter } from '../components/LabDetailModal';
import type { SampleDisplay } from '@/features/lab/types';
import { getSampleStatusIcon } from '@/config/icons';

interface CollectionDetailFooterProps {
  sample: Sample;
  order: Order | undefined;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  pendingSampleDisplay: SampleDisplay | undefined;
  patientName: string;
  testNames: string[];
  onCollect?: (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType,
  ) => void;
  onClose: () => void;
  onPopoverSubmittingChange?: (submitting: boolean) => void;
}

export const CollectionDetailFooter: React.FC<CollectionDetailFooterProps> = ({
  sample,
  isPending,
  isRejected,
  isCollected,
  pendingSampleDisplay,
  patientName,
  testNames,
  onCollect,
  onClose,
  onPopoverSubmittingChange,
}) => {
  if (isPending && pendingSampleDisplay && onCollect) {
    const isRecollection = sample.isRecollection === true;
    return (
      <ModalFooter statusIcon={undefined} statusMessage="" statusClassName="text-text-tertiary">
        <CollectionPopover
          requirement={pendingSampleDisplay.requirement!}
          patientName={patientName}
          testName={testNames.join(', ')}
          isRecollection={isRecollection}
          onConfirm={async (volume, notes, color, ct) => {
            await Promise.resolve(onCollect(pendingSampleDisplay, volume, notes, color, ct));
            onClose();
          }}
          onSubmittingChange={onPopoverSubmittingChange}
          trigger={
            <Button variant="approve" size="md">
              {isRecollection ? 'Recollect Sample' : 'Collect Sample'}
            </Button>
          }
        />
      </ModalFooter>
    );
  }

  if (isCollected && sample.sampleId) {
    return (
      <ModalFooter
        statusIcon={
          <Icon name={getSampleStatusIcon('collected')} className="w-3.5 h-3.5 text-text-disabled" />
        }
        statusMessage=""
        statusClassName="text-text-tertiary"
      >
        <CollectionRejectionPopover
          sampleId={sample.sampleId.toString()}
          testCodes={sample.testCodes ?? []}
          sampleType={sample.sampleType}
          patientName={patientName}
          isRecollection={sample.isRecollection || false}
          onSuccess={onClose}
          trigger={
            <Button variant="reject" size="md">
              Report Specimen Issue
            </Button>
          }
        />
      </ModalFooter>
    );
  }

  if (isRejected) {
    return (
      <ModalFooter
        statusIcon={
          <Icon name={getSampleStatusIcon('rejected')} className="w-3.5 h-3.5 text-text-disabled" />
        }
        statusMessage=""
        statusClassName="text-text-tertiary"
      />
    );
  }

  return null;
};
