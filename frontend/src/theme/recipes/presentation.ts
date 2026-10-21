/** Stacked identity, table layout, and semantic foreground classes (recipe tier only). */

import { text } from './cva/text';
import { TONE } from './tone';

export const PRESENTATION_STACK_CLASS =
  'flex min-w-0 flex-col gap-space-0-5 items-start font-normal w-full' as const;

/** Foreground utilities for JSX — features import from @/theme/recipes, not raw text-text-*. */
export const FG = {
  body: text({ role: 'body' }),
  bodyMuted: text({ role: 'body', intent: 'muted' }),
  labelMuted: text({ role: 'label', intent: 'muted' }),
  captionMuted: text({ role: 'caption', intent: 'muted' }),
  sectionTitleMuted: text({ role: 'section-title', intent: 'muted' }),
  amount: text({ role: 'amount' }),
  amountMuted: text({ role: 'amount', intent: 'muted' }),
  disabled: 'text-text-disabled',
  muted: 'text-text-muted',
  mutedSoft: 'text-text-muted/70',
  placeholder: 'placeholder:text-text-muted',
  iconInteractive: 'text-text-muted group-hover:text-brand transition-colors',
  iconDisabled: 'text-text-disabled',
  iconDisabledHoverMuted: 'text-text-disabled hover:text-text-tertiary',
  popoverAnchor: text({ role: 'body' }),
  modalStatus: text({ role: 'caption', intent: 'muted' }),
  monoBody: `font-mono ${text({ role: 'body' })}`,
  monoCaptionMuted: `font-mono ${text({ role: 'caption', intent: 'muted' })}`,
  success: TONE.success.fg,
  warning: TONE.warning.fg,
  danger: TONE.danger.fg,
  brand: TONE.brand.fg,
} as const;
