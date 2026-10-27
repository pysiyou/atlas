/**
 * Single dispatcher for bar and modal filter controls.
 */

import type { FilterControl as FilterControlConfig } from './types';
import { renderFilterControlSwitch } from './filterControlSwitch';

export type FilterControlSurface = 'bar' | 'modal';

export interface FilterControlProps {
  control: FilterControlConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  surface: FilterControlSurface;
  className?: string;
}

export function FilterControl(props: FilterControlProps) {
  return renderFilterControlSwitch(props);
}
