/**
 * PaymentSection
 *
 * Payment method selection for order creation (create mode only).
 * Uses shared PaymentMethodSelector so selection reflects consistently across both options.
 */

import React from 'react';
import { Alert, PaymentMethodSelector } from '@/shared/ui';
import type { PaymentMethodOption, PaymentMethod } from '@/types/billing';

export interface PaymentSectionProps {
  paymentMethods: PaymentMethodOption[];
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  paymentError?: string | null;
  disabled?: boolean;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentMethods,
  paymentMethod,
  onPaymentMethodChange,
  paymentError,
  disabled = false,
}) => (
  <div className="space-y-3">
    <div className="text-xs font-medium text-fg-subtle">Payment method</div>
    <PaymentMethodSelector
      methods={paymentMethods}
      value={paymentMethod}
      onChange={onPaymentMethodChange}
      disabled={disabled}
    />
    {paymentError && (
      <Alert variant="danger" className="py-3">
        <p className="text-sm">{paymentError}</p>
      </Alert>
    )}
  </div>
);
