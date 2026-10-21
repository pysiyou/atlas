import { cva, type VariantProps } from 'class-variance-authority';

export const text = cva('', {
  variants: {
    role: {
      'heading-lg': 'type-page-title text-text-primary',
      'heading-md': 'type-detail-title text-text-primary',
      'heading-sm': 'type-panel-title text-text-primary',
      'section-title': 'type-section-title text-text-secondary',
      label: 'type-label text-text-secondary',
      value: 'type-body text-text-primary',
      meta: 'type-body text-text-tertiary',
      caption: 'type-caption text-text-tertiary',
      amount: 'type-amount text-text-primary',
    },
    density: {
      default: '',
      compact: 'type-caption',
      table: 'type-table-cell',
    },
  },
  defaultVariants: {
    role: 'value',
    density: 'default',
  },
});

export type TextRecipeProps = VariantProps<typeof text>;
