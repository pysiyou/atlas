/**
 * EntryCard - Responsive card component for result entry workflow
 *
 * Refactored using useResponsiveCard pattern to eliminate mobile/desktop duplication.
 */

import React from 'react';
import { useResponsiveCard } from '../../components/ResponsiveCard';
import { EntryCardMobile } from './Mobile';
import { EntryCardDesktop } from './Desktop';
import { useEntryCardData, type EntryCardProps } from './hooks';

export const EntryCard: React.FC<EntryCardProps> = (props) => {
  const sharedData = useEntryCardData(props);
  
  // Early return if missing required data
  if (!sharedData) return null;
  
  return useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData,
    renderMobile: EntryCardMobile,
    renderDesktop: EntryCardDesktop,
    isMobile: props.isMobile,
  });
};

export type { EntryCardProps };
