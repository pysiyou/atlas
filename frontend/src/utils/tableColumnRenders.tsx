/* eslint-disable react-refresh/only-export-components -- util render helpers, not a component module */
/**
 * Generic table column render helpers (no entity routing or domain ids).
 */

import type { ReactNode } from 'react';
import { Text } from '@/components/layout/Text';
import { cn, formatDate, formatPhoneNumber } from '@/utils';
import {
  renderDateTimeCell,
  type TableDateTone,
  TABLE_DATETIME_CELL_CLASS,
  TABLE_DATETIME_SECONDARY_CLASS,
} from '@/components/data-table/datetimeColumnRender';
import { PRESENTATION_STACK_CLASS, TABLE_TYPE } from '@/theme/recipes';
import { renderStackedIdentity } from '@/utils/presentationRenders';

export {
  TABLE_DATETIME_CELL_CLASS,
  TABLE_DATETIME_SECONDARY_CLASS,
} from '@/components/data-table/datetimeColumnRender';

/** Primary table body line — prefer over raw text-text-primary in column renders. */
export const TABLE_PRIMARY_CELL_CLASS = `${TABLE_TYPE.cell} truncate font-normal`;

export type { TableDateTone };
export { renderDateTimeCell };

export function renderPatientNameBlock(fullName: string, secondary?: ReactNode): ReactNode {
  return renderStackedIdentity(fullName, secondary, { density: 'table' });
}

export function renderContactBlock(phone: string, email?: string): ReactNode {
  return (
    <div className={PRESENTATION_STACK_CLASS}>
      <Text as="div" role="body" density="table" truncate className="font-normal">{formatPhoneNumber(phone)}</Text>
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
    <div className={PRESENTATION_STACK_CLASS}>
      <Text as="div" role="body" density="table" truncate className="font-normal">{primary}</Text>
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

function tableDateClassName(tone: TableDateTone): string {
  return tone === 'secondary' ? TABLE_DATETIME_SECONDARY_CLASS : TABLE_DATETIME_CELL_CLASS;
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

