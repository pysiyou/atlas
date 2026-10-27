import type { ReactNode } from 'react';
import type { FilterControl as FilterControlConfig } from './types';
import { FilterControl, type FilterControlSurface } from './FilterControl';

export function renderFilterControl(
  control: FilterControlConfig,
  filterValue: unknown,
  onChange: (value: unknown) => void,
  options: { variant: FilterControlSurface; className?: string }
): ReactNode {
  return (
    <FilterControl
      control={control}
      value={filterValue}
      onChange={onChange}
      surface={options.variant}
      className={options.className}
    />
  );
}
