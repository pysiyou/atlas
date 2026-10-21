/** Grouped attention / activity feeds with sticky section headers. */

import { TABLE_TYPE } from './table';
import { TONE } from './tone';
import { TYPE } from './type';

export const FEED_ACCENT = {
  problem: TONE.danger.fill,
  neutral: TONE.warning.fill,
} as const;

export const FEED_GROUPED = {
  groupHeader: 'sticky top-0 z-[1] flex items-center gap-space-2 bg-transparent py-space-2',
  groupDivider: 'flex-1 h-px bg-border-subtle',
  groupLabel: `${TYPE.sectionTitle} tracking-widest`,
  eventHeadline: `min-w-0 ${TABLE_TYPE.cell} font-normal text-text-primary`,
  detailRow: 'flex min-w-0 flex-wrap items-center gap-x-space-2 gap-y-space-1',
  detailDivider: 'h-3.5 w-px shrink-0 self-center bg-border-default',
} as const;
