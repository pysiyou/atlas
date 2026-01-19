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
  paymentStatus: 'pending' | 'partial' | 'paid';
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
