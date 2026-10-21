/**
 * Generic table column render helpers (no entity routing or domain ids).
 */

import type { ReactNode } from 'react';
import { Text } from '@/components/layout/Text';
import { cn, formatDate, formatDateTime, formatPhoneNumber } from '@/utils';
import { TABLE_TYPE } from '@/theme/recipes';

/** Primary datetime/date in a dedicated table column. */
export const TABLE_DATETIME_CELL_CLASS = `${TABLE_TYPE.datetime} truncate block font-normal`;

/** Datetime/date shown as supporting text (caption scale, tertiary color). */
export const TABLE_DATETIME_SECONDARY_CLASS = `${TABLE_TYPE.datetimeSecondary} truncate block font-normal`;

/** Primary table body line — prefer over raw text-text-primary in column renders. */
export const TABLE_PRIMARY_CELL_CLASS = `${TABLE_TYPE.cell} truncate font-normal`;

export type TableDateTone = 'primary' | 'secondary';

function tableDateClassName(tone: TableDateTone): string {
  return tone === 'secondary' ? TABLE_DATETIME_SECONDARY_CLASS : TABLE_DATETIME_CELL_CLASS;
}

export function renderPatientNameBlock(fullName: string, secondary?: ReactNode): ReactNode {
  return (
    <div className="flex min-w-0 flex-col gap-space-0-5 font-normal">
      <Text as="div" role="body" truncate className="capitalize font-normal">{fullName}</Text>
      {secondary}
    </div>
  );
}

export function renderContactBlock(phone: string, email?: string): ReactNode {
  return (
    <div className="flex min-w-0 flex-col gap-space-0-5 font-normal">
      <Text as="div" role="body" truncate className="font-normal">{formatPhoneNumber(phone)}</Text>
      {email ? (
        <Text as="div" role="body" intent="muted" truncate className="font-normal">{email}</Text>
      ) : null}
    </div>
  );
}

/** Primary + secondary lines for DataTable cells (cell + meta), max two lines. */
export function renderTableTwoLineCell(
  primary: ReactNode,
  secondary?: ReactNode | null,
  options?: { secondaryClassName?: string }
): ReactNode {
  const hasSecondary =
    secondary != null && secondary !== '' && secondary !== ' ';
  return (
    <div className="flex min-w-0 flex-col gap-space-0-5 font-normal">
      <Text as="div" role="body" truncate className="font-normal">{primary}</Text>
      {hasSecondary ? (
        <Text
          as="div"
          role="body"
          intent="muted"
          truncate
          className={cn('font-normal', options?.secondaryClassName)}
        >
          {secondary}
        </Text>
      ) : null}
    </div>
  );
}

export function renderTableEmptyCell(label = '—'): ReactNode {
  return (
    <Text role="body" intent="muted" truncate className="block font-normal">{label}</Text>
  );
}

export function renderDateCell(
  date: string | Date | null | undefined,
  emptyLabel = '—',
  tone: TableDateTone = 'primary'
): ReactNode {
  if (!date) {
    return <Text role="body" intent="muted" className="font-normal">{emptyLabel}</Text>;
  }
  return <span className={tableDateClassName(tone)}>{formatDate(date)}</span>;
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
