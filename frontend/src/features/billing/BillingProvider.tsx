/**
 * Billing Provider Component
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
  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
  }, [setInvoices]);

  /**
   * Update an existing invoice
   */
  const updateInvoice = useCallback((invoiceId: string, updates: Partial<Invoice>) => {
    setInvoices(prev => 
      prev.map(invoice => 
        invoice.invoiceId === invoiceId ? { ...invoice, ...updates } : invoice
      )
    );
  }, [setInvoices]);

  /**
   * Get an invoice by ID
   */
  const getInvoice = useCallback((invoiceId: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.invoiceId === invoiceId);
  }, [invoices]);

  /**
   * Get invoice by order ID
   */
  const getInvoiceByOrderId = useCallback((orderId: string): Invoice | undefined => {
    return invoices.find(invoice => invoice.orderId === orderId);
  }, [invoices]);

  /**
   * Add a new payment
   */
  const addPayment = useCallback((payment: Payment) => {
    setPayments(prev => [...prev, payment]);
    
    // Update invoice payment status if invoiceId exists
    if (payment.invoiceId) {
      const invoice = getInvoice(payment.invoiceId);
      if (invoice) {
        const newAmountPaid = invoice.amountPaid + payment.amount;
        const newAmountDue = invoice.total - newAmountPaid;
        
        let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
        if (newAmountDue <= 0) {
          paymentStatus = 'paid';
        } else if (newAmountPaid > 0) {
          paymentStatus = 'partial';
        }
        
        updateInvoice(payment.invoiceId, {
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          paymentStatus,
        });
      }
    }
  }, [setPayments, getInvoice, updateInvoice]);

  /**
   * Get payments by invoice ID
   */
  const getPaymentsByInvoice = useCallback((invoiceId: string): Payment[] => {
    return payments.filter(payment => payment.invoiceId === invoiceId);
  }, [payments]);

  /**
   * Get payments by order ID
   */
  const getPaymentsByOrder = useCallback((orderId: string): Payment[] => {
    return payments.filter(payment => payment.orderId === orderId);
  }, [payments]);

  /**
   * Add a new insurance claim
   */
  const addClaim = useCallback((claim: InsuranceClaim) => {
    setClaims(prev => [...prev, claim]);
  }, [setClaims]);

  /**
   * Update an existing claim
   */
  const updateClaim = useCallback((claimId: string, updates: Partial<InsuranceClaim>) => {
    setClaims(prev => 
      prev.map(claim => 
        claim.claimId === claimId ? { ...claim, ...updates } : claim
      )
    );
  }, [setClaims]);

  /**
   * Get outstanding invoices (not fully paid)
   */
  const getOutstandingInvoices = useCallback((): Invoice[] => {
    return invoices.filter(invoice => invoice.paymentStatus !== 'paid');
  }, [invoices]);

  /**
   * Calculate total revenue for a date range
   */
  const getTotalRevenue = useCallback((startDate?: string, endDate?: string): number => {
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
  }, [payments]);

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
