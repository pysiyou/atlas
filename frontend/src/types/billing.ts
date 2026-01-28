/**
 * Billing and Financial Management Types
 */

import { ICONS } from '@/utils';

export type PaymentMethod =
  | 'cash'
  | 'credit-card'
  | 'debit-card'
  | 'insurance'
  | 'bank-transfer'
  | 'mobile-money';

/**
 * Payment method option configuration for UI components
 * Single source of truth for all payment method selections
 */
export interface PaymentMethodOption {
  /** Payment method value */
  value: PaymentMethod;
  /** Display label */
  label: string;
  /** Icon name for visual representation */
  icon: string;
  /** Whether this method is currently enabled */
  enabled: boolean;
}

/**
 * All available payment methods with their configuration
 * Single source of truth - update this array to change payment options across the app
 *
 * To enable/disable a payment method, change the `enabled` flag.
 */
export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'cash', label: 'Cash', icon: ICONS.dataFields.cash, enabled: true },
  { value: 'mobile-money', label: 'Mobile Money', icon: ICONS.ui.smartphone, enabled: true },
  { value: 'credit-card', label: 'Credit Card', icon: ICONS.dataFields.creditCard, enabled: false },
  { value: 'debit-card', label: 'Debit Card', icon: ICONS.dataFields.creditCard, enabled: false },
  { value: 'insurance', label: 'Insurance', icon: ICONS.ui.shield, enabled: false },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: ICONS.dataFields.wallet, enabled: false },
];

/**
 * Returns only the enabled payment methods for use in UI selection
 */
export const getEnabledPaymentMethods = (): PaymentMethodOption[] => {
  return PAYMENT_METHOD_OPTIONS.filter(method => method.enabled);
};

/**
 * Default payment method (first enabled method)
 */
export const getDefaultPaymentMethod = (): PaymentMethod => {
  const enabledMethods = getEnabledPaymentMethods();
  return enabledMethods.length > 0 ? enabledMethods[0].value : 'cash';
};

export type ClaimStatus = 'submitted' | 'processing' | 'approved' | 'denied' | 'paid';

export interface InvoiceItem {
  testCode: string;
  testName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  invoiceId: number; // Integer ID, displayed as INV{id}
  orderId: number;
  patientId: number;
  patientName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number; // percentage or fixed amount
  tax: number;
  total: number;
  paymentStatus: 'unpaid' | 'paid';
  amountPaid: number;
  amountDue: number;
  createdAt: string;
  dueDate?: string;
}

export interface Payment {
  paymentId: number; // Integer ID, displayed as PAY{id}
  orderId: number;
  invoiceId: number | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  receivedBy: number;
  receiptGenerated: boolean;
  notes?: string;
  // Computed fields from relationships
  orderTotalPrice?: number;
  numberOfTests?: number;
  patientName?: string;
}

export interface InsuranceClaim {
  claimId: number; // Integer ID, displayed as CLM{id}
  orderId: number;
  invoiceId: number;
  patientId: number;
  insuranceProvider: string;
  insuranceNumber: string;
  claimAmount: number;
  approvedAmount?: number;
  claimStatus: ClaimStatus;
  submittedDate: string;
  processedDate?: string;
  denialReason?: string;
  notes?: string;
}
