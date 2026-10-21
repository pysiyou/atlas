/**
 * Closed layout roles for Panel presets — replaces call-site className / bodyClassName.
 */

import { SPACING } from '@/theme/recipes';
import type { PanelBodyLayout, PanelShellLayout, PanelSpacing } from './types';

export const PANEL_SHELL_LAYOUT: Record<PanelShellLayout, string> = {
  default: '',
  detailShrink: 'shrink-0',
  detailFill: 'h-full min-h-0',
  detailMinH: 'min-h-0',
  gridSpan2: 'col-span-2',
  gridSpan2Min: 'col-span-2 min-h-0',
  gridSpan2Fill: 'col-span-2 h-full min-h-0',
  stackMinHeight: 'shrink-0 min-h-48',
  fullWidth: 'w-full',
  modalShrink: 'h-auto shrink-0',
};

export const PANEL_BODY_LAYOUT: Record<PanelBodyLayout, string> = {
  default: '',
  formStack: 'space-y-space-6',
  flexColumn: 'flex flex-col',
  flexColumnMin: 'flex flex-col min-h-0',
  flexColumnFill: 'flex min-h-0 flex-1 flex-col overflow-hidden',
  embedFlexFill: 'flex min-h-0 flex-1 flex-col',
  minH0: 'min-h-0',
};

export const PANEL_SPACING: Record<PanelSpacing, string> = {
  none: '',
  compact: SPACING.stackCompact,
  normal: SPACING.stackNormal,
  relaxed: SPACING.stackRelaxed,
};

export const PANEL_SCROLL = {
  auto: 'overflow-y-auto',
  visible: 'overflow-visible',
} as const;
