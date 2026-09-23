import React, { useMemo } from 'react';
import type { PaymentMethod } from '@/types';
import { getEnabledPaymentMethods } from '@/types/payments';
import { Alert } from '@/components';
import { PaymentMethodSelector } from '@/features/payments';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';

export interface OrderPaymentSectionProps {
  mode: 'create' | 'edit';
  paymentMethod?: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  isSubmitting: boolean;
  isProcessingPayment: boolean;
  paymentError: string | null;
  onClearError: () => void;
}

export const OrderPaymentSection: React.FC<OrderPaymentSectionProps> = ({
  mode,
  paymentMethod,
  onPaymentMethodChange,
  isSubmitting,
  isProcessingPayment,
  paymentError,
  onClearError,
}) => {
  const methods = useMemo(() => getEnabledPaymentMethods(), []);

  if (mode !== 'create') return null;

  return (
    <div>
      <label className={`${FORM_FIELD_LABEL} mb-space-2`}>Payment method</label>
      <PaymentMethodSelector
        methods={methods}
        value={paymentMethod}
        onChange={v => {
          onPaymentMethodChange(v);
          if (paymentError) onClearError();
        }}
        disabled={isSubmitting || isProcessingPayment}
      />
      {paymentError && (
        <Alert variant="danger" className="mt-space-3 py-space-3">
          <p className="text-sm">{paymentError}</p>
        </Alert>
      )}
    </div>
  );
};
