/**
 * Shared responsive layout for entity list filter bars.
 * Handles mobile modal, 2-column tablet, and 4-column desktop grids.
 */

import React, { useState, type ReactNode } from 'react';
import { cn } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
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
        >
          {modalContent}
        </EntityFilterModal>
      </>
    );
  }

  if (showTwoColumn) {
    return (
      <div className={cn('w-full bg-surface border-b', 'border-border-default')}>
        <div className="px-3 py-2 w-full">
          <div className="grid grid-cols-2 gap-2 items-center w-full">{inlineControls}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border-b border-border-default">
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">{inlineControls}</div>
      </div>
    </div>
  );
};
