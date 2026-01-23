/**
 * PaymentButton Component
 * Reusable button for processing payments on orders
 *
 * Shows a check-circle icon when paid, or a payment popover when unpaid.
 */
import React from 'react';
import { Icon } from '@/shared/ui';
import { PaymentPopover } from './PaymentPopover';
import type { Order } from '@/types';

interface PaymentButtonProps {
  /** Order to display payment action for */
  order: Order;
  /** Callback invoked on successful payment */
  onPaymentSuccess?: () => void;
  /** Button size for the payment popover trigger */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * PaymentButton - Displays payment action based on order status
 *
 * When paid: Shows a green check-circle icon
 * When unpaid/partial: Shows the PaymentPopover trigger button
 */
export const PaymentButton: React.FC<PaymentButtonProps> = ({
  order,
  onPaymentSuccess,
  size = 'sm',
}) => {
  const isPaid = order.paymentStatus === 'paid';

  // Show check-circle icon for paid orders
  if (isPaid) {
    return (
      <div className="flex items-center justify-start">
        <Icon name="check-circle" className="w-5 h-5 text-gray-300" />
      </div>
    );
  }

  // Show payment popover for unpaid orders
  return <PaymentPopover order={order} onSuccess={onPaymentSuccess} size={size} />;
};
