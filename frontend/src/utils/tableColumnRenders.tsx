/**
 * Shared table column render helpers for entity table configs.
 */

import type { MouseEvent, ReactNode } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { EntityId } from '@/components/display/EntityId';
import { formatDate, formatDateTime, formatPhoneNumber, calculateAge, formatCurrency } from '@/utils';
import { DATA_AMOUNT } from '@/utils/constants';
import type { OrderTest } from '@/types';
import { TYPE } from '@/components/theme/recipes';

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
    <div className={`${TYPE.meta} truncate font-normal`}>
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

export interface RenderOrderTestsBlockOptions {
  fallbackCount?: number;
  testCodes?: string[];
  getTestName?: (testCode: string) => string;
}

export function renderOrderTestsBlock(
  activeTests: Pick<OrderTest, 'testCode' | 'testName'>[],
  options?: RenderOrderTestsBlockOptions | number
): ReactNode {
  const resolved: RenderOrderTestsBlockOptions =
    typeof options === 'number' ? { fallbackCount: options } : (options ?? {});
  const { fallbackCount, testCodes, getTestName } = resolved;

  const activeCount =
    fallbackCount ??
    (activeTests.length > 0 ? activeTests.length : (testCodes?.length ?? 0));

  const labels =
    activeTests.length > 0
      ? activeTests.map(t => t.testName || t.testCode)
      : (testCodes ?? []).map(code => getTestName?.(code) || code);

  const firstName = labels[0];
  const secondary =
    firstName && labels.length > 1
      ? `${firstName}, +${labels.length - 1}`
      : firstName ?? '';

  return (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal">
        {activeCount} test{activeCount !== 1 ? 's' : ''}
      </div>
      {secondary ? (
        <div className={`${TYPE.meta} truncate font-normal`}>{secondary}</div>
      ) : null}
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

export function renderOrderDateCell(date: string | Date | null | undefined): ReactNode {
  if (!date) {
    return null;
  }
  return (
    <span className={`${TYPE.meta} truncate block font-normal`}>
      {formatDateTime(date)}
    </span>
  );
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
