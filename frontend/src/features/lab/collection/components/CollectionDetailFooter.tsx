/**
 * CollectionDetailFooter Component
 * Builds the footer content with action buttons based on sample status
 */

import React from 'react';
import { Button, Icon } from '@/shared/ui';
import type {
  ContainerType,
  Sample,
  RejectedSample,
  SampleDisplay,
  Order,
  RejectionReason,
} from '@/types';
import { CollectionPopover } from '../CollectionPopover';
import { CollectionRejectionPopover } from '../CollectionRejectionPopover';
import { ModalFooter } from '../../components/LabDetailModal';
import { orderHasValidatedTests, getValidatedTestCount } from '@/features/order/utils';
import { getSampleStatusIcon } from '@/utils/icon-helpers';
import { ICONS } from '@/utils/icon-mappings';

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
    containerType?: ContainerType
  ) => void;
  onReject: (
    reasons: RejectionReason[],
    notes?: string,
    requireRecollection?: boolean
  ) => Promise<void>;
  onClose: () => void;
}

/**
 * CollectionDetailFooter Component
 * Renders footer content with action buttons based on sample status
 */
export const CollectionDetailFooter: React.FC<CollectionDetailFooterProps> = ({
  sample,
  order,
  isPending,
  isRejected,
  isCollected,
  rejectedSample,
  pendingSampleDisplay,
  patientName,
  testNames,
  onCollect,
  onReject,
  onClose,
}) => {
  // For pending samples - show collect button
  if (isPending && pendingSampleDisplay && onCollect) {
    const isRecollection =
      sample.isRecollection || (sample.rejectionHistory && sample.rejectionHistory.length > 0);
    return (
      <ModalFooter
        statusIcon={<Icon name={getSampleStatusIcon('pending')} className="w-4 h-4 text-gray-400" />}
        statusMessage="Sample pending collection"
        statusClassName="text-gray-500"
      >
        <CollectionPopover
          requirement={pendingSampleDisplay.requirement!}
          patientName={patientName}
          testName={testNames.join(', ')}
          isRecollection={isRecollection}
          onConfirm={(volume, notes, color, ct) => {
            onCollect(pendingSampleDisplay, volume, notes, color, ct);
            onClose();
          }}
          trigger={
            <Button variant="primary" size="md" icon={<Icon name={ICONS.dataFields.flask} />}>
              {isRecollection ? 'Recollect Sample' : 'Collect Sample'}
            </Button>
          }
        />
      </ModalFooter>
    );
  }

  // For collected samples - show print and reject buttons
  if (isCollected && sample.sampleId) {
    const hasValidatedTests = order ? orderHasValidatedTests(order) : false;
    const validatedCount = order ? getValidatedTestCount(order) : 0;

    return (
      <ModalFooter
        statusIcon={<Icon name={getSampleStatusIcon('collected')} className="w-4 h-4 text-gray-400" />}
        statusMessage={
          hasValidatedTests
            ? `Cannot reject - ${validatedCount} test${validatedCount > 1 ? 's' : ''} already validated`
            : 'Sample collected successfully'
        }
        statusClassName={hasValidatedTests ? 'text-amber-600' : 'text-gray-500'}
      >
        {/* Print button - functionality handled by parent component */}
        {hasValidatedTests ? (
          <Button
            variant="reject"
            size="md"
            disabled
            title={`Cannot reject sample: ${validatedCount} test${validatedCount > 1 ? 's have' : ' has'} already been validated`}
          >
            Reject Sample
          </Button>
        ) : (
          <CollectionRejectionPopover
            sampleId={sample.sampleId.toString()}
            sampleType={sample.sampleType}
            patientName={patientName}
            isRecollection={sample.isRecollection || false}
            rejectionHistoryCount={sample.rejectionHistory?.length || 0}
            onReject={onReject}
            trigger={
              <Button variant="reject" size="md">
                Reject Sample
              </Button>
            }
          />
        )}
      </ModalFooter>
    );
  }

  // For rejected samples - show status only
  if (isRejected) {
    return (
      <ModalFooter
        statusIcon={<Icon name={getSampleStatusIcon('rejected')} className="w-4 h-4 text-gray-400" />}
        statusMessage={
          rejectedSample?.recollectionRequired
            ? 'Sample rejected - recollection requested'
            : 'Sample rejected'
        }
        statusClassName="text-gray-500"
      />
    );
  }

  return null;
};
