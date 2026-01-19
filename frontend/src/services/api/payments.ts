/**
 * Payment API Service
 */
import { apiClient } from './client';
import type { Payment, PaymentMethod } from '@/types';

export interface PaymentCreate {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface PaymentFilters {
  orderId?: string;
  paymentMethod?: PaymentMethod;
  skip?: number;
  limit?: number;
}

/**
 * Get all payments with optional filters
 */
export const getPayments = async (filters?: PaymentFilters): Promise<Payment[]> => {
  const params = new URLSearchParams();
  
  if (filters?.orderId) params.append('orderId', filters.orderId);
  if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
  if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());
  if (filters?.limit !== undefined) params.append('limit', filters.limit.toString());
  
  const queryString = params.toString();
  const url = queryString ? `/payments?${queryString}` : '/payments';
  
  return apiClient.get<Payment[]>(url);
};

/**
 * Get a specific payment by ID
 */
export const getPayment = async (paymentId: string): Promise<Payment> => {
  return apiClient.get<Payment>(`/payments/${paymentId}`);
};

/**
 * Get all payments for a specific order
 */
export const getPaymentsByOrder = async (orderId: string): Promise<Payment[]> => {
  return apiClient.get<Payment[]>(`/payments/order/${orderId}`);
};

/**
 * Create a new payment
 */
export const createPayment = async (payment: PaymentCreate): Promise<Payment> => {
  return apiClient.post<Payment>('/payments', payment);
};
