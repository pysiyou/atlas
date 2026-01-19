/**
 * Order API Service
 * Handles all order-related API calls
 */

import { apiClient } from './client';
import type { Order } from '@/types';

export const orderAPI = {
  /**
   * Get all orders
   */
  async getAll(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders');
  },

  /**
   * Get order by ID
   */
  async getById(orderId: string): Promise<Order | null> {
    return apiClient.get<Order>(`/orders/${orderId}`);
  },

  /**
   * Get orders by patient ID
   */
  async getByPatientId(patientId: string): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders', { patientId });
  },

  /**
   * Create new order
   */
  async create(order: Partial<Order>): Promise<Order> {
    return apiClient.post<Order, Partial<Order>>('/orders', order);
  },

  /**
   * Update order
   */
  async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    return apiClient.put<Order, Partial<Order>>(`/orders/${orderId}`, updates);
  },

  /**
   * Delete order
   */
  async delete(orderId: string): Promise<void> {
    return apiClient.delete<void>(`/orders/${orderId}`);
  },

  /**
   * Update test status within an order
   */
  async updateTestStatus(orderId: string, testCode: string, status: string, additionalData?: Record<string, unknown>): Promise<Order> {
    return apiClient.patch<Order, Record<string, unknown>>(`/orders/${orderId}/tests/${testCode}`, { status, ...additionalData });
  },

  /**
   * Mark test as having critical values
   */
  async markTestCritical(orderId: string, testCode: string, notifiedTo: string): Promise<Order> {
    return apiClient.post<Order, Record<string, string>>(`/orders/${orderId}/tests/${testCode}/critical`, { notifiedTo });
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(orderId: string, paymentStatus: string, amountPaid?: number): Promise<Order> {
    return apiClient.patch<Order, Record<string, unknown>>(`/orders/${orderId}/payment`, { paymentStatus, amountPaid });
  },
};
