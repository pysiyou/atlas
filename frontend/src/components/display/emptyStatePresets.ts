import type { IconName } from '@/components/primitives/Icon';
import { DEFAULT_EMPTY_ICON } from '@/utils/constants';

/** Shared empty layout for dashboard panels (command center, side panels). */
export const PANEL_EMPTY_STATE = {
  icon: DEFAULT_EMPTY_ICON satisfies IconName,
  variant: 'compact' as const,
  fill: true,
} as const;
