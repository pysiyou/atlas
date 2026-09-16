/**
 * OrderReceipt — shared dashed receipt for billing panel, payment popover, and payment modal.
 */

import React from 'react';
import { Badge, EntityId } from '@/components';
import { cn, formatCurrency, formatDateTime } from '@/utils';
import { getActiveTests, getActiveTotal } from '../utils/orderCalculator';
import type { Order, OrderTest } from '@/types';

export type OrderReceiptVariant = 'panel' | 'compact' | 'detailed';

export interface OrderReceiptProps {
  order: Order;
  variant?: OrderReceiptVariant;
  paymentDate?: string;
  paymentMethod?: string;
}

function receiptShellClass(variant: OrderReceiptVariant): string {
  if (variant === 'compact') return 'rounded border border-border-default';
  if (variant === 'detailed') return 'rounded-lg border border-border-default bg-surface';
  return 'rounded flex-1';
}

function ReceiptHeader({
  order,
  variant,
  paymentDate,
  paymentMethod,
  pad,
}: {
  order: Order;
  variant: OrderReceiptVariant;
  paymentDate?: string;
  paymentMethod?: string;
  pad: string;
}) {
  const isDetailed = variant === 'detailed';

  return (
    <div
      className={cn(
        pad,
        isDetailed ? 'py-4' : 'py-2.5',
        'border-b border-dashed border-border-strong',
        isDetailed && 'bg-surface-page',
      )}
    >
      {isDetailed ? (
        <>
          <div className="flex justify-between items-center mb-2">
            {order.patientName ? (
              <p className="text-sm font-normal text-text-secondary">{order.patientName}</p>
            ) : (
              <p className="text-sm text-text-tertiary italic">No patient name</p>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={order.paymentStatus} size="sm" />
              {paymentMethod && <Badge variant={paymentMethod} size="sm" />}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center text-xs">
              <span className="text-text-tertiary w-28">Order Number:</span>
              <EntityId type="order" value={order.orderId} />
            </div>
            <div className="flex items-center text-xs">
              <span className="text-text-tertiary w-28">Patient Number:</span>
              <EntityId type="patient" value={order.patientId} />
            </div>
            <div className="flex items-center text-xs">
              <span className="text-text-tertiary w-28">Order Date:</span>
              <span className="text-text-secondary font-normal">
                {formatDateTime(order.orderDate)}
              </span>
            </div>
            {paymentDate && (
              <div className="flex items-center text-xs">
                <span className="text-text-tertiary w-28">Payment Date:</span>
                <span className="text-text-secondary font-normal">
                  {formatDateTime(paymentDate)}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-xs font-normal text-text-secondary uppercase tracking-wider">
              Order <EntityId type="order" value={order.orderId} />
            </span>
            <Badge variant={order.paymentStatus} size="xs" />
          </div>
          {order.patientName && (
            <p className="text-[11px] text-text-tertiary mt-0.5 truncate">{order.patientName}</p>
          )}
        </>
      )}
    </div>
  );
}

function ReceiptItemRow({ test, detailed }: { test: OrderTest; detailed: boolean }) {
  const code =
    test.testCode && test.testName !== test.testCode ? (
      <EntityId variant="inline" className={detailed ? 'mt-0.5' : 'ml-1'}>
        {detailed ? test.testCode : `(${test.testCode})`}
      </EntityId>
    ) : null;

  return (
    <li
      className={cn(
        'flex justify-between items-center gap-2',
        detailed ? 'text-sm items-start gap-3' : 'text-xs',
      )}
    >
      <span className={cn('flex min-w-0 flex-1 gap-2', detailed ? 'items-start gap-2.5' : 'items-center')}>
        <span className={cn('w-1 h-1 rounded-full bg-neutral-400 shrink-0', detailed && 'mt-1.5')} />
        {detailed ? (
          <span className="flex flex-col min-w-0 flex-1">
            <span className="text-text-secondary truncate">{test.testName || test.testCode || 'Test'}</span>
            {code}
          </span>
        ) : (
          <span className="text-text-secondary truncate">
            {test.testName || test.testCode || 'Test'}
            {code}
          </span>
        )}
      </span>
      <span className="font-normal text-text-primary tabular-nums shrink-0">
        {formatCurrency(test.priceAtOrder)}
      </span>
    </li>
  );
}

function ReceiptItems({
  tests,
  variant,
  pad,
}: {
  tests: OrderTest[];
  variant: OrderReceiptVariant;
  pad: string;
}) {
  const isDetailed = variant === 'detailed';
  const isCompact = variant === 'compact';
  const listMax = isCompact
    ? 'max-h-32 overflow-y-auto'
    : isDetailed
      ? 'max-h-96 overflow-y-auto'
      : 'flex-1 min-h-0 overflow-y-auto';

  return (
    <div className={cn(pad, isDetailed ? 'py-4' : 'py-2', listMax)}>
      {tests.length > 0 ? (
        <ul className={isDetailed ? 'space-y-2.5' : 'space-y-1.5'}>
          {tests.map((test, idx) => (
            <ReceiptItemRow
              key={test.testCode ? `${test.testCode}-${idx}` : `item-${idx}`}
              test={test}
              detailed={isDetailed}
            />
          ))}
        </ul>
      ) : (
        <p className={cn('text-text-tertiary italic', isDetailed ? 'text-sm' : 'text-xs')}>No items</p>
      )}
    </div>
  );
}

function ReceiptTotal({
  total,
  variant,
  pad,
}: {
  total: number;
  variant: OrderReceiptVariant;
  pad: string;
}) {
  const isDetailed = variant === 'detailed';
  const isCompact = variant === 'compact';

  return (
    <>
      <div className="border-t border-dashed border-border-strong shrink-0" />
      <div
        className={cn(
          pad,
          isDetailed || !isCompact ? 'py-4' : 'py-2.5',
          'flex justify-between items-center shrink-0',
          isDetailed && 'bg-surface-page',
        )}
      >
        <span
          className={cn(
            'font-normal text-text-secondary uppercase tracking-wider',
            isDetailed ? 'text-sm' : 'text-xs',
          )}
        >
          Total
        </span>
        <span
          className={cn(
            'font-normal tabular-nums',
            isDetailed ? 'text-lg text-text-primary' : 'text-sm text-brand',
          )}
        >
          {formatCurrency(total)}
        </span>
      </div>
    </>
  );
}

export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  order,
  variant = 'panel',
  paymentDate,
  paymentMethod,
}) => {
  const activeTests = getActiveTests(order.tests ?? []);
  const activeTotal = getActiveTotal(order.tests ?? []);
  const pad = variant === 'detailed' ? 'px-6' : variant === 'compact' ? 'px-3' : 'px-4';

  return (
    <div className={cn('overflow-hidden flex flex-col min-h-0', receiptShellClass(variant))}>
      <ReceiptHeader
        order={order}
        variant={variant}
        paymentDate={paymentDate}
        paymentMethod={paymentMethod}
        pad={pad}
      />
      <ReceiptItems tests={activeTests} variant={variant} pad={pad} />
      <ReceiptTotal total={activeTotal} variant={variant} pad={pad} />
    </div>
  );
};
