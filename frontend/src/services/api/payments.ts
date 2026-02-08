/**
 * Payment API Service
 */
import { apiClient } from './client';
import type { Payment, PaymentMethod } from '@/types';

export interface PaymentCreate {
  orderId: number | string;
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
 * Get all payments with optional filters (requests up to backend max so tables can show full list)
 */
export const getPayments = async (filters?: PaymentFilters): Promise<Payment[]> => {
  const params = new URLSearchParams();
  params.append('limit', String(filters?.limit ?? 10000));

  if (filters?.orderId) params.append('orderId', filters.orderId);
  if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
  if (filters?.skip !== undefined) params.append('skip', filters.skip.toString());

  return apiClient.get<Payment[]>(`/payments?${params.toString()}`);
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
