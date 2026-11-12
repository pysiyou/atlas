/**
 * Order receipt total row plus optional paid / remaining breakdown.
 */
import React from 'react';
import { cn, formatCurrency } from '@/utils';
import { DOCUMENT_TYPE, text } from '@/theme/recipes';
import type { OrderReceiptVariant } from './OrderReceipt';

export function ReceiptTotal({
  total,
  variant,
  pad,
  amountPaid,
  remainingAmount,
}: {
  total: number;
  variant: OrderReceiptVariant;
  pad: string;
  amountPaid?: number;
  remainingAmount?: number;
}) {
  const isDetailed = variant === 'detailed';
  const isCompact = variant === 'compact';
  const showPaid = amountPaid != null && amountPaid > 0;
  const showRemaining =
    remainingAmount != null && remainingAmount > 0 && remainingAmount < total;

  return (
    <>
      <div className="border-t border-dashed border-border-strong shrink-0" />
      <div
        className={cn(
          pad,
          isDetailed || !isCompact ? 'py-space-4' : 'py-space-2-5',
          'shrink-0 space-y-space-1',
          isDetailed && 'bg-surface-page',
        )}
      >
        <div className="flex justify-between items-center">
          <span className={isDetailed ? DOCUMENT_TYPE.totalLabelDetailed : DOCUMENT_TYPE.totalLabelCompact}>
            Total
          </span>
          <span
            className={cn(
              'font-normal tabular-nums',
              isDetailed ? DOCUMENT_TYPE.totalValueDetailed : DOCUMENT_TYPE.totalValueCompact,
            )}
          >
            {formatCurrency(total)}
          </span>
        </div>
        {showPaid ? (
          <div className={cn('flex justify-between items-center', text({ role: 'body', intent: 'muted' }))}>
            <span>Paid</span>
            <span className="font-normal tabular-nums">{formatCurrency(amountPaid)}</span>
          </div>
        ) : null}
        {showRemaining ? (
          <div className={cn('flex justify-between items-center', text({ role: 'body', intent: 'muted' }))}>
            <span>Remaining</span>
            <span className="font-normal tabular-nums">{formatCurrency(remainingAmount)}</span>
          </div>
        ) : null}
      </div>
    </>
  );
}
