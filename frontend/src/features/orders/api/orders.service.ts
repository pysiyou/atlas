/**
 * Order API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT, DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';

export type { PaginatedResponse, PaginationMeta };

export interface OrdersFilter {
  patientId?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  pageSize?: number;
}

export const orderAPI = {
  /** Workflow-scoped order fetch (not a full-table scan). */
  async getAll(options?: { signal?: AbortSignal }): Promise<Order[]> {
    return apiClient.get<Order[]>(
      '/orders',
      { limit: String(WORKFLOW_QUERY_LIMIT), sort: 'updatedAt' },
      options
    );
  },

  async getPaginated(filters?: OrdersFilter): Promise<PaginatedResponse<Order>> {
    const params: Record<string, string> = { paginated: 'true', sort: 'updatedAt' };

    if (filters?.patientId) params.patientId = filters.patientId;
    if (filters?.status) params.status = filters.status;
    if (filters?.paymentStatus) params.paymentStatus = filters.paymentStatus;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || DEFAULT_LIST_PAGE_SIZE));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Order>>('/orders', params);
  },

  async getById(orderId: string, options?: { signal?: AbortSignal }): Promise<Order | null> {
    return apiClient.get<Order>(`/orders/${orderId}`, undefined, options);
  },

  async getByPatientId(patientId: string): Promise<Order[]> {
    return apiClient.get<Order[]>('/orders', { patientId, sort: 'updatedAt' });
  },

  async create(order: Partial<Order>): Promise<Order> {
    return apiClient.post<Order>('/orders', order);
  },

  async update(orderId: string, updates: Partial<Order>): Promise<Order> {
    return apiClient.put<Order>(`/orders/${orderId}`, updates);
  },

  async delete(orderId: string): Promise<void> {
    return apiClient.delete<void>(`/orders/${orderId}`);
  },

  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
    amountPaid?: number
  ): Promise<Order> {
    return apiClient.patch<Order>(`/orders/${orderId}/payment`, {
      paymentStatus,
      amountPaid,
    });
  },
};
