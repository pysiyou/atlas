/**
 * ValidationCard - Responsive card component for result validation workflow
 *
 * Refactored using useResponsiveCard pattern to eliminate mobile/desktop duplication.
 */

import React from 'react';
import { useResponsiveCard } from '../../components/useResponsiveCard';
import { ValidationCardMobile } from './Mobile';
import { ValidationCardDesktop } from './Desktop';
import { useValidationCardData, type ValidationCardProps, type ValidationCardSharedData } from './hooks';

export const ValidationCard: React.FC<ValidationCardProps> = (props) => {
  const sharedData = useValidationCardData(props);

  const card = useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as ValidationCardSharedData,
    renderMobile: ValidationCardMobile,
    renderDesktop: ValidationCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};

export type { ValidationCardProps };
