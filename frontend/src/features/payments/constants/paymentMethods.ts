import { parseIconKey, type IconKey } from '@/icons';
import {
  PAYMENT_METHOD_CONFIG,
  PAYMENT_METHOD_VALUES,
  type PaymentMethod,
} from '@/types/generated/enums';

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  iconKey: IconKey;
  enabled: boolean;
}

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = PAYMENT_METHOD_VALUES.map(value => {
  const cfg = PAYMENT_METHOD_CONFIG[value];
  return {
    value,
    label: cfg.label,
    iconKey: parseIconKey(cfg.iconKey),
    enabled: cfg.enabled,
  };
});

export const getEnabledPaymentMethods = (): PaymentMethodOption[] => {
  return PAYMENT_METHOD_OPTIONS.filter(method => method.enabled);
};

export const getDefaultPaymentMethod = (): PaymentMethod => {
  const enabledMethods = getEnabledPaymentMethods();
  return enabledMethods.length > 0 ? enabledMethods[0].value : 'cash';
};

export const PAYMENT_METHOD_FILTER_CONFIG: Record<PaymentMethod, { label: string }> =
  Object.fromEntries(
    PAYMENT_METHOD_OPTIONS.map(method => [method.value, { label: method.label }])
  ) as Record<PaymentMethod, { label: string }>;