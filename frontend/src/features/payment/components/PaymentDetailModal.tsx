/**
 * PaymentDetailModal Component
 *
 * Modal that displays complete order payment information in a receipt-style layout.
 * Similar to PaymentPopover but larger - displays as a receipt with:
 * - Order details (ID, date, patient) in receipt header
 * - List of ordered tests with prices
 * - Total amount
 * - Payment method selection (if not paid)
 * - Notes field (if not paid)
 * - Cancel and Pay buttons in footer
 *
 * Payment methods are sourced from the centralized PAYMENT_METHOD_OPTIONS in types/billing.
 */
import React, { useState, useCallback } from 'react';
import { Modal, Icon, Badge, Button, Alert, CalloutCard, FooterInfo, PaymentMethodSelector } from '@/shared/ui';
import { PaymentErrorBoundary } from '@/shared/components';
import { cn, formatDate, formatCurrency, displayId } from '@/utils';
import { getActiveTests, getActiveTotal } from '@/utils/orderUtils';
import { inputBase } from '@/shared/ui/inputStyles';
import { useCreatePayment } from '@/hooks/queries/usePayments';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod,
} from '@/types/billing';
import { getPaymentErrorMessage } from '@/utils/errorHelpers';
import type { OrderPaymentView } from '../types';
import type { Order } from '@/types';
import { ICONS } from '@/utils';

interface PaymentDetailModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Order payment view to display and process payment for */
  order: OrderPaymentView | null;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
}

/** Get enabled payment methods from the single source of truth */
const PAYMENT_METHODS = getEnabledPaymentMethods();

/**
 * PaymentReceipt - Large receipt-style order summary with item list
 *
 * Renders order ID, patient, date, line items (tests with prices), and total
 * in a thermal-receipt inspired layout. Larger version for modal display.
 * Excludes superseded and removed tests; only active tests are shown and
 * included in the total.
 */
const PaymentReceipt: React.FC<{ sourceOrder: Order; paymentDate?: string; paymentMethod?: string }> = ({ sourceOrder, paymentDate, paymentMethod }) => {
  const activeTests = getActiveTests(sourceOrder.tests ?? []);
  const activeTotal = getActiveTotal(sourceOrder.tests ?? []);

  return (
    <div className="rounded-lg border border-border-default overflow-hidden bg-surface">
      {/* Receipt Header */}
      <div className="px-6 py-4 border-b border-dashed border-border-strong bg-surface-page">
        <div className="flex justify-between items-center mb-2">
          {sourceOrder.patientName ? (
            <p className="text-sm font-normal text-text-secondary">{sourceOrder.patientName}</p>
          ) : (
            <p className="text-sm text-text-tertiary italic">No patient name</p>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={sourceOrder.paymentStatus} size="sm" />
            {paymentMethod && (
              <Badge variant={paymentMethod} size="sm" />
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center text-xs">
            <span className="text-text-tertiary w-28">Order Number:</span>
            <span className="text-brand font-normal font-mono">{displayId.order(sourceOrder.orderId)}</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="text-text-tertiary w-28">Patient Number:</span>
            <span className="text-brand font-normal font-mono">{displayId.patient(sourceOrder.patientId)}</span>
          </div>
          <div className="flex items-center text-xs">
            <span className="text-text-tertiary w-28">Order Date:</span>
            <span className="text-text-secondary font-normal">{formatDate(sourceOrder.orderDate)}</span>
          </div>
          {paymentDate && (
            <div className="flex items-center text-xs">
              <span className="text-text-tertiary w-28">Payment Date:</span>
              <span className="text-text-secondary font-normal">{formatDate(paymentDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Items List (active tests only) */}
      <div className="px-6 py-4 max-h-96 overflow-y-auto">
        {activeTests.length > 0 ? (
          <ul className="space-y-2.5">
            {activeTests.map((test, idx) => (
              <li
                key={test.testCode ? `${test.testCode}-${idx}` : `item-${idx}`}
                className="flex justify-between gap-3 text-sm items-start"
              >
                <span className="flex items-start gap-2.5 min-w-0 flex-1">
                  <span className="w-1 h-1 rounded-full bg-neutral-400 shrink-0 mt-1.5" />
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="text-text-secondary truncate">
                      {test.testName || test.testCode || 'Test'}
                    </span>
                    {test.testCode && test.testName !== test.testCode && (
                      <span className="text-xs text-brand font-mono mt-0.5">{test.testCode}</span>
                    )}
                  </span>
                </span>
                <span className="font-normal text-text-primary tabular-nums shrink-0">
                  {formatCurrency(test.priceAtOrder)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-text-tertiary italic">No items</p>
        )}
      </div>

      {/* Receipt Footer with Total (sum of active tests only) */}
      <div className="border-t border-dashed border-border-strong" />
      <div className="px-6 py-4 flex justify-between items-center bg-surface-page">
        <span className="text-sm font-normal text-text-secondary uppercase tracking-wider">
          Total
        </span>
        <span className="text-lg font-normal text-text-primary tabular-nums">
          {formatCurrency(activeTotal)}
        </span>
      </div>
    </div>
  );
};

/**
 * PaymentDetailModal - Full payment details with inline payment processing
 *
 * Shows complete order information with test list in receipt format and allows payment
 * method selection directly in the modal. Larger version of the payment popover.
 */
// Large component is necessary for comprehensive payment detail modal with order info, test list, payment method selection, and processing
// eslint-disable-next-line max-lines-per-function
export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  order: view,
  onPaymentSuccess,
}) => {
  // Use mutation hook for payment creation
  const { mutate: createPaymentMutation, isPending: submitting } = useCreatePayment();

  // Form state - use default payment method from centralized config
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const sourceOrder = view?.order;

  // Reset form state when modal opens or order changes
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod(getDefaultPaymentMethod());
      setNotes('');
      setError(null);
    }
  }, [isOpen, sourceOrder?.orderId]);

  // Check if order is already paid
  const isPaid = sourceOrder?.paymentStatus === 'paid';

  /**
   * Handles payment submission
   */
  const handlePayment = useCallback(() => {
    if (!sourceOrder || isPaid) return;

    setError(null);

    // Validate amount
    if (sourceOrder.totalPrice <= 0) {
      setError('Invalid order amount');
      return;
    }

    // Build payment request - schema validates and transforms orderId
    const paymentData = {
      orderId: sourceOrder.orderId,
      amount: sourceOrder.totalPrice,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    // Use mutation hook which handles cache invalidation automatically
    createPaymentMutation(paymentData, {
      onSuccess: () => {
        onPaymentSuccess?.();
        onClose();
      },
      onError: (err: unknown) => {
        setError(getPaymentErrorMessage(err, 'Failed to process payment'));
      },
    });
  }, [sourceOrder, isPaid, paymentMethod, notes, createPaymentMutation, onPaymentSuccess, onClose]);

  // Don't render if no order
  if (!view || !sourceOrder) return null;

  return (
    <PaymentErrorBoundary>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Process Payment"
        subtitle={<span>Order <span className="font-mono text-brand">{displayId.order(sourceOrder.orderId)}</span></span>}
        size="xl"
        disableClose={submitting}
        closeOnBackdropClick={!submitting}
      >
        <div className="flex flex-col h-full bg-surface-page">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Receipt-style Order Summary */}
            <PaymentReceipt sourceOrder={sourceOrder} paymentDate={view.paymentDate} paymentMethod={view.paymentMethod} />

            {/* Payment Method Selection - Only show if not paid */}
            {!isPaid && (
              <div>
                <label className="block text-sm font-normal text-text-secondary mb-3">
                  Payment Method <span className="text-danger-fg">*</span>
                </label>
                <PaymentMethodSelector
                  methods={PAYMENT_METHODS}
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  disabled={submitting}
                />
              </div>
            )}

            {/* Notes - Only show if not paid */}
            {!isPaid && (
              <div>
                <label className="block text-sm font-normal text-text-secondary mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Add optional notes..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={submitting}
                  className={cn(inputBase, 'resize-none disabled:opacity-50 disabled:bg-surface-page')}
                />
              </div>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="danger" className="py-3">
                <p className="text-sm">{error}</p>
              </Alert>
            )}

            {/* Paid Success Message */}
            {isPaid && (
              <CalloutCard variant="success" title="Payment Complete" className="p-4">
                This order has been fully paid.
              </CalloutCard>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border-default bg-surface shrink-0">
            <FooterInfo icon={ICONS.dataFields.wallet} text={isPaid ? 'Payment complete' : 'Processing payment'} />
            <div className="flex items-center gap-3">
            <Button
              variant={isPaid ? 'close' : 'cancel'}
              size="md"
              showIcon={true}
              onClick={onClose}
              disabled={submitting}
            >
              {isPaid ? 'Close' : 'Cancel'}
            </Button>

            {!isPaid && (
              <Button
                variant="primary"
                size="md"
                onClick={handlePayment}
                disabled={submitting}
                isLoading={submitting}
                icon={!submitting ? <Icon name={ICONS.dataFields.wallet} /> : undefined}
              >
                {submitting ? 'Processing...' : `Pay ${formatCurrency(sourceOrder.totalPrice)}`}
              </Button>
            )}
            </div>
          </div>
        </div>
      </Modal>
    </PaymentErrorBoundary>
  );
};
