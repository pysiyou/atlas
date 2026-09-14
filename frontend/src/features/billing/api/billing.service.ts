/**
 * Billing API — invoices and insurance claims.
 */
import { apiClient } from '@/lib/api/client';
import type { PaymentStatus } from '@/types';

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
  patientName: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  amountDue: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
}

export interface InsuranceClaim {
  claimId: number;
  orderId: number;
  invoiceId: number;
  patientId: number;
  insuranceProvider: string;
  insuranceNumber: string;
  claimAmount: number;
  approvedAmount?: number | null;
  claimStatus: string;
  submittedDate: string;
  processedDate?: string | null;
  denialReason?: string | null;
  notes?: string | null;
}

export interface SubmitClaimRequest {
  orderId: number;
  invoiceId: number;
  insuranceProvider: string;
  insuranceNumber: string;
  claimAmount: number;
  notes?: string;
}

export const billingAPI = {
  getInvoicesForOrder(orderId: number) {
    return apiClient.get<Invoice[]>(`/invoices/order/${orderId}`);
  },

  getInvoice(invoiceId: number) {
    return apiClient.get<Invoice>(`/invoices/${invoiceId}`);
  },

  createInvoiceForOrder(orderId: number) {
    return apiClient.post<Invoice>(`/invoices/order/${orderId}`, {});
  },

  getClaimsForOrder(orderId: number) {
    return apiClient.get<InsuranceClaim[]>(`/insurance-claims/order/${orderId}`);
  },

  submitClaim(body: SubmitClaimRequest) {
    return apiClient.post<InsuranceClaim>('/insurance-claims', body);
  },
};
