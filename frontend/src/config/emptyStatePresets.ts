import type { IconName } from '@/components/primitives/Icon';
import { DEFAULT_EMPTY_ICON } from '@/utils/constants';

/** Shared empty layout for tables and worklists — icon + title + description. */
export const PANEL_EMPTY_STATE = {
  icon: DEFAULT_EMPTY_ICON satisfies IconName,
  variant: 'compact' as const,
  fill: true,
} as const;

/** Command center side panels (Today, Attention, Activity) — title + description only. */
export const PANEL_EMPTY_STATE_TEXT = {
  variant: 'compact' as const,
  fill: true,
} as const;

/** Detail modals — same as panel text-only empty (no icon). */
export const MODAL_EMPTY_STATE = PANEL_EMPTY_STATE_TEXT;

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
