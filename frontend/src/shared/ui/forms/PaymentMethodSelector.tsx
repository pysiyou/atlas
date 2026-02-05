/**
 * PaymentMethodSelector - Single source of truth for payment method selection UI.
 *
 * Renders a grid of options; exactly one can be selected. All elements stay static;
 * only the checkmark appears in the circle when selected.
 */

import React from 'react';
import { Icon } from '@/shared/ui/display/Icon';
import type { IconName } from '@/shared/ui/display/Icon';
import { ICONS } from '@/utils';
import type { PaymentMethodOption, PaymentMethod } from '@/types/billing';

export interface PaymentMethodSelectorProps {
  /** Available options (e.g. from getEnabledPaymentMethods()) */
  methods: PaymentMethodOption[];
  /** Current value */
  value: PaymentMethod | undefined;
  /** Called when user selects a method */
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  methods,
  value,
  onChange,
  disabled = false,
}) => (
  <div className="grid grid-cols-2 gap-2">
    {methods.map(method => {
      const isSelected = value === method.value;
      return (
        <button
          key={method.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(method.value)}
          className={`
            relative flex items-center gap-2.5 p-3 rounded border border-stroke bg-panel hover:border-stroke-strong transition-colors duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <Icon
            name={method.icon as IconName}
            className="w-7 h-7 shrink-0 text-fg-disabled"
          />
          <span className="flex-1 text-xs font-medium text-left text-fg-muted">
            {method.label}
          </span>
          <div
            className={`
              absolute top-1/2 -translate-y-1/2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200
              ${isSelected ? 'bg-brand' : 'bg-transparent border-2 border-stroke-strong'}
            `}
          >
            {isSelected && (
              <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
            )}
          </div>
        </button>
      );
    })}
  </div>
);
