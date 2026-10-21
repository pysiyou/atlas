/** Segmented tab rails (in-page stage switchers). */

import { CONTROL } from './control';
import { RADIUS } from './spacing';
import { TONE } from './tone';
import { TYPE } from './type';

export const SEGMENTED_CONTROL = {
  rail: `bg-surface-hover p-space-0-5 ${RADIUS.field} flex items-center gap-space-0-5`,
  buttonBase: `relative flex items-center gap-space-1-5 px-space-2-5 py-space-1 ${RADIUS.field} ${TYPE.meta} font-normal transition-all duration-200 cursor-pointer`,
  buttonActive: `bg-surface ${TONE.brand.fg} ${CONTROL.segmentActive}`,
  buttonInactive: 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover',
  iconActive: TONE.brand.fg,
  iconInactive: 'text-text-disabled',
  countBadgeMargin: 'ml-space-1',
} as const;
