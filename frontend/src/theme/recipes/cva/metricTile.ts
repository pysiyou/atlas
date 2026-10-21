import { cva, type VariantProps } from 'class-variance-authority';
import { RADIUS, SHADOW } from '../spacing';
import { TONE } from '../tone';
import { TYPE } from '../type';

export const metricTile = cva(
  `${RADIUS.surface} border px-space-3 py-space-2-5 flex flex-col gap-space-1-5 min-h-[4.5rem] transition-colors duration-150`,
  {
    variants: {
      state: {
        empty: 'border-border-subtle bg-surface-page/40',
        filled: `border-border-default bg-surface ${SHADOW.subtle}`,
        warning: `${TONE.warning.well} ${SHADOW.subtle}`,
        danger: `${TONE.danger.well} ${SHADOW.subtle}`,
      },
      density: {
        md: '',
        compact: 'px-space-2 py-space-2 min-h-[3.5rem] gap-space-1',
      },
    },
    defaultVariants: {
      state: 'filled',
      density: 'md',
    },
  }
);

export type MetricTileRecipeProps = VariantProps<typeof metricTile>;

export const METRIC_TILE = {
  tile: metricTile({ state: 'filled' }),
  grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-3',
  label: `${TYPE.caption} font-medium truncate`,
  value: `${TYPE.pageTitle} font-medium tabular-nums`,
  unit: `${TYPE.meta} font-normal ml-space-1`,
  reference: `${TYPE.caption} leading-none font-normal truncate shrink-0 max-w-[50%]`,
  referenceUnavailable: `${TYPE.caption} leading-none font-normal truncate shrink-0 max-w-[50%]`,
  notesSection: 'mt-space-4 pt-space-4 border-t border-border-subtle space-y-space-3',
  notesLabel: `${TYPE.label} font-normal`,
  inlineDenseGrid: 'grid grid-cols-2 sm:grid-cols-4 gap-x-space-4 gap-y-space-0-5',
  inlineGrid:
    'grid grid-cols-[repeat(auto-fit,minmax(140px,max-content))] gap-x-space-6 gap-y-space-1',
  inlineRow: 'flex flex-wrap items-baseline gap-x-space-2 min-w-0 text-left',
  inlineRowDense: 'flex flex-wrap items-baseline gap-x-space-1-5 min-w-0 text-left',
} as const;

export type MetricTileState = NonNullable<MetricTileRecipeProps['state']>;

export function metricTileStateFromResult(
  status: string,
  hasValue: boolean,
  isCriticalFn: (s: string) => boolean
): MetricTileState {
  if (!hasValue) return 'empty';
  if (isCriticalFn(status)) return 'danger';
  if (status !== 'normal') return 'warning';
  return 'filled';
}
