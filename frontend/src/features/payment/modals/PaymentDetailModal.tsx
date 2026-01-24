/**
 * PaymentDetailModal Component
 *
 * Modal that displays complete order payment information including:
 * - Order details (ID, date, patient)
 * - List of ordered tests with prices
 * - Payment status and total amount
 * - Payment method selection (directly inside modal)
 * - Cancel and Pay buttons in footer
 *
 * Uses the shared Modal and SectionContainer components for consistency.
 * Payment methods are sourced from the centralized PAYMENT_METHOD_OPTIONS in types/billing.
 */
import React, { useState, useCallback } from 'react';
import { Modal, SectionContainer, Icon, Badge, Button, Alert } from '@/shared/ui';
import { PaymentErrorBoundary } from '@/shared/components';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils/id-display';
import { useCreatePayment } from '@/hooks/queries/usePayments';
import {
  getEnabledPaymentMethods,
  getDefaultPaymentMethod,
  type PaymentMethod,
} from '@/types/billing';
import type { IconName } from '@/shared/ui/Icon';
import type { OrderPaymentDetails } from '../types/types';

interface PaymentDetailModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Order payment details to display and process payment for */
  order: OrderPaymentDetails | null;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
}

/** Get enabled payment methods from the single source of truth */
const PAYMENT_METHODS = getEnabledPaymentMethods();

/**
 * PaymentDetailModal - Full payment details with inline payment processing
 *
 * Shows complete order information with test list and allows payment
 * method selection directly in the modal without popover.
 */
// Large component is necessary for comprehensive payment detail modal with order info, test list, payment method selection, and processing
// eslint-disable-next-line max-lines-per-function
export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  order,
  onPaymentSuccess,
}) => {
  // Use mutation hook for payment creation
  const { mutate: createPaymentMutation, isPending: submitting } = useCreatePayment();

  // Form state - use default payment method from centralized config
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(getDefaultPaymentMethod());
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Use mutation hook for payment creation
  const { mutate: createPaymentMutation, isPending: submitting } = useCreatePayment();

  // Reset form state when modal opens or order changes
  // This is a common pattern for resetting form state when a modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPaymentMethod(getDefaultPaymentMethod());
      setNotes('');
      setError(null);
    }
  }, [isOpen, order?.orderId]);

  // Check if order is already paid
  const isPaid = order?.paymentStatus === 'paid';

  /**
   * Handles payment submission
   */
  const handlePayment = useCallback(() => {
    if (!order || isPaid) return;

    setError(null);

    // Validate amount
    if (order.totalPrice <= 0) {
      setError('Invalid order amount');
      return;
    }

    // Build payment request
    const paymentData = {
      orderId: order.orderId.toString(), // Convert to string as expected by hook
      amount: order.totalPrice,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    // Use mutation hook which handles cache invalidation automatically
    createPaymentMutation(paymentData, {
      onSuccess: () => {
        // Invoke success callback and close modal
        onPaymentSuccess?.();
        onClose();
      },
      onError: (err: unknown) => {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process payment';
        setError(errorMessage);
      },
    });
  }, [order, isPaid, paymentMethod, notes, createPaymentMutation, onPaymentSuccess, onClose]);

  // Don't render if no order
  if (!order) return null;

  return (
    <PaymentErrorBoundary>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Payment Details"
        subtitle={displayId.order(order.orderId)}
        size="xl"
        disableClose={submitting}
        closeOnBackdropClick={!submitting}
      >
      <div className="flex flex-col h-full bg-gray-50">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Order Information Section */}
          <SectionContainer title="Order Information">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Patient</span>
                <span className="text-sm text-gray-600">{order.patientName || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Patient ID</span>
                <span className="text-sm text-gray-600">{displayId.patient(order.patientId)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Order Date</span>
                <span className="text-sm text-gray-600">{formatDate(order.orderDate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Status</span>
                <Badge variant={order.overallStatus} size="sm" />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Priority</span>
                <Badge variant={order.priority} size="sm" />
              </div>
            </div>
          </SectionContainer>

          {/* Tests List Section */}
          <SectionContainer
            title={`Ordered Tests (${order.tests?.length || 0})`}
            contentClassName="p-0"
          >
            <div className="max-h-48 overflow-y-auto">
              {order.tests?.map((test, index) => (
                <div
                  key={test.id || `${test.testCode}-${index}`}
                  className="px-4 py-1.5 flex items-start gap-3 hover:bg-gray-50"
                >
                  {/* Item dot - aligned to first line */}
                  <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 truncate">
                      {test.testName}
                    </div>
                    <div className="text-xs text-gray-500">{test.testCode}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 text-right">
                    {formatCurrency(test.priceAtOrder)}
                  </div>
                </div>
              ))}
              {(!order.tests || order.tests.length === 0) && (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No tests in this order
                </div>
              )}
            </div>
          </SectionContainer>

          {/* Payment Summary Section */}
          <SectionContainer title="Payment Summary">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Payment Status</span>
                <Badge variant={order.paymentStatus} size="sm" />
              </div>
              {order.paymentDate && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Payment Date</span>
                  <span className="text-sm text-gray-600">{formatDate(order.paymentDate)}</span>
                </div>
              )}
              {order.paymentMethod && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Payment Method</span>
                  <Badge variant={order.paymentMethod} size="sm" />
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700">Total Amount</span>
                <span className="text-lg font-bold text-sky-600">
                  {formatCurrency(order.totalPrice)}
                </span>
              </div>
            </div>
          </SectionContainer>

          {/* Payment Method Selection - Only show if not paid */}
          {!isPaid && (
            <SectionContainer title="Select Payment Method">
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(method => {
                  const isSelected = paymentMethod === method.value;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      disabled={submitting}
                      className={`
                        relative flex items-center gap-3 p-4 rounded border transition-all duration-200
                        ${
                          isSelected
                            ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200'
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                        ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      onClick={() => setPaymentMethod(method.value)}
                    >
                      <div
                        className={`
                        w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                        ${isSelected ? 'border-sky-500' : 'border-gray-300'}
                      `}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-sky-500" />}
                      </div>
                      <span
                        className={`
                        flex-1 text-sm font-medium text-left
                        ${isSelected ? 'text-sky-900' : 'text-gray-700'}
                      `}
                      >
                        {method.label}
                      </span>
                      <Icon
                        name={method.icon as IconName}
                        className={`w-5 h-5 ${isSelected ? 'text-sky-600' : 'text-gray-400'}`}
                      />
                    </button>
                  );
                })}
              </div>
            </SectionContainer>
          )}

          {/* Notes - Only show if not paid */}
          {!isPaid && (
            <SectionContainer title="Notes (Optional)">
              <textarea
                rows={2}
                placeholder="Add optional payment notes..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                disabled={submitting}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none disabled:opacity-50 disabled:bg-gray-50"
              />
            </SectionContainer>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="danger" className="py-3">
              <p className="text-sm">{error}</p>
            </Alert>
          )}

          {/* Paid Success Message */}
          {isPaid && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <Icon name="check-circle" className="w-6 h-6 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Payment Complete</p>
                <p className="text-xs text-green-600 mt-0.5">This order has been fully paid.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white shrink-0">
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
              icon={!submitting ? <Icon name="wallet" /> : undefined}
            >
              {submitting ? 'Processing...' : `Pay ${formatCurrency(order.totalPrice)}`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
    </PaymentErrorBoundary>
  );
};
