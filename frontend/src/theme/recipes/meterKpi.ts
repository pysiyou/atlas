/** KPI meter tables inside split workspace panels. */

import { RADIUS } from './spacing';
import { TABLE_TYPE } from './table';
import { text } from './cva/text';

const METER_GRID_COLS =
  'grid-cols-[minmax(8rem,1.25fr)_minmax(4.75rem,2.15fr)_auto]' as const;

const METER_GRID_COLS_STAGE =
  'grid-cols-[minmax(6.75rem,1.1fr)_minmax(4.5rem,auto)_minmax(4.5rem,auto)_minmax(3.25rem,1.25fr)]' as const;

const METER_RADIUS = RADIUS.inline;

export const METER_KPI = {
  headerEndWrap:
    'flex min-w-0 flex-col items-end gap-space-0.5 text-right sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-x-space-2 sm:gap-y-space-0.5',
  headerRange: text({ role: 'caption' }),
  headerInsight: `${text({ role: 'caption' })} tabular-nums`,
  headerInsightMuted: `${text({ role: 'caption' })} tabular-nums text-text-tertiary`,
  table: `w-full min-w-0 overflow-hidden border border-border-subtle ${METER_RADIUS}`,
  tableStage: `w-full min-w-0 overflow-hidden border border-border-subtle ${METER_RADIUS}`,
  tableHeadRow:
    `grid ${METER_GRID_COLS} items-center gap-x-space-3 border-b border-border-subtle/80 bg-surface-hover/40 px-space-3 py-space-2`,
  tableHeadRowStage:
    `grid ${METER_GRID_COLS_STAGE} items-center gap-x-space-2 border-b border-border-subtle/80 bg-surface-hover/40 px-space-3 py-space-2`,
  tableHeadCell: TABLE_TYPE.columnTitle,
  tableHeadCellRight: `${TABLE_TYPE.columnTitle} text-right`,
  tableHeadCellMetric: `${TABLE_TYPE.columnTitle} text-right tabular-nums`,
  tableBody: 'divide-y divide-border-subtle/80',
  tableRow: `grid ${METER_GRID_COLS} items-center gap-x-space-3 px-space-3 py-space-2`,
  tableRowStage: `grid ${METER_GRID_COLS_STAGE} items-center gap-x-space-2 px-space-3 py-space-2`,
  tableMetricCell: `${TABLE_TYPE.cell} text-right tabular-nums`,
  rowLabelWrap: 'flex min-w-0 gap-space-2',
  pipelineRailCell: 'relative flex w-2 shrink-0 items-center justify-center self-stretch',
  stageChip: `relative z-[1] size-meter-stage shrink-0 ${RADIUS.inline}`,
  tableLabel: `${TABLE_TYPE.cell} min-w-0 flex-1 truncate self-center ${text({ role: 'label', intent: 'muted' })}`,
  tableRowMeterTrack: `relative h-meter-track w-full min-w-0 overflow-hidden bg-border-subtle ${METER_RADIUS}`,
  tableRowMeterFill: `absolute inset-y-0 left-0 h-full ${METER_RADIUS} transition-[width] duration-300 ease-out`,
  tableValue: `${TABLE_TYPE.cell} text-right tabular-nums`,
  tablePercent: 'text-text-primary',
  tableCount: 'text-text-tertiary',
  tableTotal: `grid ${METER_GRID_COLS} items-center gap-x-space-3`,
  tableTotalStage: `grid ${METER_GRID_COLS_STAGE} items-center gap-x-space-2`,
  tableTotalLabel: TABLE_TYPE.cell,
  tableTotalValue: `${TABLE_TYPE.cell} text-right tabular-nums`,
  footerCaption: `${text({ role: 'caption' })} mt-space-1.5 text-text-tertiary`,
} as const;
