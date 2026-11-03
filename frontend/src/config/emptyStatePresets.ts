import type { IconKey } from '@/config/icons';
import { IconKeys } from '@/config/icons';

/** Shared empty layout for tables and worklists — icon + title + description. */
export const PANEL_EMPTY_STATE = {
  icon: IconKeys.ui.database satisfies IconKey,
  variant: 'compact' as const,
  fill: true,
} as const;

/** Dense tables / split workspace panels — smaller typography and padding. */
export const DENSE_EMPTY_STATE = {
  icon: IconKeys.ui.database satisfies IconKey,
  variant: 'dense' as const,
  fill: true,
} as const;

export const DENSE_EMPTY_STATE_TEXT = {
  variant: 'dense' as const,
  fill: true,
} as const;
