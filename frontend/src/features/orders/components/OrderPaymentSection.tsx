import type { PaymentMethod } from '@/types';
import { Alert } from '@/components/display';
import { PaymentMethodSelector } from '@/features/payments';
import { getEnabledPaymentMethods } from '@/features/payments/constants/paymentMethods';
import { FORM_FIELD_LABEL, text } from '@/theme/recipes';
import { useMemo } from 'react';

export interface OrderPaymentSectionProps {
  mode: 'create' | 'edit';
  paymentMethod?: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  isSubmitting: boolean;
  isProcessingPayment: boolean;
  paymentError: string | null;
  onClearError: () => void;
}

export function OrderPaymentSection({
  mode,
  paymentMethod,
  onPaymentMethodChange,
  isSubmitting,
  isProcessingPayment,
  paymentError,
  onClearError,
}: OrderPaymentSectionProps) {
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
          <p className={text({ role: 'amount' })}>{paymentError}</p>
        </Alert>
      )}
    </div>
  );
}
