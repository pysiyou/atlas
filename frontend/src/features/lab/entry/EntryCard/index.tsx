/**
 * EntryCard - Responsive card component for result entry workflow
 *
 * Refactored using useResponsiveCard pattern to eliminate mobile/desktop duplication.
 */

import React from 'react';
import { useResponsiveCard } from '../../components/useResponsiveCard';
import { EntryCardMobile } from './Mobile';
import { EntryCardDesktop } from './Desktop';
import { useEntryCardData, type EntryCardProps, type EntryCardSharedData } from './hooks';

export const EntryCard: React.FC<EntryCardProps> = (props) => {
  const sharedData = useEntryCardData(props);

  const card = useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as EntryCardSharedData,
    renderMobile: EntryCardMobile,
    renderDesktop: EntryCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};

export type { EntryCardProps };
