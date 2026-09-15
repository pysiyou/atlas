/**
 * EscalationCard - Responsive card for escalated tests in the resolution queue
 *
 * Refactored using useResponsiveCard pattern.
 */

import React from 'react';
import { useResponsiveCard } from '../../components/useResponsiveCard';
import { EscalationCardMobile } from './Mobile';
import { EscalationCardDesktop } from './Desktop';
import { useEscalationCardData, type EscalationCardProps } from './hooks';

export const EscalationCard: React.FC<EscalationCardProps> = (props) => {
  const sharedData = useEscalationCardData(props);
  
  return useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData,
    renderMobile: EscalationCardMobile,
    renderDesktop: EscalationCardDesktop,
    isMobile: props.isMobile,
  });
};

export type { EscalationCardProps };
