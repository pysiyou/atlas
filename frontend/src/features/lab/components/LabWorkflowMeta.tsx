/** Shared collection/entry metadata lines and container icon. */
/**
 * Sample container type and color icon for collection cards and modals.
 */
import { Icon } from '@/components/primitives';
import { getContainerIconColor } from '../utils';
import type { ContainerType, ContainerTopColor } from '@/types';
import { CONTAINER_TOP_COLOR_OPTIONS } from '@/types';
import { getContainerIcon } from '@/icons';
import { FG } from '@/theme/recipes';
import { LabAuditLineView } from './LabWorkflowHeader';

interface SampleContainerInfoProps {
  containerType: ContainerType;
  containerColor?: ContainerTopColor;
  size?: 'sm' | 'md';
}

export function SampleContainerInfo({
  containerType,
  containerColor,
  size = 'sm',
}: SampleContainerInfoProps) {
  const colorName = containerColor
    ? CONTAINER_TOP_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';

  const iconSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <span className="flex items-center" title={`Container: ${containerType}, Color: ${colorName}`}>
      <Icon iconKey={getContainerIcon(containerType)}
        className={`${iconSize} ${containerColor ? getContainerIconColor(containerColor) : FG.disabled}`}
      />
    </span>
  );
}

/**
 * Sample collection metadata line (who collected, when, accession).
 */

interface SampleCollectionMetaLineProps {
  sampleId?: string | null;
  collectedAt?: string;
  collectedBy?: string;
  className?: string;
}

export function SampleCollectionMetaLine({
  sampleId,
  collectedAt,
  collectedBy,
  className,
}: SampleCollectionMetaLineProps) {
  if (!collectedAt) return null;

  const line =
    sampleId
      ? {
          type: 'sample-collected' as const,
          sampleId,
          collectedAt,
          collectedBy,
        }
      : {
          type: 'collection-only' as const,
          collectedAt,
          collectedBy,
        };

  return <LabAuditLineView line={line} className={className} />;
}

/**
 * Result entry metadata line (who entered values, when).
 */

interface ResultEntryMetaLineProps {
  enteredAt?: string;
  enteredBy?: string;
  className?: string;
}

export function ResultEntryMetaLine({
  enteredAt,
  enteredBy,
  className,
}: ResultEntryMetaLineProps) {
  if (!enteredAt) return null;

  return (
    <LabAuditLineView
      line={{ type: 'result-entered', enteredAt, enteredBy }}
      className={className}
    />
  );
}

