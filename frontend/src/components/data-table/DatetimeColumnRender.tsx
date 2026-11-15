/**
 * Generic datetime table cell render (no domain ids).
 */

import type { ReactNode } from 'react';
import { Text } from '@/components/layout/Text';
import { formatDateTime } from '@/utils';
import { TABLE_TYPE } from '@/theme/recipes';

export const TABLE_DATETIME_CELL_CLASS = `${TABLE_TYPE.datetime} truncate block font-normal`;
export const TABLE_DATETIME_SECONDARY_CLASS = `${TABLE_TYPE.datetimeSecondary} truncate block font-normal`;

export type TableDateTone = 'primary' | 'secondary';

function tableDateClassName(tone: TableDateTone): string {
  return tone === 'secondary' ? TABLE_DATETIME_SECONDARY_CLASS : TABLE_DATETIME_CELL_CLASS;
}

export function renderDateTimeCell(
  date: string | Date | null | undefined,
  emptyLabel = '—',
  tone: TableDateTone = 'primary'
): ReactNode {
  if (!date) {
    return <Text role="body" intent="muted" className="font-normal">{emptyLabel}</Text>;
  }
  return <span className={tableDateClassName(tone)}>{formatDateTime(date)}</span>;
}
