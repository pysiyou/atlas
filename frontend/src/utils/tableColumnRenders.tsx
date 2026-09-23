/**
 * Generic table column render helpers (no entity routing or domain ids).
 */

import type { ReactNode } from 'react';
import { formatDate, formatDateTime, formatPhoneNumber } from '@/utils';
import { TYPE } from '@/components/theme/recipes';

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
    <div className="text-xs min-w-0 font-normal">
      <div className={`${TYPE.value} truncate font-normal`}>
        {formatPhoneNumber(phone)}
      </div>
      {email ? (
        <div className={`${TYPE.meta} truncate font-normal`}>{email}</div>
      ) : null}
    </div>
  );
}

export function renderDateCell(
  date: string | Date | null | undefined,
  emptyLabel = '—'
): ReactNode {
  if (!date) {
    return <span className={`${TYPE.meta} font-normal`}>{emptyLabel}</span>;
  }
  return <span className={`${TYPE.value} font-normal`}>{formatDate(date)}</span>;
}

export function renderDateTimeCell(
  date: string | Date | null | undefined,
  emptyLabel = '—'
): ReactNode {
  if (!date) {
    return <span className={`${TYPE.meta} font-normal`}>{emptyLabel}</span>;
  }
  return <span className={`${TYPE.value} font-normal`}>{formatDateTime(date)}</span>;
}
