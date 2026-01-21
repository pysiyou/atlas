/**
 * Billing and Financial Management Types
 */

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
  { value: 'cash', label: 'Cash', icon: 'cash', enabled: true },
  { value: 'mobile-money', label: 'Mobile Money', icon: 'smartphone', enabled: true },
  { value: 'credit-card', label: 'Credit Card', icon: 'credit-card', enabled: false },
  { value: 'debit-card', label: 'Debit Card', icon: 'credit-card', enabled: false },
  { value: 'insurance', label: 'Insurance', icon: 'shield', enabled: false },
  { value: 'bank-transfer', label: 'Bank Transfer', icon: 'wallet', enabled: false },
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

export type ClaimStatus = 
  | 'submitted' 
  | 'processing' 
  | 'approved' 
  | 'denied' 
  | 'paid';

export interface InvoiceItem {
  testCode: string;
  testName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  invoiceId: string; // INV-YYYYMMDD-XXX
  orderId: string;
  patientId: string;
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
  paymentId: string; // PAY-YYYYMMDD-XXX
  orderId: string;
  invoiceId: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  receivedBy: string;
  receiptGenerated: boolean;
  notes?: string;
  // Computed fields from relationships
  orderTotalPrice?: number;
  numberOfTests?: number;
  patientName?: string;
}

export interface InsuranceClaim {
  claimId: string; // CLM-YYYYMMDD-XXX
  orderId: string;
  invoiceId: string;
  patientId: string;
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
