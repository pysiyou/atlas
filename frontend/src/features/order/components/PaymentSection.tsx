/**
 * PaymentSection
 *
 * Payment method selection for order creation (create mode only).
 * Renders enabled payment methods as selectable cards with brand icons.
 */

import React from 'react';
import { Alert, Icon } from '@/shared/ui';
import type { PaymentMethodOption, PaymentMethod } from '@/types/billing';
import type { IconName } from '@/shared/ui';
import { ICONS } from '@/utils';

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
}) => {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-text-tertiary">Payment method</div>

      <div className="grid grid-cols-2 gap-2">
        {paymentMethods.map(method => {
          const isSelected = paymentMethod === method.value;
          return (
            <button
              key={method.value}
              type="button"
              disabled={disabled}
              className={`
                relative flex items-center gap-2.5 p-3 rounded border transition-all duration-200
                ${
                  isSelected
                    ? 'bg-surface-default border-action-primary border-2'
                    : 'bg-surface-default border-border-default hover:border-border-strong'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => onPaymentMethodChange(method.value)}
            >
              <Icon
                name={method.icon as IconName}
                className={`w-7 h-7 shrink-0 ${isSelected ? 'text-action-primary' : 'text-text-disabled'}`}
              />
              <span
                className={`flex-1 text-xs font-medium text-left ${
                  isSelected ? 'text-text-primary' : 'text-text-secondary'
                }`}
              >
                {method.label}
              </span>
              <div
                className={`
                  absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors
                  ${isSelected ? 'bg-action-success' : 'bg-transparent border-2 border-border-strong'}
                `}
              >
                <Icon
                  name={ICONS.actions.check}
                  className={`w-3 h-3 ${isSelected ? 'text-action-success-on' : 'text-text-disabled'}`}
                />
              </div>
            </button>
          );
        })}
      </div>

      {paymentError && (
        <Alert variant="danger" className="py-3">
          <p className="text-sm">{paymentError}</p>
        </Alert>
      )}
    </div>
  );
};
