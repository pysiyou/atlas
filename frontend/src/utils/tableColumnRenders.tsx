/**
 * Generic table column render helpers (no entity routing or domain ids).
 */

import type { ReactNode } from 'react';
import { formatDate, formatDateTime, formatPhoneNumber } from '@/utils';
import { TABLE_TYPE } from '@/components/theme/recipes';

export function renderPatientNameBlock(fullName: string, secondary?: ReactNode): ReactNode {
  return (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal capitalize">{fullName}</div>
      {secondary}
    </div>
  );
}

export function renderContactBlock(phone: string, email?: string): ReactNode {
  return (
    <div className="min-w-0 font-normal">
      <div className={`${TABLE_TYPE.cell} truncate font-normal`}>
        {formatPhoneNumber(phone)}
      </div>
      {email ? (
        <div className={`${TABLE_TYPE.meta} truncate font-normal`}>{email}</div>
      ) : null}
    </div>
  );
}

export function renderDateCell(
  date: string | Date | null | undefined,
  emptyLabel = '—'
): ReactNode {
  if (!date) {
    return <span className={`${TABLE_TYPE.meta} font-normal`}>{emptyLabel}</span>;
  }
  return <span className={`${TABLE_TYPE.cell} font-normal`}>{formatDate(date)}</span>;
}

export function renderDateTimeCell(
  date: string | Date | null | undefined,
  emptyLabel = '—'
): ReactNode {
  if (!date) {
    return <span className={`${TABLE_TYPE.meta} font-normal`}>{emptyLabel}</span>;
  }
  return <span className={`${TABLE_TYPE.cell} font-normal`}>{formatDateTime(date)}</span>;
}
