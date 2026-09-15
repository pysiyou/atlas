/**
 * Reusable table column render helpers for *TableConfig files.
 */

import type { MouseEvent, ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { EntityId } from '@/components/display/EntityId';
import { formatDate, formatDateTime, formatPhoneNumber, calculateAge, formatCurrency } from '@/utils';
import { DATA_AMOUNT } from '@/utils/constants';
import type { OrderTest } from '@/types';

export function renderPatientId(patientId: string | number): ReactNode {
  return <EntityId type="patient" value={patientId} variant="block" />;
}

export function renderOrderId(orderId: string | number, clickable = false): ReactNode {
  return <EntityId type="order" value={orderId} variant={clickable ? 'clickable' : 'block'} />;
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
  return renderPatientNameBlock(
    fullName,
    <EntityId type="patient" value={patientId} variant="secondary" className="truncate" />
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
  const testList = activeTests.map(t => t.testCode ?? t.testName).join('/');

  return (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal">
        {activeCount} test{activeCount !== 1 ? 's' : ''}
      </div>
      {testList ? <EntityId variant="secondary" className="truncate">{testList}</EntityId> : null}
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
      {formatDateTime(date)}
    </span>
  );
}

export function renderDateTimeCell(
  date: string | Date | null | undefined,
  emptyLabel = '—'
): ReactNode {
  if (!date) {
    return <span className="text-xs text-text-tertiary font-normal">{emptyLabel}</span>;
  }
  return <span className="text-xs text-text-primary font-normal">{formatDateTime(date)}</span>;
}

export function renderNavigableOrderId(
  orderId: string | number,
  navigate: NavigateFunction
): ReactNode {
  return (
    <EntityId
      type="order"
      value={orderId}
      variant="clickable"
      as="button"
      onClick={(e: MouseEvent<HTMLElement>) => {
        e.stopPropagation();
        navigate(`/orders/${orderId}`);
      }}
    />
  );
}
