import { cva, type VariantProps } from 'class-variance-authority';

export const tableCell = cva('min-w-0 overflow-hidden flex items-center', {
  variants: {
    align: {
      start: 'justify-start text-left',
      end: 'justify-end text-right',
    },
    tone: {
      primary: 'type-ui-sm text-text-primary',
      secondary: 'type-ui-sm text-text-secondary',
      meta: 'type-ui-sm text-text-tertiary',
    },
    density: {
      compact: 'px-table-cell-x-compact py-table-cell-y-compact',
      md: 'px-table-cell-x-default py-table-cell-y-default',
      comfortable: 'px-table-cell-x-comfortable py-table-cell-y-comfortable',
    },
  },
  defaultVariants: {
    align: 'start',
    tone: 'primary',
    density: 'md',
  },
});

export type TableCellRecipeProps = VariantProps<typeof tableCell>;
