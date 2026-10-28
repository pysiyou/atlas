/**
 * Billing and Financial Management Types
 */

import { ICONS } from '@/config/icons';
import {
  PAYMENT_METHOD_CONFIG,
  PAYMENT_METHOD_VALUES,
  type PaymentMethod,
} from '@/types/enums';

export type { PaymentMethod };

/**
 * Payment method option configuration for UI components
 */
export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
  icon: string;
  enabled: boolean;
}

/** Resolve icon key from PaymentMethod.members.*.iconKey in contracts/enums.json. */
function iconFromKey(iconKey: string): string {
  const [group, key] = iconKey.split('.');
  const section = ICONS[group as keyof typeof ICONS] as Record<string, string> | undefined;
  if (!section?.[key]) {
    throw new Error(`Unknown payment method iconKey: ${iconKey}`);
  }
  return section[key];
}

/** Payment methods for UI — labels/enabled from enum contract; icons resolved here. */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = PAYMENT_METHOD_VALUES.map(value => {
  const cfg = PAYMENT_METHOD_CONFIG[value];
  return {
    value,
    label: cfg.label,
    icon: iconFromKey(cfg.iconKey),
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

export interface InvoiceItem {
  testCode: string;
  testName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  invoiceId: number;
  orderId: number;
  patientId: number;
  patientName?: string;
  status: 'unpaid' | 'paid';
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  createdAt: string;
  dueDate?: string;
}

export interface Payment {
  paymentId: number;
  orderId: number;
  invoiceId: number | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  createdBy: string;
  receiptGenerated: boolean;
  notes?: string;
  orderTotalPrice?: number;
  numberOfTests?: number;
  patientName?: string;
}
