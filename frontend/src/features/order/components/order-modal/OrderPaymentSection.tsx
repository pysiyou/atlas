import React, { useMemo } from 'react';
import type { PaymentMethod } from '@/types';
import { getEnabledPaymentMethods } from '@/types/billing';
import { Icon, Alert } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { ICONS } from '@/utils';

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
  const paymentMethods = useMemo(() => getEnabledPaymentMethods(), []);

  // Only show in create mode
  if (mode !== 'create') return null;

  return (
    <div>
      <label className="block text-xs font-medium text-fg-subtle mb-2">
        Payment method
      </label>
      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map(method => {
          const isSelected = paymentMethod === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={isSubmitting || isProcessingPayment}
              onClick={() => {
                onPaymentMethodChange(method.value);
                if (paymentError) onClearError();
              }}
              className={`
                relative flex items-center gap-2.5 p-3 rounded border transition-all duration-200
                ${
                  isSelected
                    ? 'bg-panel border-brand border-2'
                    : 'bg-panel border-stroke hover:border-stroke-strong'
                }
                ${isSubmitting || isProcessingPayment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <Icon
                name={method.icon as IconName}
                className={`w-7 h-7 shrink-0 ${isSelected ? 'text-brand' : 'text-fg-disabled'}`}
              />
              <span
                className={`flex-1 text-xs font-medium text-left ${
                  isSelected ? 'text-fg' : 'text-fg-muted'
                }`}
              >
                {method.label}
              </span>
              <div
                className={`
                  absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-success' : 'bg-transparent border-2 border-stroke-strong'}
                `}
              >
                <Icon
                  name={ICONS.actions.check}
                  className={`w-3 h-3 ${isSelected ? 'text-on-brand' : 'text-fg-disabled'}`}
                />
              </div>
            </button>
          );
        })}
      </div>
      {paymentError && (
        <Alert variant="danger" className="mt-3 py-3">
          <p className="text-sm">{paymentError}</p>
        </Alert>
      )}
    </div>
  );
};
