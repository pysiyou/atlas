/**
 * OrderReceipt — shared dashed receipt for billing panel, payment popover, and payment modal.
 */

import React from 'react';
import { RecordId } from '@/features/shared';
import { PaymentMethodBadge, PaymentStatusBadge } from '@/features/payments';
import { cn, displayId, formatCurrency, formatDateTime } from '@/utils';
import { getActiveTests, getActiveTotal } from '../utils/orderCalculator';
import type { Order, OrderTest } from '@/types';
import { RADIUS, DOCUMENT_TYPE, text } from '@/theme/recipes';

export type OrderReceiptVariant = 'panel' | 'compact' | 'detailed';

export interface OrderReceiptProps {
  order: Order;
  variant?: OrderReceiptVariant;
  paymentDate?: string;
  paymentMethod?: string;
  /** When false, total row is omitted (e.g. rendered in panel footer). Default true. */
  showTotal?: boolean;
  /** When false, payment status badge is hidden in the compact/panel header. Default true. */
  showPaymentStatusBadge?: boolean;
  /** Panel: grow item list with content instead of internal scroll (e.g. payment modal). */
  expandItems?: boolean;
}

function receiptShellClass(variant: OrderReceiptVariant): string {
  if (variant === 'compact') return `${RADIUS.field} border border-border-default`;
  if (variant === 'detailed') return `${RADIUS.menu} border border-border-default bg-surface`;
  return `${RADIUS.field} flex-1`;
}

function ReceiptHeader({
  order,
  variant,
  paymentDate,
  paymentMethod,
  pad,
  showPaymentStatusBadge,
}: {
  order: Order;
  variant: OrderReceiptVariant;
  paymentDate?: string;
  paymentMethod?: string;
  pad: string;
  showPaymentStatusBadge: boolean;
}) {
  const isDetailed = variant === 'detailed';

  return (
    <div
      className={cn(
        pad,
        isDetailed ? 'py-space-4' : 'py-space-2-5',
        'border-b border-dashed border-border-strong',
        isDetailed && 'bg-surface-page',
      )}
    >
      {isDetailed ? (
        <>
          <div className="flex justify-between items-center mb-space-2">
            {order.patientName ? (
              <p className={DOCUMENT_TYPE.detailedPatientName}>{order.patientName}</p>
            ) : (
              <p className={DOCUMENT_TYPE.detailedPatientMissing}>No patient name</p>
            )}
            <div className="flex items-center gap-space-2">
              <PaymentStatusBadge status={order.paymentStatus} size="xs" />
              {paymentMethod && <PaymentMethodBadge method={paymentMethod} size="xs" />}
            </div>
          </div>
          <div className="space-y-space-1-5">
            <div className={cn('flex items-center', DOCUMENT_TYPE.fieldRow)}>
              <span className={DOCUMENT_TYPE.fieldLabel}>Order Number:</span>
              <RecordId type="order" value={order.orderId} />
            </div>
            <div className={cn('flex items-center', DOCUMENT_TYPE.fieldRow)}>
              <span className={DOCUMENT_TYPE.fieldLabel}>Patient Number:</span>
              <RecordId type="patient" value={order.patientId} />
            </div>
            <div className={cn('flex items-center', DOCUMENT_TYPE.fieldRow)}>
              <span className={DOCUMENT_TYPE.fieldLabel}>Order Date:</span>
              <span className={DOCUMENT_TYPE.fieldValueMuted}>
                {formatDateTime(order.orderDate)}
              </span>
            </div>
            {paymentDate && (
              <div className={cn('flex items-center', DOCUMENT_TYPE.fieldRow)}>
                <span className={DOCUMENT_TYPE.fieldLabel}>Payment Date:</span>
                <span className={DOCUMENT_TYPE.fieldValueMuted}>
                  {formatDateTime(paymentDate)}
                </span>
              </div>
            )}
          </div>
        </>
      ) : variant === 'panel' ? (
        <div className="flex items-center justify-between gap-space-3">
          <div className="min-w-0 flex-1 space-y-space-0-5">
            {order.patientName ? (
              <p className={cn(DOCUMENT_TYPE.panelPatientName, 'truncate')}>{order.patientName}</p>
            ) : null}
            <div className={DOCUMENT_TYPE.metaRow}>
              <span className={cn(DOCUMENT_TYPE.metaPart, 'min-w-0 truncate')}>
                {displayId.order(order.orderId)}
              </span>
              {order.orderDate && (
                <>
                  <span className={DOCUMENT_TYPE.metaSeparator} aria-hidden>
                    •
                  </span>
                  <span className={cn(DOCUMENT_TYPE.metaPart, 'shrink-0 whitespace-nowrap')}>
                    {formatDateTime(order.orderDate)}
                  </span>
                </>
              )}
            </div>
          </div>
          {showPaymentStatusBadge && (
            <div className="flex items-center gap-space-1-5 shrink-0">
              <PaymentStatusBadge status={order.paymentStatus} size="xs" />
              {paymentMethod && order.paymentStatus !== 'unpaid' && (
                <PaymentMethodBadge method={paymentMethod} size="xs" />
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center gap-space-2">
            <RecordId
              type="order"
              value={order.orderId}
              emphasis="mutedBlock"
              className={DOCUMENT_TYPE.compactRecordId}
            />
            {showPaymentStatusBadge && (
              <PaymentStatusBadge status={order.paymentStatus} size="xs" className="shrink-0" />
            )}
          </div>
          {order.patientName && (
            <p className={`${text({ role: 'caption' })} mt-space-0-5 truncate`}>{order.patientName}</p>
          )}
        </>
      )}
    </div>
  );
}

function ReceiptItemRow({ test, detailed }: { test: OrderTest; detailed: boolean }) {
  const code =
    test.testCode && test.testName !== test.testCode ? (
      <RecordId emphasis="inline" className={detailed ? 'mt-space-0-5' : 'ml-space-1'}>
        {detailed ? test.testCode : `(${test.testCode})`}
      </RecordId>
    ) : null;

  return (
    <li className={detailed ? DOCUMENT_TYPE.rowListDetailed : DOCUMENT_TYPE.rowListCompact}>
      <span className={cn('flex min-w-0 flex-1 gap-space-2 items-start', detailed && 'gap-space-2-5')}>
        <span className={cn(`w-1 h-1 ${RADIUS.pill} bg-text-muted shrink-0 mt-space-1-5`)} />
        {detailed ? (
          <span className="flex flex-col min-w-0 flex-1">
            <span className={cn(text({ role: 'body' }), 'wrap-break-word font-normal')}>
              {test.testName || test.testCode || 'Test'}
            </span>
            {code}
          </span>
        ) : (
          <span className={cn(text({ role: 'body' }), 'min-w-0 flex-1 wrap-break-word font-normal')}>
            {test.testName || test.testCode || 'Test'}
            {code}
          </span>
        )}
      </span>
      <span className={`font-normal tabular-nums shrink-0 ${text({ role: 'body' })}`}>
        {formatCurrency(test.priceAtOrder)}
      </span>
    </li>
  );
}

function ReceiptItems({
  tests,
  variant,
  pad,
  expandItems,
}: {
  tests: OrderTest[];
  variant: OrderReceiptVariant;
  pad: string;
  expandItems?: boolean;
}) {
  const isDetailed = variant === 'detailed';
  const isCompact = variant === 'compact';
  const listMax = expandItems
    ? undefined
    : isCompact
      ? 'max-h-32 overflow-y-auto'
      : isDetailed
        ? 'max-h-96 overflow-y-auto'
        : 'flex-1 min-h-0 overflow-y-auto';

  return (
    <div className={cn(pad, isDetailed ? 'py-space-4' : 'py-space-2', listMax)}>
      {tests.length > 0 ? (
        <ul className={isDetailed ? 'space-y-space-2-5' : 'space-y-space-1-5'}>
          {tests.map((test, idx) => (
            <ReceiptItemRow
              key={test.testCode ? `${test.testCode}-${idx}` : `item-${idx}`}
              test={test}
              detailed={isDetailed}
            />
          ))}
        </ul>
      ) : (
        <p className={isDetailed ? DOCUMENT_TYPE.emptyDetailed : DOCUMENT_TYPE.emptyCompact}>
          No items
        </p>
      )}
    </div>
  );
}

export function ReceiptTotal({
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
          isDetailed || !isCompact ? 'py-space-4' : 'py-space-2-5',
          'flex justify-between items-center shrink-0',
          isDetailed && 'bg-surface-page',
        )}
      >
        <span className={isDetailed ? DOCUMENT_TYPE.totalLabelDetailed : DOCUMENT_TYPE.totalLabelCompact}>
          Total
        </span>
        <span className={cn('font-normal tabular-nums', isDetailed ? DOCUMENT_TYPE.totalValueDetailed : DOCUMENT_TYPE.totalValueCompact)}>
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
  showTotal = true,
  showPaymentStatusBadge = true,
  expandItems = false,
}) => {
  const activeTests = getActiveTests(order.tests ?? []);
  const activeTotal = getActiveTotal(order.tests ?? []);
  const pad = variant === 'detailed' ? 'px-table-cell-x-default' : variant === 'compact' ? 'px-space-3' : 'px-space-4';

  return (
    <div className={cn('overflow-hidden flex flex-col min-h-0', receiptShellClass(variant))}>
      <ReceiptHeader
        order={order}
        variant={variant}
        paymentDate={paymentDate}
        paymentMethod={paymentMethod}
        pad={pad}
        showPaymentStatusBadge={showPaymentStatusBadge}
      />
      <ReceiptItems tests={activeTests} variant={variant} pad={pad} expandItems={expandItems} />
      {showTotal && <ReceiptTotal total={activeTotal} variant={variant} pad={pad} />}
    </div>
  );
};
