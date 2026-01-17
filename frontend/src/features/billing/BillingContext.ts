/**
 * Billing Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext } from 'react';
import type { Invoice, Payment, InsuranceClaim } from '@/types';

/**
 * BillingContext type definition
 */
export interface BillingContextType {
  invoices: Invoice[];
  payments: Payment[];
  claims: InsuranceClaim[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => void;
  getInvoice: (invoiceId: string) => Invoice | undefined;
  getInvoiceByOrderId: (orderId: string) => Invoice | undefined;
  addPayment: (payment: Payment) => void;
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  getPaymentsByOrder: (orderId: string) => Payment[];
  addClaim: (claim: InsuranceClaim) => void;
  updateClaim: (claimId: string, updates: Partial<InsuranceClaim>) => void;
  getOutstandingInvoices: () => Invoice[];
  getTotalRevenue: (startDate?: string, endDate?: string) => number;
}

/**
 * React Context for Billing
 */
export const BillingContext = createContext<BillingContextType | undefined>(undefined);
