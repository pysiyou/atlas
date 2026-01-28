/**
 * CollectionDetailGridSections Component
 * Builds the dynamic grid sections for the collection detail modal
 */

import { Badge } from '@/shared/ui';
import type { ContainerType, Sample } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { formatVolume } from '@/utils';
import type { DetailGridSectionConfig } from '../components/LabDetailModal';

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
 * CollectionDetailGridSections Component
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
              <Badge size="sm" variant="primary" className="capitalize">
                {effectiveContainerType}
              </Badge>
              {containerColor && (
                <Badge size="sm" variant={`container-${containerColor}` as never}>
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
            <span className={remainingVolume < sample.requiredVolume * 0.2 ? 'text-red-600' : ''}>
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
                  <Badge key={idx} size="sm" variant="primary" className="capitalize">
                    {type}
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
                  <Badge key={idx} size="sm" variant={`container-${color}` as never}>
                    {CONTAINER_COLOR_OPTIONS.find(opt => opt.value === color)?.name || color} Top
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
