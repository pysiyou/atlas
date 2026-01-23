/**
 * Billing Provider Component
 *
 * @deprecated This provider will be migrated to TanStack Query hooks.
 * New components should use usePaymentsList() from @/hooks/queries for payment data.
 *
 * Manages invoices, payments, and financial operations with proper error handling
 */

import React, { type ReactNode, useCallback, useState } from 'react';
import type { Invoice, Payment, InsuranceClaim } from '@/types';
import { BillingContext, type BillingContextType, type BillingError } from './BillingContext';

interface BillingProviderProps {
  children: ReactNode;
}

export const BillingProvider: React.FC<BillingProviderProps> = ({ children }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading] = useState(false);
  const [error, setError] = useState<BillingError | null>(null);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Add a new invoice
   */
  const addInvoice = useCallback(
    (invoice: Invoice) => {
      setInvoices(prev => [...prev, invoice]);
    },
    [setInvoices]
  );

  /**
   * Update an existing invoice
   */
  const updateInvoice = useCallback(
    (invoiceId: number | string, updates: Partial<Invoice>) => {
      const numericId = typeof invoiceId === 'string' ? parseInt(invoiceId, 10) : invoiceId;
      setInvoices(prev =>
        prev.map(invoice =>
          invoice.invoiceId === numericId ? { ...invoice, ...updates } : invoice
        )
      );
    },
    [setInvoices]
  );

  /**
   * Get an invoice by ID
   */
  const getInvoice = useCallback(
    (invoiceId: number | string): Invoice | undefined => {
      const numericId = typeof invoiceId === 'string' ? parseInt(invoiceId, 10) : invoiceId;
      if (isNaN(numericId)) return undefined;
      return invoices.find(invoice => invoice.invoiceId === numericId);
    },
    [invoices]
  );

  /**
   * Get invoice by order ID
   */
  const getInvoiceByOrderId = useCallback(
    (orderId: number | string): Invoice | undefined => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      if (isNaN(numericId)) return undefined;
      return invoices.find(invoice => invoice.orderId === numericId);
    },
    [invoices]
  );

  /**
   * Add a new payment
   */
  const addPayment = useCallback(
    (payment: Payment) => {
      setPayments(prev => [...prev, payment]);

      // Update invoice payment status if invoiceId exists
      if (payment.invoiceId) {
        const invoice = getInvoice(payment.invoiceId);
        if (invoice) {
          const newAmountPaid = invoice.amountPaid + payment.amount;
          const newAmountDue = invoice.total - newAmountPaid;

          let paymentStatus: 'unpaid' | 'paid' = 'unpaid';
          if (newAmountDue <= 0) {
            paymentStatus = 'paid';
          }
          // Note: Status remains 'unpaid' until fully paid

          updateInvoice(payment.invoiceId, {
            amountPaid: newAmountPaid,
            amountDue: newAmountDue,
            paymentStatus,
          });
        }
      }
    },
    [setPayments, getInvoice, updateInvoice]
  );

  /**
   * Get payments by invoice ID
   */
  const getPaymentsByInvoice = useCallback(
    (invoiceId: number | string | null): Payment[] => {
      if (invoiceId === null) return [];
      const numericId = typeof invoiceId === 'string' ? parseInt(invoiceId, 10) : invoiceId;
      if (isNaN(numericId)) return [];
      return payments.filter(payment => payment.invoiceId === numericId);
    },
    [payments]
  );

  /**
   * Get payments by order ID
   */
  const getPaymentsByOrder = useCallback(
    (orderId: number | string): Payment[] => {
      const numericId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      if (isNaN(numericId)) return [];
      return payments.filter(payment => payment.orderId === numericId);
    },
    [payments]
  );

  /**
   * Add a new insurance claim
   */
  const addClaim = useCallback(
    (claim: InsuranceClaim) => {
      setClaims(prev => [...prev, claim]);
    },
    [setClaims]
  );

  /**
   * Update an existing claim
   */
  const updateClaim = useCallback(
    (claimId: number | string, updates: Partial<InsuranceClaim>) => {
      const numericId = typeof claimId === 'string' ? parseInt(claimId, 10) : claimId;
      setClaims(prev =>
        prev.map(claim => (claim.claimId === numericId ? { ...claim, ...updates } : claim))
      );
    },
    [setClaims]
  );

  /**
   * Get outstanding invoices (not fully paid)
   */
  const getOutstandingInvoices = useCallback((): Invoice[] => {
    return invoices.filter(invoice => invoice.paymentStatus !== 'paid');
  }, [invoices]);

  /**
   * Calculate total revenue for a date range
   */
  const getTotalRevenue = useCallback(
    (startDate?: string, endDate?: string): number => {
      let filteredPayments = payments;

      if (startDate || endDate) {
        filteredPayments = payments.filter(payment => {
          const paymentDate = new Date(payment.paidAt);
          if (startDate && paymentDate < new Date(startDate)) return false;
          if (endDate && paymentDate > new Date(endDate)) return false;
          return true;
        });
      }

      return filteredPayments.reduce((total, payment) => total + payment.amount, 0);
    },
    [payments]
  );

  const value: BillingContextType = {
    invoices,
    payments,
    claims,
    loading,
    error,
    addInvoice,
    updateInvoice,
    getInvoice,
    getInvoiceByOrderId,
    addPayment,
    getPaymentsByInvoice,
    getPaymentsByOrder,
    addClaim,
    updateClaim,
    getOutstandingInvoices,
    getTotalRevenue,
    clearError,
  };

  return <BillingContext.Provider value={value}>{children}</BillingContext.Provider>;
};
