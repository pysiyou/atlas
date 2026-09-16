/**
 * Sample container type and color icon for collection cards and modals.
 */

import React from 'react';
import { Icon } from '@/components';
import { getContainerIconColor } from '@/features/lab/utils';
import type { ContainerType, ContainerTopColor } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIcon } from '@/config/icons';

interface SampleContainerInfoProps {
  containerType: ContainerType;
  containerColor?: ContainerTopColor;
  size?: 'sm' | 'md';
}

export const SampleContainerInfo: React.FC<SampleContainerInfoProps> = ({
  containerType,
  containerColor,
  size = 'sm',
}) => {
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';

  const iconSize = size === 'sm' ? 'w-6 h-6' : 'w-7 h-7';

  return (
    <span className="flex items-center" title={`Container: ${containerType}, Color: ${colorName}`}>
      <Icon
        name={getContainerIcon(containerType)}
        className={`${iconSize} ${containerColor ? getContainerIconColor(containerColor) : 'text-text-disabled'}`}
      />
    </span>
  );
};
