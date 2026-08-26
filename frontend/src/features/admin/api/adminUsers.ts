/**
 * Admin user management API (full user records).
 */

import { apiClient } from '@/lib/api/client';
import type { UserRole } from '@/types';

export interface AdminUserRecord {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  createdAt: string;
  loggedInAt?: string;
}

export interface CreateAdminUserRequest {
  username: string;
  name: string;
  role: UserRole;
  password: string;
  email?: string;
  phone?: string;
}

export const adminUsersAPI = {
  list(): Promise<AdminUserRecord[]> {
    return apiClient.get<AdminUserRecord[]>('/users');
  },

  create(body: CreateAdminUserRequest): Promise<AdminUserRecord> {
    return apiClient.post<AdminUserRecord>('/users', body);
  },
};
