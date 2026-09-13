/**
 * ValidationCard - Responsive card component for result validation workflow
 *
 * Refactored using useResponsiveCard pattern to eliminate mobile/desktop duplication.
 */

import React from 'react';
import { useResponsiveCard } from '../../components/ResponsiveCard';
import { ValidationCardMobile } from './Mobile';
import { ValidationCardDesktop } from './Desktop';
import { useValidationCardData, type ValidationCardProps } from './hooks';

export const ValidationCard: React.FC<ValidationCardProps> = (props) => {
  const sharedData = useValidationCardData(props);
  
  // Early return if missing required data
  if (!sharedData) return null;
  
  return useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData,
    renderMobile: ValidationCardMobile,
    renderDesktop: ValidationCardDesktop,
    isMobile: props.isMobile,
  });
};

export type { ValidationCardProps };
