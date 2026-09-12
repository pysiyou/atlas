/**
 * Shared layout + status styling for result entry / validation panels in modals.
 */
import type { ResultStatus } from '@/types/enums';
import { isCritical } from '../utils/labHelpers';

export const RESULT_PANEL = {
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3',
  tile:
    'rounded-md border px-3 py-2.5 flex flex-col gap-1.5 min-h-[4.5rem] transition-colors duration-150',
  tileEmpty: 'border-border-subtle bg-surface-page/40',
  tileFilled: 'border-border-default bg-surface shadow-sm',
  label: 'text-xxs font-medium text-text-tertiary truncate',
  value: 'text-lg font-medium tabular-nums leading-tight',
  unit: 'text-xs font-normal text-text-tertiary ml-1',
  ref: 'text-xxs text-text-disabled truncate',
  notesSection: 'mt-4 pt-4 border-t border-border-subtle space-y-3',
  notesLabel: 'text-xs font-normal text-text-tertiary',
} as const;

export function resultTileStatusClass(status: ResultStatus, hasValue: boolean): string {
  if (!hasValue) return RESULT_PANEL.tileEmpty;
  if (isCritical(status)) {
    return 'border-danger-stroke bg-danger-bg/15 shadow-sm ring-1 ring-danger-stroke/20';
  }
  if (status !== 'normal') {
    return 'border-warning-stroke bg-warning-bg/20 shadow-sm';
  }
  return RESULT_PANEL.tileFilled;
}

export function resultValueClass(status: ResultStatus): string {
  if (isCritical(status)) return 'text-danger-fg';
  if (status !== 'normal') return 'text-warning-fg';
  return 'text-text-primary';
}

export function resultStatusLabel(status: ResultStatus): string | null {
  if (status === 'normal') return null;
  if (isCritical(status)) return 'Critical';
  if (status === 'high' || status === 'critical-high') return 'High';
  if (status === 'low' || status === 'critical-low') return 'Low';
  return status;
}
