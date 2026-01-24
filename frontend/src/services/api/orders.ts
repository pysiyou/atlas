/**
 * Order API Service
 * Handles all order-related API calls
 */

import { apiClient } from './client';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

/**
 * Pagination metadata from the API
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Filter options for orders list
 */
export interface OrdersFilter {
  patientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

export const orderAPI = {
  /**
   * Get all orders (non-paginated for backward compatibility)
   */
  async getAll(): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders');
  },

  /**
   * Get orders with pagination
   */
  async getPaginated(filters?: OrdersFilter): Promise<PaginatedResponse<Order>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.patientId) params.patientId = filters.patientId;
    if (filters?.status) params.status = filters.status;
    if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || 20));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Order>>('/orders', params);
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
  async updateTestStatus(
    orderId: string,
    testCode: string,
    status: string,
    additionalData?: Record<string, unknown>
  ): Promise<Order> {
    return apiClient.patch<Order, Record<string, unknown>>(`/orders/${orderId}/tests/${testCode}`, {
      status,
      ...additionalData,
    });
  },

  /**
   * Mark test as having critical values
   */
  async markTestCritical(orderId: string, testCode: string, notifiedTo: string): Promise<Order> {
    return apiClient.post<Order, Record<string, string>>(
      `/orders/${orderId}/tests/${testCode}/critical`,
      { notifiedTo }
    );
  },

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
    amountPaid?: number
  ): Promise<Order> {
    return apiClient.patch<Order, Record<string, unknown>>(`/orders/${orderId}/payment`, {
      paymentStatus,
      amountPaid,
    });
  },
};
