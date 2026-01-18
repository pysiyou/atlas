import React from 'react';
import { AgeFilter } from './AgeFilter';
import { SearchBar, MultiSelectFilter } from '@/shared/ui';
import type { Gender } from '@/types';
import { GENDER_VALUES, GENDER_CONFIG } from '@/types';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from './constants';
import { createFilterOptions } from '@/utils/filtering';

const genderOptions = createFilterOptions(GENDER_VALUES, GENDER_CONFIG);

interface PatientFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  ageRange: [number, number];
  onAgeRangeChange: (range: [number, number]) => void;
  sexFilters: Gender[];
  onSexFiltersChange: (values: Gender[]) => void;
}

export const PatientFilters: React.FC<PatientFiltersProps> = ({
  searchQuery,
  onSearchChange,
  ageRange,
  onAgeRangeChange,
  sexFilters,
  onSexFiltersChange,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[240px]">
            <AgeFilter
              value={ageRange}
              onChange={onAgeRangeChange}
              min={AGE_RANGE_MIN}
              max={AGE_RANGE_MAX}
              placeholder="Filter by Age"
              className="w-full"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 hidden md:block" />

          <MultiSelectFilter
            label="Sex"
            options={genderOptions}
            selectedIds={sexFilters}
            onChange={(ids) => onSexFiltersChange(ids as Gender[])}
            selectAllLabel="Select all"
            icon="user-hands"
            placeholder="Filter by Sex"
          />
        </div>

        <div className="w-full md:w-72">
          <SearchBar
            placeholder="Search by name, ID, phone, or email..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
