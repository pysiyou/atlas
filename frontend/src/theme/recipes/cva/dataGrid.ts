import { cva, type VariantProps } from 'class-variance-authority';
import { text } from './text';

export const dataGrid = cva('w-full min-w-[20rem] table-fixed border-collapse text-left', {
  variants: {
    layout: {
      table: '',
      grid: '',
    },
  },
  defaultVariants: {
    layout: 'table',
  },
});

export type DataGridRecipeProps = VariantProps<typeof dataGrid>;

export const DATA_GRID = {
  scrollWrap: 'overflow-x-auto min-w-0',
  table: dataGrid({ layout: 'table' }),
  headerCell: `${text({ role: 'caption' })} uppercase tracking-wide font-normal text-left text-text-tertiary pb-space-1-5 py-space-0-5 pr-space-4 align-top leading-tight last:pr-0`,
  bodyCell: 'py-space-0-5 pr-space-4 align-top text-left leading-tight last:pr-0',
  labelCell: `${text({ role: 'label' })} py-space-0-5 pr-space-4 align-top text-left leading-tight last:pr-0`,
  colGroup: {
    table: ['w-[40%]', 'w-[35%]', 'w-[25%]'] as const,
  },
} as const;
