/**
 * ResponsiveFilterMobileBar - Search row with filters button for small screens.
 */

import React from 'react';
import { Button, Badge, DebouncedSearchInput } from '@/components';
import { cn } from '@/utils';

export interface ResponsiveFilterMobileBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  activeFilterCount: number;
  onOpenModal: () => void;
  /** Height class for the search row, e.g. 'h-[34px]' or 'h-9' */
  searchRowHeight?: string;
}

export const ResponsiveFilterMobileBar: React.FC<ResponsiveFilterMobileBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  activeFilterCount,
  onOpenModal,
  searchRowHeight = 'h-[34px]',
}) => (
  <div className="w-full bg-surface border-b border-border-default">
    <div className="px-3 py-2 w-full">
      <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
        <div className={cn('flex', searchRowHeight, 'w-full items-center')}>
          <DebouncedSearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="relative flex shrink-0">
          <Button variant="filter" size="sm" onClick={onOpenModal}>
            Filters
          </Button>
          {activeFilterCount > 0 && (
            <Badge
              variant="primary"
              size="xs"
              className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 flex items-center justify-center"
            >
              {activeFilterCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  </div>
);
