/** KPI meter tables inside split workspace panels. */

import { RADIUS } from './spacing';
import { TABLE_TYPE } from './table';
import { TYPE } from './type';

const METER_GRID_COLS =
  'grid-cols-[minmax(8rem,1.25fr)_minmax(4.75rem,2.15fr)_auto]' as const;

const METER_RADIUS = RADIUS.inline;

export const METER_KPI = {
  headerEndWrap:
    'flex min-w-0 flex-col items-end gap-space-0.5 text-right sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-space-2 sm:gap-y-space-0.5',
  headerRange: TYPE.caption,
  headerInsight: `${TYPE.caption} tabular-nums`,
  headerInsightMuted: `${TYPE.caption} tabular-nums text-text-tertiary`,
  table: `w-full min-w-0 overflow-hidden border border-border-subtle ${METER_RADIUS}`,
  tableHeadRow:
    `grid ${METER_GRID_COLS} items-center gap-x-space-3 border-b border-border-subtle/80 bg-surface-hover/40 px-space-3 py-space-2`,
  tableHeadCell: TABLE_TYPE.columnTitle,
  tableHeadCellRight: `${TABLE_TYPE.columnTitle} text-right`,
  tableBody: 'divide-y divide-border-subtle/80',
  tableRow: `grid ${METER_GRID_COLS} items-center gap-x-space-3 px-space-3 py-space-2`,
  rowLabelWrap: 'flex min-w-0 gap-space-2',
  pipelineRailCell: 'relative flex w-2 shrink-0 items-center justify-center self-stretch',
  pipelineRailLine:
    'pointer-events-none absolute left-1/2 top-[calc(50%+0.25rem)] bottom-0 w-px -translate-x-1/2 bg-border-subtle/90',
  stageChip: `relative z-[1] size-meter-stage shrink-0 ${RADIUS.inline}`,
  tableLabel: `${TABLE_TYPE.cell} min-w-0 flex-1 truncate self-center text-text-secondary`,
  tableRowMeterTrack: `relative h-meter-track w-full min-w-0 overflow-hidden bg-border-subtle ${METER_RADIUS}`,
  stairGhostTrack: `pointer-events-none absolute inset-0 bg-border-default/10 ${METER_RADIUS}`,
  tableRowMeterFill: `absolute top-0 z-[1] h-full ${METER_RADIUS} transition-[left,width] duration-300 ease-out`,
  tableRowMeterDot: `absolute top-1/2 z-[1] size-meter-dot -translate-y-1/2 ${METER_RADIUS}`,
  tableValue: `${TABLE_TYPE.cell} text-right tabular-nums text-text-primary`,
  tablePercent: 'text-text-primary',
  tableCount: 'text-text-tertiary',
  tableTotal: `grid ${METER_GRID_COLS} items-center gap-x-space-3`,
  tableTotalLabel: `${TABLE_TYPE.cell} text-text-primary`,
  tableTotalValue: `${TABLE_TYPE.cell} text-right tabular-nums text-text-primary`,
  footerCaption: `${TYPE.caption} mt-space-1.5 text-text-tertiary`,
} as const;
