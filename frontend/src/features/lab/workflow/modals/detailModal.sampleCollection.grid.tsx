/**
 * Sample collection detail modal — DetailGrid sections for collection metadata.
 */

import type { ContainerType, Sample } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_CONFIG } from '@/types';
import { formatVolumeMl } from '@/utils/presentation';
import { TONE } from '@/theme/recipes';
import { DetailGrid, type DetailGridSectionConfig } from '../shared/detailModalLayout';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';

export function CollectionDetailGrid({
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
}: {
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
}) {
  const sections: DetailGridSectionConfig[] = [];

  if ((isCollected || isRejected) && collectedAt) {
    sections.push({
      preset: 'panel.compact.standard', title: 'Collection Details',
      fields: [
        { label: 'Collected', timestamp: collectedAt },
        { label: 'Collected By', value: collectedBy ? getUserName(collectedBy) : undefined },
        {
          label: 'Container',
          value: (() => {
            const containerLabel =
              CONTAINER_CONFIG[effectiveContainerType]?.label ?? effectiveContainerType;
            return containerColor ? `${containerLabel} · ${colorName} top` : containerLabel;
          })(),
        },
      ],
    });
  }

  sections.push({
    preset: 'panel.compact.standard', title: 'Volume Tracking',
    fields: [
      { label: 'Required', value: formatVolumeMl(sample.requiredVolume) },
      {
        label: 'Collected',
        value: collectedVolume !== undefined ? formatVolumeMl(collectedVolume) : undefined,
      },
      {
        label: 'Remaining',
        value:
          remainingVolume !== undefined ? (
            <span className={remainingVolume < sample.requiredVolume * 0.2 ? TONE.danger.fg : ''}>
              {formatVolumeMl(remainingVolume)}
            </span>
          ) : undefined,
      },
    ],
  });

  if (isPending && requirement) {
    sections.push({
      preset: 'panel.compact.standard', title: 'Collection Requirements',
      fields: [
        {
          label: 'Priority',
          value: sample.priority ? formatStatusBadgeLabel(sample.priority) : undefined,
        },
        {
          label: 'Required Container Types',
          value:
            requirement.containerTypes.length > 0
              ? requirement.containerTypes
                  .map(type => CONTAINER_CONFIG[type]?.label || type)
                  .join(', ')
              : undefined,
        },
        {
          label: 'Required Container Colors',
          value:
            requirement.containerTopColors.length > 0
              ? requirement.containerTopColors
                  .map(
                    color =>
                      `${CONTAINER_COLOR_OPTIONS.find(opt => opt.value === color)?.label || color} top`
                  )
                  .join(', ')
              : undefined,
        },
      ],
    });
  }

  return <DetailGrid sections={sections} />;
}
