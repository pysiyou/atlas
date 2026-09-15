/**
 * CollectionCard - Responsive card component for sample collection workflow
 *
 * Refactored using useResponsiveCard pattern to eliminate mobile/desktop duplication.
 * Mobile and Desktop variants are in separate files for clarity.
 */

import React from 'react';
import { useResponsiveCard } from '../../components/useResponsiveCard';
import { CollectionCardMobile } from './Mobile';
import { CollectionCardDesktop } from './Desktop';
import { useCollectionCardData, type CollectionCardProps, type CollectionCardSharedData } from './hooks';

export const CollectionCard: React.FC<CollectionCardProps> = (props) => {
  const sharedData = useCollectionCardData(props);

  const card = useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as CollectionCardSharedData,
    renderMobile: CollectionCardMobile,
    renderDesktop: CollectionCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};

export type { CollectionCardProps };
