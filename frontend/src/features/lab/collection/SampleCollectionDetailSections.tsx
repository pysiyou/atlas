/** Collection detail modal grid sections and body content. */
/* eslint-disable react-refresh/only-export-components -- grid builder + content component colocated */
/**
 * SampleCollectionDetailGridSections Component
 * Builds the dynamic grid sections for the collection detail modal
 */
import React from 'react';
import Barcode from 'react-barcode';
import { Badge, Icon, Panel, EntityId } from '@/components';
import type { ContainerType, Sample, RejectedSample, Test } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_CONFIG } from '@/types';
import { formatVolume } from '@/features/lab/utils';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import { DetailGrid, type DetailGridSectionConfig } from '../components/LabWorkflowDetailModal';
import { displayId, formatDateTime } from '@/utils';
import { SampleCollectionRequirementsSection } from './SampleCollectionRequirementsSection';
import { formatRejectionReasons } from '../utils/labFormatters';
import { ICONS } from '@/config/icons';

interface CollectionDetailGridSectionsProps {
  sample: Sample;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  collectedAt?: string;
  collectedBy?: string;
  collectedVolume?: number;
  remainingVolume?: number;
  effectiveContainerType: ContainerType;
  containerColor?: string;
  colorName: string;
  requirement?: {
    containerTypes: ContainerType[];
    containerTopColors: string[];
  };
  getUserName: (userId: string) => string;
}

/**
 * SampleCollectionDetailGridSections Component
 * Builds dynamic grid sections based on sample status
 */
export const buildCollectionDetailGridSections = ({
  sample,
  isPending,
  isRejected,
  isCollected,
  collectedAt,
  collectedBy,
  collectedVolume,
  remainingVolume,
  effectiveContainerType,
  containerColor,
  colorName,
  requirement,
  getUserName,
}: CollectionDetailGridSectionsProps): DetailGridSectionConfig[] => {
  const sections: DetailGridSectionConfig[] = [];

  // Collection Details - collected/rejected only
  if ((isCollected || isRejected) && collectedAt) {
    sections.push({
      title: 'Collection Details',
      fields: [
        { label: 'Collected', timestamp: collectedAt },
        { label: 'Collected By', value: collectedBy ? getUserName(collectedBy) : undefined },
        {
          label: 'Container',
          value: (
            <div className="flex items-center gap-2">
              <Badge size={LAB_CARD_BADGE_SIZE} variant="primary" className="capitalize">
                {effectiveContainerType}
              </Badge>
              {containerColor && (
                <Badge size={LAB_CARD_BADGE_SIZE} variant={`container-${containerColor}` as never}>
                  {colorName} Top
                </Badge>
              )}
            </div>
          ),
        },
      ],
    });
  }

  // Volume Tracking - always shown
  sections.push({
    title: 'Volume Tracking',
    fields: [
      { label: 'Required', value: formatVolume(sample.requiredVolume) },
      {
        label: 'Collected',
        value: collectedVolume !== undefined ? formatVolume(collectedVolume) : undefined,
      },
      {
        label: 'Remaining',
        value:
          remainingVolume !== undefined ? (
            <span className={remainingVolume < sample.requiredVolume * 0.2 ? 'text-danger-fg' : ''}>
              {formatVolume(remainingVolume)}
            </span>
          ) : undefined,
      },
    ],
  });

  // Collection Requirements - pending only
  if (isPending && requirement) {
    sections.push({
      title: 'Collection Requirements',
      fields: [
        {
          label: 'Priority',
          badge: sample.priority ? { value: sample.priority, variant: sample.priority } : undefined,
        },
        {
          label: 'Required Container Types',
          value:
            requirement.containerTypes.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-end">
                {requirement.containerTypes.map((type, idx) => (
                  <Badge key={idx} size={LAB_CARD_BADGE_SIZE} variant="primary" className="capitalize">
                    {CONTAINER_CONFIG[type]?.label || type}
                  </Badge>
                ))}
              </div>
            ) : undefined,
        },
        {
          label: 'Required Container Colors',
          value:
            requirement.containerTopColors.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-end">
                {requirement.containerTopColors.map((color, idx) => (
                  <Badge key={idx} size={LAB_CARD_BADGE_SIZE} variant={`container-${color}` as never}>
                    {CONTAINER_COLOR_OPTIONS.find(opt => opt.value === color)?.label || color} Top
                  </Badge>
                ))}
              </div>
            ) : undefined,
        },
      ],
    });
  }

  // Audit Trail - collected/rejected only
  if (isCollected || isRejected) {
    sections.push({
      title: 'Audit Trail',
      fields: [
        { label: 'Created', timestamp: sample.createdAt },
        { label: 'Created By', value: getUserName(sample.createdBy.toString()) },
        { label: 'Last Updated', timestamp: sample.updatedAt },
        {
          label: 'Updated By',
          value: sample.updatedBy ? getUserName(sample.updatedBy.toString()) : undefined,
        },
      ],
    });
  }

  return sections;
};

/**
 * SampleCollectionDetailContent Component
 * Renders the main content sections of the collection detail modal
 */

interface CollectionDetailContentProps {
  sample: Sample;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  testNames: string[];
  testDetails: Test[];
  testCodes: string[];
  getTest: (code: string) => Test | undefined;
  getUserName: (userId: string) => string;
  collectionNotes?: string;
  gridSections: DetailGridSectionConfig[];
  showBarcode?: boolean;
}

export const SampleCollectionDetailContent: React.FC<CollectionDetailContentProps> = ({
  sample,
  isPending,
  isRejected,
  isCollected,
  rejectedSample,
  testNames,
  testDetails,
  testCodes,
  getTest,
  getUserName,
  collectionNotes,
  gridSections,
  showBarcode = false,
}) => {
  return (
    <>
      {showBarcode && sample.sampleId != null && (
        <div className="flex items-center justify-center bg-surface-page rounded p-4 border border-border-default">
          <Barcode
            value={displayId.sample(sample.sampleId)}
            height={40}
            displayValue={false}
            background="transparent"
            lineColor="var(--text)"
            margin={0}
          />
        </div>
      )}
      <Panel variant="lab" title={isCollected ? 'Linked Tests' : 'Required for'}>
        <ul className="space-y-1">
          {testNames.map((testName, i) => {
            const testCode = testCodes[i];
            const test = testCode ? getTest(testCode) : undefined;
            return (
              <li key={testCode || i} className="flex items-center text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-2" />
                <span className="font-normal mr-1">{testName}</span>
                <EntityId variant="inline" className="mr-2">{testCode}</EntityId>
                {test?.turnaroundTime && (
                  <span className="text-text-disabled flex items-center gap-1">
                    <Icon name={ICONS.dataFields.time} className="w-2.5 h-2.5" />
                    {test.turnaroundTime}h
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Panel>

      {isRejected && rejectedSample && (
        <Panel variant="lab" title="Rejection Details">
          <div className="space-y-2 text-sm text-text-secondary">
            {rejectedSample.rejectionReasons && rejectedSample.rejectionReasons.length > 0 && (
              <p>
                <span className="text-text-tertiary">Reason: </span>
                {formatRejectionReasons(rejectedSample.rejectionReasons)}
              </p>
            )}
            {rejectedSample.rejectionNotes && (
              <p>
                <span className="text-text-tertiary">Notes: </span>
                {rejectedSample.rejectionNotes}
              </p>
            )}
            <p>
              <span className="text-text-tertiary">Rejected by </span>
              {getUserName(rejectedSample.rejectedBy)}
              <span className="text-text-tertiary"> on </span>
              {formatDateTime(rejectedSample.rejectedAt)}
            </p>
            {rejectedSample.recollectionRequired && (
              <p className="text-warning-fg">Recollection required</p>
            )}
          </div>
        </Panel>
      )}

      {isPending && testDetails.length > 0 && (
        <SampleCollectionRequirementsSection testDetails={testDetails} />
      )}

      {collectionNotes && (
        <Panel variant="lab" title="Collection Notes">
          <div className="text-sm text-text-primary">{collectionNotes}</div>
        </Panel>
      )}

      <DetailGrid sections={gridSections} />
    </>
  );
};

