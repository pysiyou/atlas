/**
 * Users API service — lookup for display names across the app.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiUserLookupResponse } from '@/lib/api/types';

export type UserLookupResponse = ApiUserLookupResponse;

export interface UserDisplayInfo {
  id: string;
  name: string;
  username: string;
}

export const usersAPI = {
  lookup(): Promise<UserLookupResponse[]> {
    return apiClient.get<UserLookupResponse[]>('/users/lookup');
  },
};
