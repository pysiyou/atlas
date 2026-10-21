import { cva, type VariantProps } from 'class-variance-authority';

export const text = cva('', {
  variants: {
    role: {
      'title-page': 'type-page-title',
      'title-section': 'type-heading-sm',
      'title-panel': 'type-panel-title',
      'title-modal': 'type-heading-xs',
      'section-title': 'type-section-title',
      label: 'type-ui-sm',
      body: 'type-body',
      caption: 'type-caption',
      amount: 'type-ui-md tabular-nums',
    },
    intent: {
      default: '',
      muted: '',
    },
    density: {
      default: '',
      compact: 'type-caption',
      table: 'type-ui-sm',
    },
  },
  compoundVariants: [
    { role: 'label', intent: 'default', class: 'text-text-secondary' },
    { role: 'label', intent: 'muted', class: 'text-text-tertiary' },
    { role: 'body', intent: 'default', class: 'text-text-primary' },
    { role: 'body', intent: 'muted', class: 'text-text-tertiary' },
    { role: 'caption', intent: 'default', class: 'text-text-tertiary' },
    { role: 'caption', intent: 'muted', class: 'text-text-muted' },
    { role: 'section-title', intent: 'default', class: 'text-text-secondary' },
    { role: 'section-title', intent: 'muted', class: 'text-text-tertiary' },
    { role: 'title-page', intent: 'default', class: 'text-text-primary' },
    { role: 'title-section', intent: 'default', class: 'text-text-primary' },
    { role: 'title-panel', intent: 'default', class: 'text-text-primary' },
    { role: 'title-modal', intent: 'default', class: 'text-text-primary' },
    { role: 'amount', intent: 'default', class: 'text-text-primary' },
    { role: 'amount', intent: 'muted', class: 'text-text-tertiary' },
  ],
  defaultVariants: {
    role: 'body',
    intent: 'default',
    density: 'default',
  },
});

export type TextRecipeProps = VariantProps<typeof text>;

/** Detail / key-value link line */
export const TEXT_LINK = `${text({ role: 'body' })} text-brand underline`;
