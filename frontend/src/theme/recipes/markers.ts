/** List markers and inline separators. */

import { RADIUS } from './spacing';
import { TONE } from './tone';

export const LIST_MARKER = {
  dot: `w-1 h-1 shrink-0 ${RADIUS.pill} bg-text-muted`,
  dotDanger: `w-1 h-1 shrink-0 ${RADIUS.pill} ${TONE.danger.fill}`,
  inlineSeparator: 'text-text-disabled select-none',
  inlineDot: '•',
} as const;
