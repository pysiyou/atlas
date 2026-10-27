import type { IconName } from '@/components/primitives/Icon';
import { DEFAULT_EMPTY_ICON } from '@/utils/constants';

/** Shared empty layout for tables and worklists — icon + title + description. */
export const PANEL_EMPTY_STATE = {
  icon: DEFAULT_EMPTY_ICON satisfies IconName,
  variant: 'compact' as const,
  fill: true,
} as const;

/** Dense tables / split workspace panels — smaller typography and padding. */
export const DENSE_EMPTY_STATE = {
  icon: DEFAULT_EMPTY_ICON satisfies IconName,
  variant: 'dense' as const,
  fill: true,
} as const;

export const DENSE_EMPTY_STATE_TEXT = {
  variant: 'dense' as const,
  fill: true,
} as const;
