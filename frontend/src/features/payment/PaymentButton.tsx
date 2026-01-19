/**
 * PaymentButton Component
 * Reusable button for processing payments on orders
 */
import React from 'react';
import { Button } from '@/shared/ui';
import { PaymentPopover } from './PaymentPopover';
import type { Order } from '@/types';

interface PaymentButtonProps {
  order: Order;
  onPaymentSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  order,
  onPaymentSuccess,
  size = 'sm',
}) => {
  const isPaid = order.paymentStatus === 'paid';

  if (isPaid) {
    return (
      <Button
        size={size}
        variant="outline"
        disabled
        className="cursor-not-allowed opacity-50"
      >
        PAID
      </Button>
    );
  }

  return (
    <PaymentPopover
      order={order}
      onSuccess={onPaymentSuccess}
      size={size}
    />
  );
};
