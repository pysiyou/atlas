/**
 * PatientFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React, { useState } from 'react';
import { cn } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { ResponsiveFilterMobileBar, PATIENT_FILTER_PLACEHOLDERS } from '@/features/filters';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import { PatientFiltersInlineControls } from './PatientFiltersInlineControls';
import { PatientFiltersModal } from './PatientFiltersModal';
import type { Gender } from '@/types';

import type { AffiliationStatus } from './PatientFilterTypes';

export type { AffiliationStatus } from './PatientFilterTypes';

/**
 * Props interface for PatientFilters component
 */
export interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
  affiliationStatusFilters: AffiliationStatus[];
  onAffiliationStatusFiltersChange: (values: AffiliationStatus[]) => void;
}

/**
 * PatientFilters - Responsive filter layout
 * - lg+: 4-column grid (search + age + sex + affiliation)
 * - md: 2-column grid
 * - sm/xs: Search bar + Filters button (opens modal with all filters)
 */
export const PatientFilters: React.FC<PatientFiltersProps> = props => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeFilterCount =
    (props.ageRange[0] !== AGE_RANGE_MIN || props.ageRange[1] !== AGE_RANGE_MAX ? 1 : 0) +
    props.sexFilters.length +
    props.affiliationStatusFilters.length;

  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  if (showModalView) {
    return (
      <>
        <ResponsiveFilterMobileBar
          searchQuery={props.searchQuery}
          onSearchChange={props.onSearchChange}
          searchPlaceholder={PATIENT_FILTER_PLACEHOLDERS.search}
          activeFilterCount={activeFilterCount}
          onOpenModal={() => setIsModalOpen(true)}
        />
        <PatientFiltersModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          {...props}
        />
      </>
    );
  }

  const inlineControls = <PatientFiltersInlineControls {...props} />;

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
    <div className={cn('w-full bg-surface border-b', 'border-border-default')}>
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">{inlineControls}</div>
      </div>
    </div>
  );
};
