/**
 * Reusable table column render helpers for *TableConfig files.
 */

import type { ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { formatDate, formatPhoneNumber, calculateAge, formatCurrency } from '@/utils';
import { displayId } from '@/utils';
import {
  DATA_AMOUNT,
  ENTITY_ID_BLOCK,
  ENTITY_ID_CLICKABLE,
  ENTITY_ID_SECONDARY,
} from '@/utils/constants';
import type { OrderTest } from '@/types';

export function renderDisplayId(
  id: string | number,
  formatter: (id: number | null | undefined) => string,
  className = ENTITY_ID_BLOCK
): ReactNode {
  const numericId = typeof id === 'string' ? Number(id) : id;
  return <span className={`${className} font-normal`}>{formatter(numericId)}</span>;
}

export function renderPatientId(patientId: string | number): ReactNode {
  return renderDisplayId(patientId, displayId.patient);
}

export function renderOrderId(orderId: string | number, clickable = false): ReactNode {
  return renderDisplayId(
    orderId,
    displayId.order,
    clickable ? ENTITY_ID_CLICKABLE : ENTITY_ID_BLOCK
  );
}

export function renderPatientNameBlock(fullName: string, secondary?: ReactNode): ReactNode {
  return (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal capitalize">{fullName}</div>
      {secondary}
    </div>
  );
}

export function renderPatientNameWithAge(fullName: string, dateOfBirth: string): ReactNode {
  return renderPatientNameBlock(
    fullName,
    <div className="text-xs text-text-tertiary truncate font-normal">
      {calculateAge(dateOfBirth)} years old
    </div>
  );
}

export function renderPatientNameWithId(fullName: string, patientId: string | number): ReactNode {
  const numericId = typeof patientId === 'string' ? Number(patientId) : patientId;
  return renderPatientNameBlock(
    fullName,
    <div className={`${ENTITY_ID_SECONDARY} truncate font-normal`}>{displayId.patient(numericId)}</div>
  );
}

export function renderOrderPatientName(
  patientName: string,
  patientId: string | number
): ReactNode {
  return renderPatientNameWithId(patientName, patientId);
}

export function renderOrderTestsBlock(
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[]
): ReactNode {
  const activeCount = activeTests.length;
  return (
    <div className="min-w-0 font-normal">
      <div className="truncate entity-id font-normal">
        {activeTests.map(t => t.testCode ?? t.testName).join('/')}
      </div>
      <div className="text-xs text-text-tertiary truncate font-normal">
        {activeCount} test{activeCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export function renderOrderTotalPrice(totalPrice: number): ReactNode {
  return (
    <div className={`${DATA_AMOUNT} truncate font-normal`}>{formatCurrency(totalPrice)}</div>
  );
}

export function renderOrderTotalPriceInline(totalPrice: number): ReactNode {
  return (
    <span className={`${DATA_AMOUNT} truncate block font-normal`}>
      {formatCurrency(totalPrice)}
    </span>
  );
}

export function renderContactBlock(phone: string, email?: string): ReactNode {
  return (
    <div className="text-xs min-w-0 font-normal">
      <div className="text-xs text-text-primary truncate font-normal">
        {formatPhoneNumber(phone)}
      </div>
      {email ? (
        <div className="text-xs text-text-tertiary truncate font-normal">{email}</div>
      ) : null}
    </div>
  );
}

export function renderDateCell(
  date: string | Date | null | undefined,
  emptyLabel = '—'
): ReactNode {
  if (!date) {
    return <span className="text-xs text-text-tertiary font-normal">{emptyLabel}</span>;
  }
  return <span className="text-xs text-text-primary font-normal">{formatDate(date)}</span>;
}

export function renderOrderDateCell(date: string | Date | null | undefined): ReactNode {
  if (!date) {
    return null;
  }
  return (
    <span className="text-xs text-text-tertiary truncate block font-normal">
      {formatDate(date)}
    </span>
  );
}

export function renderNavigableOrderId(
  orderId: string | number,
  navigate: NavigateFunction
): ReactNode {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        navigate(`/orders/${orderId}`);
      }}
      className={`${ENTITY_ID_CLICKABLE} font-normal`}
    >
      {displayId.order(typeof orderId === 'string' ? Number(orderId) : orderId)}
    </button>
  );
}
