/**
 * Shared responsive layout for entity list filter bars.
 * Handles mobile modal, 2-column tablet, and 4-column desktop grids.
 */

import React, { useState, type ReactNode } from 'react';
import { FILTER } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import type { IconName } from '@/components';
import { ResponsiveFilterMobileBar } from './ResponsiveFilterMobileBar';
import { EntityFilterModal } from './EntityFilterModal';

export interface ResponsiveEntityFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  activeFilterCount: number;
  inlineControls: ReactNode;
  modalContent: ReactNode;
  onReset: () => void;
  footerIcon: IconName;
  footerLabel?: string;
  searchRowHeight?: string;
}

export const ResponsiveEntityFilters: React.FC<ResponsiveEntityFiltersProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  activeFilterCount,
  inlineControls,
  modalContent,
  onReset,
  footerIcon,
  footerLabel,
  searchRowHeight,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  if (showModalView) {
    return (
      <>
        <ResponsiveFilterMobileBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          activeFilterCount={activeFilterCount}
          onOpenModal={() => setIsModalOpen(true)}
          searchRowHeight={searchRowHeight}
        />
        <EntityFilterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          onReset={onReset}
          footerIcon={footerIcon}
          footerLabel={footerLabel}
        >
          {modalContent}
        </EntityFilterModal>
      </>
    );
  }

  if (showTwoColumn) {
    return (
      <div className={cn('w-full bg-surface border-b', 'border-border-default')}>
        <div className={FILTER.barInsetCompact}>
          <div className={FILTER.mobileTwoCol}>{inlineControls}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border-b border-border-default">
      <div className={FILTER.barInset}>
        <div className={FILTER.barGridDesktop}>{inlineControls}</div>
      </div>
    </div>
  );
};
