import { cva, type VariantProps } from 'class-variance-authority';
import { RADIUS, SHADOW } from '../spacing';

export const selectableCard = cva(
  `group relative border-2 ${RADIUS.menu} p-space-5 cursor-pointer transition-all duration-200`,
  {
    variants: {
      selected: {
        true: `border-brand bg-brand-muted ${SHADOW.subtle}`,
        false: `border-border-default hover:border-border-strong bg-surface hover:shadow-sm`,
      },
      emphasis: {
        default: '',
        featured: 'ring-2 ring-brand/20',
      },
    },
    defaultVariants: {
      selected: false,
      emphasis: 'default',
    },
  }
);

export type SelectableCardRecipeProps = VariantProps<typeof selectableCard>;

export const SELECTABLE_CARD = {
  list: 'space-y-space-3',
  featuredBadge:
    'absolute -top-space-2-5 left-1/2 -translate-x-1/2 px-space-3 py-space-0-5 text-xs font-medium bg-brand text-on-brand rounded-full',
  checkIconWell: `flex-shrink-0 w-4 h-4 ${RADIUS.pill} bg-brand flex items-center justify-center mt-space-0-5`,
  featureRow: 'flex items-start gap-space-3',
} as const;
