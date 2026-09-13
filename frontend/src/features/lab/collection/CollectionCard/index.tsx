/**
 * CollectionCard - Responsive card component for sample collection workflow
 *
 * Refactored using useResponsiveCard pattern to eliminate mobile/desktop duplication.
 * Mobile and Desktop variants are in separate files for clarity.
 */

import React from 'react';
import { useResponsiveCard } from '../../components/ResponsiveCard';
import { CollectionCardMobile } from './Mobile';
import { CollectionCardDesktop } from './Desktop';
import { useCollectionCardData, type CollectionCardProps } from './hooks';

export const CollectionCard: React.FC<CollectionCardProps> = (props) => {
  const sharedData = useCollectionCardData(props);
  
  // Early return if missing required data
  if (!sharedData) return null;
  
  return useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData,
    renderMobile: CollectionCardMobile,
    renderDesktop: CollectionCardDesktop,
    isMobile: props.isMobile,
  });
};

export type { CollectionCardProps };
