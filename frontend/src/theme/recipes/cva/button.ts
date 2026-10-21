import { cva, type VariantProps } from 'class-variance-authority';
import { BUTTON_TYPE, ICON_SIZE } from '../type';
import { CONTROL } from '../control';
import { RADIUS } from '../spacing';

const buttonChrome =
  `inline-flex shrink-0 items-center justify-center font-normal whitespace-nowrap overflow-hidden cursor-pointer transition-colors duration-200 ${CONTROL.focusVisible} disabled:opacity-50 disabled:cursor-not-allowed`;

export const labelButton = cva(buttonChrome, {
  variants: {
    intent: {
      primary: 'bg-brand text-on-brand hover:bg-brand-hover focus-visible:ring-brand',
      secondary:
        'bg-surface-hover text-text-primary hover:bg-border-subtle focus-visible:ring-text-muted',
      danger: 'bg-danger text-on-danger hover:bg-danger-hover focus-visible:ring-danger',
      success: 'bg-success text-on-success hover:bg-success-hover focus-visible:ring-success',
      warning: 'bg-warning text-on-warning hover:bg-warning-hover focus-visible:ring-warning',
      outline:
        'border-2 border-border-strong bg-transparent text-text-secondary hover:bg-surface-hover focus-visible:ring-text-muted',
      ghost:
        'bg-transparent text-text-secondary hover:bg-surface-hover focus-visible:ring-text-muted',
    },
    size: {
      sm: `gap-space-1-5 px-space-3 py-space-1-5 ${BUTTON_TYPE.sm} ${RADIUS.button}`,
      md: `gap-space-1-5 px-space-4 py-space-2 ${BUTTON_TYPE.md} ${RADIUS.button}`,
      lg: `gap-space-1-5 px-table-cell-x-default py-space-3 ${BUTTON_TYPE.lg} ${RADIUS.button}`,
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
    fullWidth: false,
  },
});

export const iconButton = cva(buttonChrome, {
  variants: {
    intent: {
      primary: 'bg-brand text-on-brand hover:bg-brand-hover focus-visible:ring-brand',
      secondary:
        'bg-surface-hover text-text-primary hover:bg-border-subtle focus-visible:ring-text-muted',
      danger: 'bg-danger text-on-danger hover:bg-danger-hover focus-visible:ring-danger',
      success: 'bg-success text-on-success hover:bg-success-hover focus-visible:ring-success',
      warning: 'bg-warning text-on-warning hover:bg-warning-hover focus-visible:ring-warning',
      outline:
        'border-2 border-border-strong bg-transparent text-text-secondary hover:bg-surface-hover focus-visible:ring-text-muted',
      ghost:
        'bg-transparent text-text-secondary hover:bg-surface-hover focus-visible:ring-text-muted',
    },
    size: {
      sm: ICON_SIZE.button.sm,
      md: ICON_SIZE.button.md,
      lg: ICON_SIZE.button.lg,
    },
    shape: {
      circle: RADIUS.buttonCircle,
      square: RADIUS.buttonSquare,
    },
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md',
    shape: 'circle',
  },
});

export type LabelButtonRecipeProps = VariantProps<typeof labelButton>;
export type IconButtonRecipeProps = VariantProps<typeof iconButton>;
