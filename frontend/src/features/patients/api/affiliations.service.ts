/**
 * Affiliation API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { expectArray } from '@/lib/api/errors';
import { REFERENCE_DATA_LIMIT } from '@/lib/api/constants';
import type { AffiliationPricing } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';

export const affiliationAPI = {
  async getPricing(): Promise<AffiliationPricing[]> {
    return expectArray<AffiliationPricing>(
      await apiClient.get<AffiliationPricing[]>('/affiliations/pricing', {
        limit: String(REFERENCE_DATA_LIMIT),
      }),
      'affiliation pricing'
    );
  },

  async getPrice(duration: AffiliationDuration): Promise<AffiliationPricing> {
    return apiClient.get<AffiliationPricing>(`/affiliations/pricing/${duration}`);
  },
};
