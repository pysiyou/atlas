/**
 * Billing Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext, useContext } from 'react';
import type { Invoice, Payment, InsuranceClaim } from '@/types';

/**
 * Error state for billing operations
 */
export interface BillingError {
  message: string;
  code?: string;
  operation?: 'load' | 'create' | 'update' | 'delete' | 'payment';
}

/**
 * BillingContext type definition
 */
export interface BillingContextType {
  /** List of all invoices */
  invoices: Invoice[];
  /** List of all payments */
  payments: Payment[];
  /** List of all insurance claims */
  claims: InsuranceClaim[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: BillingError | null;
  /** Add a new invoice */
  addInvoice: (invoice: Invoice) => void;
  /** Update an existing invoice */
  updateInvoice: (invoiceId: number | string, updates: Partial<Invoice>) => void;
  /** Get an invoice by ID */
  getInvoice: (invoiceId: number | string) => Invoice | undefined;
  /** Get invoice by order ID */
  getInvoiceByOrderId: (orderId: number | string) => Invoice | undefined;
  /** Add a new payment */
  addPayment: (payment: Payment) => void;
  /** Get payments by invoice ID */
  getPaymentsByInvoice: (invoiceId: number | string | null) => Payment[];
  /** Get payments by order ID */
  getPaymentsByOrder: (orderId: number | string) => Payment[];
  /** Add a new insurance claim */
  addClaim: (claim: InsuranceClaim) => void;
  /** Update an existing claim */
  updateClaim: (claimId: number | string, updates: Partial<InsuranceClaim>) => void;
  /** Get outstanding invoices (not fully paid) */
  getOutstandingInvoices: () => Invoice[];
  /** Calculate total revenue for a date range */
  getTotalRevenue: (startDate?: string, endDate?: string) => number;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * React Context for Billing
 */
export const BillingContext = createContext<BillingContextType | undefined>(undefined);

/**
 * Hook to access the Billing context
 * @throws Error if used outside of BillingProvider
 */
export function useBilling(): BillingContextType {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
}
